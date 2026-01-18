/**
 * Donation allocation logic
 *
 * Handles allocating round-ups to charities based on:
 * - Random mode: randomly select from user's charities
 * - Priority mode: fill goals in priority order
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendDonationEmail } from "@/lib/email";

interface AllocationResult {
  success: boolean;
  charityId?: string;
  allocations?: { charityId: string; amount: number }[];
  unallocatedAmount?: number;
  error?: string;
}

interface UserCharity {
  id: string;
  charity_id: string;
  goal_amount: number;
  current_amount: number;
  priority: number;
  is_completed: boolean;
}

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return Number(value);
}

/**
 * Allocate a round-up amount to the appropriate charity
 * Based on user's donation mode (random or priority)
 */
export async function allocateRoundupToCharity(
  userId: string,
  transactionId: string,
  roundupAmount: number
): Promise<AllocationResult> {
  // Get user's profile for donation mode
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("donation_mode, roundup_enabled")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "User profile not found" };
  }

  if (!profile.roundup_enabled) {
    return { success: false, error: "Round-ups disabled for user" };
  }

  // Get user's charities
  const { data: userCharities, error: charitiesError } = await supabaseAdmin
    .from("user_charities")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .order("priority", { ascending: true });

  if (charitiesError || !userCharities || userCharities.length === 0) {
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({
        processed_for_donation: true,
        donated_to_charity_id: null,
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[allocateRoundupToCharity] Failed to mark transaction as processed:", updateError);
    }

    return {
      success: true,
      allocations: [],
      unallocatedAmount: roundToCents(toNumber(roundupAmount)),
    };
  }

  const mode = (profile.donation_mode === "random" ? "random" : "priority") as
    | "random"
    | "priority";

  let remaining = roundToCents(toNumber(roundupAmount));
  const allocations: { charityId: string; amount: number }[] = [];
  const completedGoals: { charityId: string; goalAmount: number }[] = [];

  const updateCharity = async (
    charity: UserCharity,
    addAmount: number
  ): Promise<{ newCurrent: number; isCompleted: boolean; goalAmount: number }> => {
    const goal = Math.max(0, roundToCents(toNumber(charity.goal_amount)));
    const current = Math.max(0, roundToCents(toNumber(charity.current_amount)));

    const needed = Math.max(0, roundToCents(goal - current));
    const allocated = Math.max(0, Math.min(roundToCents(addAmount), needed));
    const newCurrent = roundToCents(current + allocated);
    const cappedCurrent = Math.min(newCurrent, goal);
    const isCompleted = cappedCurrent >= goal && goal > 0;

    const { error: updateError } = await supabaseAdmin
      .from("user_charities")
      .update({
        current_amount: cappedCurrent,
        is_completed: isCompleted,
      })
      .eq("id", charity.id);

    if (updateError) {
      throw new Error("Failed to update charity amount");
    }

    return { newCurrent: cappedCurrent, isCompleted, goalAmount: goal };
  };

  // Allocate without overfilling goals:
  // - priority: cascade through charities in priority order
  // - random: try random charities until the amount is allocated or we run out
  if (mode === "priority") {
    for (const charity of userCharities) {
      if (remaining <= 0) break;

      const goal = Math.max(0, roundToCents(toNumber(charity.goal_amount)));
      const current = Math.max(0, roundToCents(toNumber(charity.current_amount)));
      const needed = Math.max(0, roundToCents(goal - current));
      if (needed <= 0) continue;

      const allocateAmount = Math.min(remaining, needed);
      const { isCompleted, goalAmount } = await updateCharity(charity, allocateAmount);

      allocations.push({ charityId: charity.charity_id, amount: allocateAmount });
      remaining = roundToCents(remaining - allocateAmount);
      if (isCompleted) {
        completedGoals.push({ charityId: charity.charity_id, goalAmount });
      }
    }
  } else {
    const available = [...userCharities];
    while (remaining > 0 && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      const charity = available[randomIndex];

      const goal = Math.max(0, roundToCents(toNumber(charity.goal_amount)));
      const current = Math.max(0, roundToCents(toNumber(charity.current_amount)));
      const needed = Math.max(0, roundToCents(goal - current));
      if (needed <= 0) {
        available.splice(randomIndex, 1);
        continue;
      }

      const allocateAmount = Math.min(remaining, needed);
      const { isCompleted, goalAmount } = await updateCharity(charity, allocateAmount);

      allocations.push({ charityId: charity.charity_id, amount: allocateAmount });
      remaining = roundToCents(remaining - allocateAmount);

      if (isCompleted) {
        completedGoals.push({ charityId: charity.charity_id, goalAmount });
        available.splice(randomIndex, 1);
      }
    }
  }

  if (allocations.length === 0) {
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({
        processed_for_donation: true,
        donated_to_charity_id: null,
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[allocateRoundupToCharity] Failed to mark transaction as processed (no allocations):", updateError);
    }

    return {
      success: true,
      allocations: [],
      unallocatedAmount: roundToCents(toNumber(roundupAmount)),
    };
  }

  // Mark transaction as processed
  const { error: markError } = await supabaseAdmin
    .from("transactions")
    .update({
      processed_for_donation: true,
      donated_to_charity_id: allocations[0].charityId,
    })
    .eq("id", transactionId);

  if (markError) {
    console.error("[allocateRoundupToCharity] Failed to mark transaction as processed:", markError);
  }

  if (completedGoals.length > 0) {
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      const completedIds = completedGoals.map((goal) => goal.charityId);
      const { data: charities } = await supabaseAdmin
        .from("user_charities")
        .select("charity_id, charity_name")
        .eq("user_id", userId)
        .in("charity_id", completedIds);

      const nameById = new Map(
        (charities || []).map((charity) => [charity.charity_id, charity.charity_name])
      );

      const email = authUser?.user?.email || profile?.email || undefined;
      if (email) {
        for (const completedGoal of completedGoals) {
          await sendDonationEmail({
            to: email,
            amount: roundToCents(toNumber(completedGoal.goalAmount)),
            charityName: nameById.get(completedGoal.charityId) || undefined,
            transactionId,
          });
        }
        console.log("[allocateRoundupToCharity] Goal completion email(s) sent");
      } else {
        console.warn("[allocateRoundupToCharity] No email found for user");
      }
    } catch (error) {
      console.error("Failed to send goal completion email:", error);
    }
  }

  // In priority mode, keep selected_charity_id pointing at the highest-priority active charity.
  if (mode === "priority") {
    const { data: nextActive } = await supabaseAdmin
      .from("user_charities")
      .select("charity_id")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextActive?.charity_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ selected_charity_id: nextActive.charity_id })
        .eq("id", userId);
    }
  }

  return {
    success: true,
    charityId: allocations[0].charityId,
    allocations,
    unallocatedAmount: remaining > 0 ? remaining : undefined,
  };
}

/**
 * Get the current target charity for a user
 */
export async function getCurrentTargetCharity(
  userId: string
): Promise<UserCharity | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("donation_mode")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const { data: charities } = await supabaseAdmin
    .from("user_charities")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .order("priority", { ascending: true });

  if (!charities || charities.length === 0) return null;

  if (profile.donation_mode === "random") {
    // For random mode, return the first one (just for display)
    return charities[0];
  }

  // For priority mode, return highest priority
  return charities[0];
}
