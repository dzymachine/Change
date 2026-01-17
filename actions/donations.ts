"use server";

/**
 * Server Actions for donation operations
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Select a charity for donations
 */
export async function selectCharity(charityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ selected_charity_id: charityId })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/onboarding/charity");

  return { success: true };
}

/**
 * Toggle round-up feature
 */
export async function toggleRoundups(enabled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ roundup_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");

  return { success: true };
}

/**
 * Get available charities
 */
export async function getCharities() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("charities")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return data || [];
}

/**
 * Get donation history for current user
 */
export async function getDonationHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("donations")
    .select(`
      *,
      charity:charities(name, logo_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

/**
 * Get dashboard stats for current user
 */
export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get total donated
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "completed");

  const totalDonated = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;

  // Get transaction count
  const { count: transactionsCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("processed_for_donation", true);

  // Get current charity
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      selected_charity_id,
      charity:charities(name)
    `)
    .eq("id", user.id)
    .single();

  // Get pending roundup amount
  const { data: pendingTx } = await supabase
    .from("transactions")
    .select("roundup_amount")
    .eq("user_id", user.id)
    .eq("processed_for_donation", false)
    .eq("is_pending", false);

  const pendingRoundup = pendingTx?.reduce((sum, tx) => sum + (tx.roundup_amount || 0), 0) || 0;

  return {
    totalDonated,
    transactionsCount: transactionsCount || 0,
    currentCharity: (profile?.charity as { name: string } | null)?.name || null,
    monthlyAverage: totalDonated / 12, // Simplified
    pendingRoundup,
  };
}
