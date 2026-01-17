/**
 * Database types for Supabase
 *
 * These types match the schema defined in supabase/schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DonationMode = "random" | "priority";
export type DonationStatus = "pending" | "completed" | "failed";

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
          donation_mode: DonationMode;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          selected_charity_id?: string | null;
          roundup_enabled?: boolean;
          donation_mode?: DonationMode;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          selected_charity_id?: string | null;
          roundup_enabled?: boolean;
          donation_mode?: DonationMode;
          created_at?: string;
        };
      };
      charities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo: string | null;
          logo_url: string | null;
          website_url: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_charities: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          goal_amount: number;
          current_amount: number;
          priority: number;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          charity_id: string;
          goal_amount: number;
          current_amount?: number;
          priority?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          charity_id?: string;
          goal_amount?: number;
          current_amount?: number;
          priority?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
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
          linked_account_id: string | null;
          plaid_transaction_id: string | null;
          amount: number;
          roundup_amount: number | null;
          merchant_name: string | null;
          category: string[] | null;
          date: string;
          is_donation: boolean;
          is_pending: boolean;
          processed_for_donation: boolean;
          donated_to_charity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          linked_account_id?: string | null;
          plaid_transaction_id?: string | null;
          amount: number;
          roundup_amount?: number | null;
          merchant_name?: string | null;
          category?: string[] | null;
          date: string;
          is_donation?: boolean;
          is_pending?: boolean;
          processed_for_donation?: boolean;
          donated_to_charity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          linked_account_id?: string | null;
          plaid_transaction_id?: string | null;
          amount?: number;
          roundup_amount?: number | null;
          merchant_name?: string | null;
          category?: string[] | null;
          date?: string;
          is_donation?: boolean;
          is_pending?: boolean;
          processed_for_donation?: boolean;
          donated_to_charity_id?: string | null;
          created_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          amount: number;
          transaction_count: number;
          status: DonationStatus;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          charity_id: string;
          amount: number;
          transaction_count?: number;
          status?: DonationStatus;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          charity_id?: string;
          amount?: number;
          transaction_count?: number;
          status?: DonationStatus;
          processed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      donation_mode: DonationMode;
      donation_status: DonationStatus;
    };
  };
}

// Helper types for use throughout the app
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Charity = Database["public"]["Tables"]["charities"]["Row"];
export type UserCharity = Database["public"]["Tables"]["user_charities"]["Row"];
export type LinkedAccount = Database["public"]["Tables"]["linked_accounts"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
