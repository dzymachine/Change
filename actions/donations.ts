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

interface CharityGoal {
  charityId: string;
  goalAmount: number;
  priority?: number;
}

/**
 * Save charity goals during onboarding
 * Creates entries in user_charities table
 * Called when there's only 1 charity (skips donation-mode page)
 */
export async function saveCharityGoals(
  goals: CharityGoal[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Delete existing user_charities for this user (fresh start on each onboarding)
  await supabase.from("user_charities").delete().eq("user_id", user.id);

  // Insert new charity goals with priority based on order
  const inserts = goals.map((goal, index) => ({
    user_id: user.id,
    charity_id: goal.charityId,
    goal_amount: goal.goalAmount,
    current_amount: 0,
    priority: goal.priority || index + 1,
    is_completed: false,
  }));

  const { error } = await supabase.from("user_charities").insert(inserts);

  if (error) {
    return { success: false, error: error.message };
  }

  // Set the first charity as the selected one on the profile
  if (goals.length > 0) {
    await supabase
      .from("profiles")
      .update({ selected_charity_id: goals[0].charityId })
      .eq("id", user.id);
  }

  revalidatePath("/onboarding/goals");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Save donation mode and charity goals with priorities
 * Called from donation-mode page when user has >1 charity
 */
export async function saveDonationMode(
  mode: "random" | "priority",
  goals: CharityGoal[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Update donation_mode on profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      donation_mode: mode,
      selected_charity_id: goals[0]?.charityId,
    })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Delete existing user_charities for this user
  await supabase.from("user_charities").delete().eq("user_id", user.id);

  // Insert new charity goals with priority
  const inserts = goals.map((goal, index) => ({
    user_id: user.id,
    charity_id: goal.charityId,
    goal_amount: goal.goalAmount,
    current_amount: 0,
    priority: goal.priority || index + 1,
    is_completed: false,
  }));

  const { error } = await supabase.from("user_charities").insert(inserts);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/onboarding/donation-mode");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Update donation mode from dashboard
 */
export async function updateDonationMode(
  mode: "random" | "priority"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ donation_mode: mode })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Update charity priorities from dashboard
 */
export async function updateCharityPriorities(
  priorities: { charityId: string; priority: number }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Update each charity's priority
  for (const item of priorities) {
    const { error } = await supabase
      .from("user_charities")
      .update({ priority: item.priority })
      .eq("user_id", user.id)
      .eq("charity_id", item.charityId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  // Update selected_charity_id to the highest priority charity
  const topCharity = priorities.find((p) => p.priority === 1);
  if (topCharity) {
    await supabase
      .from("profiles")
      .update({ selected_charity_id: topCharity.charityId })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");

  return { success: true };
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
  revalidatePath("/onboarding/charities");

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

  const totalDonated =
    donations?.reduce(
      (sum: number, d: { amount: number | null }) => sum + (d.amount ?? 0),
      0
    ) ?? 0;

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

  const charity = (profile as unknown as {
    charity?: { name: string } | { name: string }[] | null;
  } | null)?.charity;
  const currentCharity = Array.isArray(charity)
    ? charity[0]?.name ?? null
    : charity?.name ?? null;

  // Get pending roundup amount
  const { data: pendingTx } = await supabase
    .from("transactions")
    .select("roundup_amount")
    .eq("user_id", user.id)
    .eq("processed_for_donation", false)
    .eq("is_pending", false);

  const pendingRoundup =
    pendingTx?.reduce(
      (sum: number, tx: { roundup_amount: number | null }) =>
        sum + (tx.roundup_amount ?? 0),
      0
    ) ?? 0;

  return {
    totalDonated,
    transactionsCount: transactionsCount || 0,
    currentCharity,
    monthlyAverage: totalDonated / 12, // Simplified
    pendingRoundup,
  };
}
