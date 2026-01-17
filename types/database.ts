/**
 * Database types for Supabase
 * 
 * TODO: Generate this automatically using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 * 
 * For now, we define the types manually based on our schema
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
          email: string | null;
          display_name: string | null;
          onboarding_completed: boolean;
          selected_charity_id: string | null;
          roundup_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          selected_charity_id?: string | null;
          roundup_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          selected_charity_id?: string | null;
          roundup_enabled?: boolean;
          created_at?: string;
        };
      };
      linked_accounts: {
        Row: {
          id: string;
          user_id: string;
          plaid_item_id: string;
          plaid_access_token: string;
          institution_name: string | null;
          institution_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plaid_item_id: string;
          plaid_access_token: string;
          institution_name?: string | null;
          institution_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plaid_item_id?: string;
          plaid_access_token?: string;
          institution_name?: string | null;
          institution_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          linked_account_id: string;
          plaid_transaction_id: string;
          amount: number;
          roundup_amount: number | null;
          merchant_name: string | null;
          category: string[] | null;
          date: string;
          is_donation: boolean;
          is_pending: boolean;
          processed_for_donation: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          linked_account_id: string;
          plaid_transaction_id: string;
          amount: number;
          roundup_amount?: number | null;
          merchant_name?: string | null;
          category?: string[] | null;
          date: string;
          is_donation?: boolean;
          is_pending?: boolean;
          processed_for_donation?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          linked_account_id?: string;
          plaid_transaction_id?: string;
          amount?: number;
          roundup_amount?: number | null;
          merchant_name?: string | null;
          category?: string[] | null;
          date?: string;
          is_donation?: boolean;
          is_pending?: boolean;
          processed_for_donation?: boolean;
          created_at?: string;
        };
      };
      charities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          is_active?: boolean;
        };
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          amount: number;
          transaction_count: number;
          status: string;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          charity_id: string;
          amount: number;
          transaction_count: number;
          status?: string;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          charity_id?: string;
          amount?: number;
          transaction_count?: number;
          status?: string;
          processed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
