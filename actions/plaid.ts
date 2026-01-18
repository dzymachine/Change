"use server";

/**
 * Server Actions for Plaid operations
 */

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { revalidatePath } from "next/cache";

interface ExchangeTokenResult {
  success: boolean;
  error?: string;
}

/**
 * Exchange Plaid public token for access token and store
 */
export async function exchangePlaidToken(
  publicToken: string,
  metadata: {
    institutionName: string;
    institutionId: string;
  }
): Promise<ExchangeTokenResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("[exchangePlaidToken] Starting exchange for user:", user.id);
    
    // Exchange public token for access token directly with Plaid
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;
    console.log("[exchangePlaidToken] Got access token for item:", item_id);

    // Store in database using admin client to bypass RLS
    const { error: dbError } = await supabaseAdmin
      .from("linked_accounts")
      .insert({
        user_id: user.id,
        plaid_item_id: item_id,
        plaid_access_token: access_token,
        institution_name: metadata.institutionName,
        institution_id: metadata.institutionId,
      });

    if (dbError) {
      console.error("[exchangePlaidToken] Database error:", dbError);
      return { success: false, error: "Failed to save account" };
    }

    console.log("[exchangePlaidToken] Account saved, priming initial sync...");
    
    // Prime the initial sync (runs in background)
    syncTransactionsForItem(item_id, { trigger: "link" }).catch((err) => {
      console.error("[exchangePlaidToken] Initial sync failed:", err);
    });

    revalidatePath("/settings");
    revalidatePath("/onboarding/plaid");
    revalidatePath("/dashboard");

    console.log("[exchangePlaidToken] Success!");
    return { success: true };
  } catch (error) {
    console.error("[exchangePlaidToken] Error:", error);
    return { success: false, error: "Failed to link account" };
  }
}

/**
 * Unlink a bank account
 */
export async function unlinkBankAccount(accountId: string): Promise<ExchangeTokenResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("linked_accounts")
      .update({ is_active: false })
      .eq("id", accountId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // TODO: Call Plaid to remove the item
    // await plaidClient.itemRemove({ access_token });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Unlink account error:", error);
    return { success: false, error: "Failed to unlink account" };
  }
}

/**
 * Get linked accounts for current user
 */
export async function getLinkedAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("linked_accounts")
    .select("id, institution_name, institution_id, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return data || [];
}
