"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Add a new charity to user's active list
 */
export async function addUserCharity(
  charityId: string,
  goalAmount: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get current max priority
  const { data: existing } = await supabase
    .from("user_charities")
    .select("priority")
    .eq("user_id", user.id)
    .order("priority", { ascending: false })
    .limit(1);

  const nextPriority = (existing?.[0]?.priority || 0) + 1;

  // Check if user already has 5 active charities
  const { count } = await supabase
    .from("user_charities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if ((count || 0) >= 5) {
    return { success: false, error: "Maximum 5 active charities allowed" };
  }

  const { error } = await supabase.from("user_charities").insert({
    user_id: user.id,
    charity_id: charityId,
    goal_amount: goalAmount,
    current_amount: 0,
    priority: nextPriority,
    is_completed: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Remove a charity from user's list
 */
export async function removeUserCharity(charityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_charities")
    .delete()
    .eq("user_id", user.id)
    .eq("charity_id", charityId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Update a charity's goal amount
 */
export async function updateCharityGoal(
  charityId: string,
  newGoal: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_charities")
    .update({ goal_amount: newGoal })
    .eq("user_id", user.id)
    .eq("charity_id", charityId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
