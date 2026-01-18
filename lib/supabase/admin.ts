import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}

// Legacy export for backward compatibility - use getSupabaseAdmin() instead
// This getter ensures lazy initialization
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});
