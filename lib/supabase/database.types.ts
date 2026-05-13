/**
 * Database types — auto-generated placeholder.
 * Regenerate with: pnpm db:types
 *
 * After running migrations, replace this file with the output of:
 *   supabase gen types typescript --local > lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          date_of_birth: string | null;
          language: string;
          subscription_tier: 'free' | 'pro_monthly' | 'pro_yearly';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_current_period_end: string | null;
          deletion_status: 'none' | 'requested' | 'cancelled' | 'in_progress' | 'completed';
          deletion_requested_at: string | null;
          deletion_scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      consent_log: {
        Row: {
          id: string;
          user_id: string;
          purpose: 'data_processing' | 'claude_api_processing' | 'product_improvement' | 'marketing_emails';
          granted: boolean;
          policy_version: string;
          ip_address: string | null;
          user_agent: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['consent_log']['Row'], 'id' | 'granted_at'> & {
          id?: string;
          granted_at?: string;
        };
        Update: never;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          file_name: string;
          file_size_bytes: number;
          file_hash: string;
          mime_type: string;
          document_type: 'arztbrief' | 'laborwerte' | 'rezept' | 'ueberweisung' | 'befund_bildgebung' | 'impfpass' | 'unknown';
          uploaded_at: string;
          parsed_at: string | null;
          parsing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'requires_review';
          parsing_error: string | null;
          raw_extracted_json: Json | null;
          parser_tier: number | null;
          parser_model: string | null;
          confidence: number | null;
          page_count: number | null;
        };
        Insert: Partial<Database['public']['Tables']['documents']['Row']> & {
          user_id: string; storage_path: string; file_name: string;
          file_size_bytes: number; file_hash: string; mime_type: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Row']>;
      };
      practitioners: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          title: string | null;
          specialty: string | null;
          praxis_name: string | null;
          lanr: string | null;
          bsnr: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          fax: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['practitioners']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['practitioners']['Row']>;
      };
      medical_events: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          event_time: string | null;
          event_type: 'consultation' | 'diagnosis' | 'medication' | 'lab_result' | 'imaging' | 'vaccination' | 'prescription' | 'referral' | 'hospitalization';
          title: string;
          summary: string | null;
          source_document_id: string | null;
          practitioner_id: string | null;
          icd10_codes: string[] | null;
          confidence: number | null;
          is_user_verified: boolean;
          user_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['medical_events']['Row']> & {
          user_id: string; event_date: string; event_type: Database['public']['Tables']['medical_events']['Row']['event_type']; title: string;
        };
        Update: Partial<Database['public']['Tables']['medical_events']['Row']>;
      };
      lab_results: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          loinc_code: string | null;
          parameter_name_de: string;
          parameter_name_en: string | null;
          value: number | null;
          value_text: string | null;
          unit: string | null;
          reference_low: number | null;
          reference_high: number | null;
          reference_text: string | null;
          flag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | null;
          material: string | null;
          measured_at: string;
          lab_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['lab_results']['Row']> & {
          user_id: string; parameter_name_de: string; measured_at: string;
        };
        Update: Partial<Database['public']['Tables']['lab_results']['Row']>;
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          substance_inn: string;
          trade_name: string | null;
          pzn: string | null;
          atc_code: string | null;
          dose: string | null;
          form: string | null;
          frequency: string | null;
          route: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          prescribed_by: string | null;
          indication: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['medications']['Row']> & {
          user_id: string; substance_inn: string;
        };
        Update: Partial<Database['public']['Tables']['medications']['Row']>;
      };
      diagnoses: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          icd10: string | null;
          text: string;
          diagnosis_type: 'haupt' | 'neben' | 'verdacht' | 'anamnese' | null;
          is_chronic: boolean;
          side: 'links' | 'rechts' | 'beidseits' | null;
          first_documented: string | null;
          last_documented: string | null;
          resolved_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['diagnoses']['Row']> & {
          user_id: string; text: string;
        };
        Update: Partial<Database['public']['Tables']['diagnoses']['Row']>;
      };
      vaccinations: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          vaccine_name: string;
          vaccine_code: string | null;
          manufacturer: string | null;
          batch_number: string | null;
          administered_at: string;
          administered_by: string | null;
          dose_number: number | null;
          next_due: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['vaccinations']['Row']> & {
          user_id: string; vaccine_name: string; administered_at: string;
        };
        Update: Partial<Database['public']['Tables']['vaccinations']['Row']>;
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['chat_conversations']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['chat_conversations']['Row']>;
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'tool';
          content: string;
          tool_calls: Json | null;
          tool_results: Json | null;
          citations: Json | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['chat_messages']['Row']> & {
          conversation_id: string; user_id: string; role: 'user' | 'assistant' | 'tool'; content: string;
        };
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>;
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_log']['Row']> & { action: string };
        Update: never;
      };
    };
    Views: {
      active_medications: {
        Row: Database['public']['Tables']['medications']['Row'] & {
          prescribed_by_name: string | null;
          prescribed_by_specialty: string | null;
        };
      };
    };
    Functions: {
      get_latest_lab_value: {
        Args: { p_loinc_codes: string[]; p_limit?: number };
        Returns: Array<{
          value: number;
          unit: string;
          parameter_name_de: string;
          measured_at: string;
          flag: string;
          reference_low: number | null;
          reference_high: number | null;
          document_id: string | null;
          document_file_name: string | null;
          ordered_by_name: string | null;
        }>;
      };
      get_lab_history: {
        Args: { p_loinc_codes: string[]; p_from_date?: string; p_to_date?: string };
        Returns: Array<{
          value: number;
          unit: string;
          parameter_name_de: string;
          measured_at: string;
          flag: string;
          reference_low: number | null;
          reference_high: number | null;
          loinc_code: string;
        }>;
      };
    };
  };
}
