"use server";

/**
 * Server Actions for Plaid operations
 */

import { createClient } from "@/lib/supabase/server";
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
    // Call our API route to handle the exchange
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/exchange-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token: publicToken,
          metadata: {
            institution: {
              name: metadata.institutionName,
              institution_id: metadata.institutionId,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to link account" };
    }

    revalidatePath("/settings");
    revalidatePath("/onboarding");

    return { success: true };
  } catch (error) {
    console.error("Exchange token error:", error);
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
