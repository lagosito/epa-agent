import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODEL_CHAT } from '@/lib/claude/client';
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/claude/chatbot-prompt';
import { CHATBOT_TOOLS, executeChatTool } from '@/lib/claude/chatbot-tools';
import { audit } from '@/lib/utils/audit';

const MAX_TOOL_ITERATIONS = 5;

interface ChatRequestBody {
  conversation_id?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Free-tier rate limit: 10 messages per day
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_tier === 'free') {
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (count && count >= 10) {
      return NextResponse.json(
        { error: 'rate_limit', message: 'Tageslimit erreicht (10 Nachrichten/Tag im Free-Tier).' },
        { status: 429 }
      );
    }
  }

  const body: ChatRequestBody = await req.json();
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'empty_message' }, { status: 400 });
  }

  // Resolve / create conversation
  let conversationId = body.conversation_id;
  if (!conversationId) {
    const { data: conv, error: convErr } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: body.message.substring(0, 60),
      })
      .select('id')
      .single();
    if (convErr || !conv) {
      return NextResponse.json({ error: 'failed_to_create_conversation' }, { status: 500 });
    }
    conversationId = conv.id;
  }

  // Load history (last 20 messages)
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content, tool_calls, tool_results')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Persist user message
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: body.message,
  });

  // Build messages for Claude
  const messages: any[] = (history ?? []).map((h: any) => ({
    role: h.role === 'tool' ? 'user' : h.role,
    content: h.content,
  }));
  messages.push({ role: 'user', content: body.message });

  // Tool-calling loop
  let assistantText = '';
  const allCitations: any[] = [];
  const toolCallsRecord: any[] = [];

  try {
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await anthropic.messages.create({
        model: MODEL_CHAT,
        max_tokens: 1024,
        system: CHATBOT_SYSTEM_PROMPT,
        tools: CHATBOT_TOOLS,
        messages,
      });

      // Collect text and tool_use blocks
      const textBlocks = response.content.filter((b: any) => b.type === 'text');
      const toolUseBlocks = response.content.filter((b: any) => b.type === 'tool_use');

      assistantText += textBlocks.map((b: any) => b.text).join('\n');

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        break;
      }

      // Append assistant turn to messages
      messages.push({ role: 'assistant', content: response.content });

      // Execute tools
      const toolResults: any[] = [];
      for (const tool of toolUseBlocks) {
        const tu = tool as any;
        toolCallsRecord.push({ name: tu.name, input: tu.input });
        const { result, citations } = await executeChatTool(tu.name, tu.input);
        if (citations) allCitations.push(...citations);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result).substring(0, 8000),
        });
      }

      // Append tool results
      messages.push({ role: 'user', content: toolResults });
    }

    // Persist assistant message
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: assistantText,
      tool_calls: toolCallsRecord.length > 0 ? toolCallsRecord : null,
      citations: allCitations.length > 0 ? allCitations : null,
    });

    await audit({
      userId: user.id,
      action: 'chat.message_sent',
      resourceType: 'chat_conversation',
      resourceId: conversationId,
      metadata: {
        tool_calls: toolCallsRecord.length,
        message_length: body.message.length,
      },
    });

    return NextResponse.json({
      conversation_id: conversationId,
      response: assistantText,
      citations: allCitations,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[chat] Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
