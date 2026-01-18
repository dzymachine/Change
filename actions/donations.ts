"use server";

/**
 * Server Actions for donation operations
 */

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

interface CharityInfo {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  imageUrl?: string;
}

interface CharityGoal {
  charityId: string;
  charityInfo?: CharityInfo;
  goalAmount: number;
  priority?: number;
}

/**
 * Ensure charities exist in our local database
 * This handles GlobalGiving charities that might not be in our DB yet
 */
async function ensureCharitiesExist(charities: CharityInfo[]): Promise<void> {
  if (charities.length === 0) return;

  const upserts = charities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || null,
    logo: c.logo || "🌍",
    logo_url: c.imageUrl || null,
    is_active: true,
  }));

  console.log("[ensureCharitiesExist] Upserting charities:", upserts.map(c => ({ id: c.id, name: c.name })));

  // Use admin client to bypass RLS
  const { error } = await supabaseAdmin
    .from("charities")
    .upsert(upserts, { onConflict: "id" });

  if (error) {
    console.error("[ensureCharitiesExist] Error upserting charities:", error);
  } else {
    console.log("[ensureCharitiesExist] Charities upserted successfully");
  }
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
    console.log("[saveCharityGoals] No authenticated user found");
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("[saveCharityGoals] Starting save for user:", user.id);
    console.log("[saveCharityGoals] Goals count:", goals.length);

    // Delete existing user_charities for this user (fresh start on each onboarding)
    const { error: deleteError } = await supabaseAdmin.from("user_charities").delete().eq("user_id", user.id);
    if (deleteError) {
      console.error("[saveCharityGoals] Error deleting existing user_charities:", deleteError);
    }

    // Insert new charity goals with priority and denormalized charity info
    const inserts = goals.map((goal, index) => ({
      user_id: user.id,
      charity_id: goal.charityId,
      charity_name: goal.charityInfo?.name || "Unknown Charity",
      charity_logo: goal.charityInfo?.logo || "🎯",
      charity_image_url: goal.charityInfo?.imageUrl || null,
      goal_amount: goal.goalAmount,
      current_amount: 0,
      priority: goal.priority || index + 1,
      is_completed: false,
    }));

    console.log("[saveCharityGoals] Inserting user_charities:", inserts);

    const { error } = await supabaseAdmin.from("user_charities").insert(inserts);

    if (error) {
      console.error("[saveCharityGoals] Error inserting user_charities:", error);
      return { success: false, error: error.message };
    }
    
    console.log("[saveCharityGoals] user_charities inserted successfully");

    // Set the first charity as the selected one and mark onboarding started
    if (goals.length > 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ 
          selected_charity_id: goals[0].charityId,
          roundup_enabled: true,
        })
        .eq("id", user.id);
    }

    revalidatePath("/onboarding/goals");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("saveCharityGoals error:", error);
    return { success: false, error: "Failed to save charity goals" };
  }
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
    console.log("[saveDonationMode] No authenticated user found");
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("[saveDonationMode] Starting save for user:", user.id);
    console.log("[saveDonationMode] Mode:", mode);
    console.log("[saveDonationMode] Goals count:", goals.length);

    // Update donation_mode on profile
    console.log("[saveDonationMode] Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        donation_mode: mode,
        selected_charity_id: goals[0]?.charityId,
        roundup_enabled: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[saveDonationMode] Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }
    console.log("[saveDonationMode] Profile updated");

    // Delete existing user_charities for this user
    const { error: deleteError } = await supabaseAdmin.from("user_charities").delete().eq("user_id", user.id);
    if (deleteError) {
      console.error("[saveDonationMode] Error deleting user_charities:", deleteError);
    }

    // Insert new charity goals with priority and denormalized charity info
    const inserts = goals.map((goal, index) => ({
      user_id: user.id,
      charity_id: goal.charityId,
      charity_name: goal.charityInfo?.name || "Unknown Charity",
      charity_logo: goal.charityInfo?.logo || "🎯",
      charity_image_url: goal.charityInfo?.imageUrl || null,
      goal_amount: goal.goalAmount,
      current_amount: 0,
      priority: goal.priority || index + 1,
      is_completed: false,
    }));

    console.log("[saveDonationMode] Inserting user_charities:", inserts);

    const { error } = await supabaseAdmin.from("user_charities").insert(inserts);

    if (error) {
      console.error("[saveDonationMode] Error inserting user_charities:", error);
      return { success: false, error: error.message };
    }
    
    console.log("[saveDonationMode] user_charities inserted successfully");

    revalidatePath("/onboarding/donation-mode");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("saveDonationMode error:", error);
    return { success: false, error: "Failed to save donation mode" };
  }
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
