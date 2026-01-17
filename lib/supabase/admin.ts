import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 * 
 * Uses the service role key for elevated permissions.
 * NEVER import this in client components!
 * 
 * Use cases:
 * - Background jobs (transaction syncing)
 * - Webhooks (Plaid, Stripe)
 * - Admin operations
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
