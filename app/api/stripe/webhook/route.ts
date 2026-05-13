import { NextRequest, NextResponse } from 'next/server';
import { stripe, tierFromPriceId } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        const subId = session.subscription as string;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id;
          await supabase
            .from('profiles')
            .update({
              subscription_tier: tierFromPriceId(priceId),
              stripe_subscription_id: subId,
              subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id;
        await supabase
          .from('profiles')
          .update({
            subscription_tier: sub.status === 'active' || sub.status === 'trialing'
              ? tierFromPriceId(priceId)
              : 'free',
            stripe_subscription_id: sub.id,
            subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            subscription_current_period_end: null,
          })
          .eq('id', userId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] Handler error:', err);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }
}
