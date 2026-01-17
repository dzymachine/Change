/**
 * Donation allocation logic
 *
 * Handles allocating round-ups to charities based on:
 * - Random mode: randomly select from user's charities
 * - Priority mode: fill goals in priority order
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

interface AllocationResult {
  success: boolean;
  charityId?: string;
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
    return { success: false, error: "No active charities found" };
  }

  // Select charity based on mode
  let selectedCharity: UserCharity;

  if (profile.donation_mode === "random") {
    // Random mode: pick a random charity
    const randomIndex = Math.floor(Math.random() * userCharities.length);
    selectedCharity = userCharities[randomIndex];
  } else {
    // Priority mode: pick the first non-completed charity (highest priority)
    selectedCharity = userCharities[0];
  }

  // Update the charity's current_amount
  const newAmount = parseFloat(selectedCharity.current_amount.toString()) + roundupAmount;
  const isNowCompleted = newAmount >= parseFloat(selectedCharity.goal_amount.toString());

  const { error: updateError } = await supabaseAdmin
    .from("user_charities")
    .update({
      current_amount: newAmount,
      is_completed: isNowCompleted,
    })
    .eq("id", selectedCharity.id);

  if (updateError) {
    return { success: false, error: "Failed to update charity amount" };
  }

  // Mark transaction as processed
  await supabaseAdmin
    .from("transactions")
    .update({
      processed_for_donation: true,
      donated_to_charity_id: selectedCharity.charity_id,
    })
    .eq("id", transactionId);

  // If this charity is now completed in priority mode, update selected_charity_id
  if (isNowCompleted && profile.donation_mode === "priority") {
    // Find next priority charity
    const nextCharity = userCharities.find(
      (c) => c.id !== selectedCharity.id && !c.is_completed
    );
    if (nextCharity) {
      await supabaseAdmin
        .from("profiles")
        .update({ selected_charity_id: nextCharity.charity_id })
        .eq("id", userId);
      
      console.log(
        `Charity ${selectedCharity.charity_id} goal completed! Moving to next: ${nextCharity.charity_id}`
      );
    }
  }

  return {
    success: true,
    charityId: selectedCharity.charity_id,
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
