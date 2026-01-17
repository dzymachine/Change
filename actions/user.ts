"use server";

/**
 * Server Actions for user operations
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface ActionResult {
  success: boolean;
  error?: string;
}

// Test user credentials (for development only)
const TEST_USERS = {
  onboarding: {
    email: "test-onboarding@change.dev",
    password: "testpass123",
  },
  dashboard: {
    email: "test-dashboard@change.dev",
    password: "testpass123",
  },
};

/**
 * Quick login with test user for development
 * Uses admin client to create users with confirmed email (bypasses email verification)
 * @param mode - "onboarding" resets onboarding status, "dashboard" keeps it complete
 */
export async function quickLogin(
  mode: "onboarding" | "dashboard"
): Promise<ActionResult> {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "Quick login only available in development",
    };
  }

  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const supabase = await createClient();
  const credentials = TEST_USERS[mode];

  // First, check if user exists and get their ID
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === credentials.email
  );

  if (existingUser) {
    // User exists - make sure they're confirmed and update password
    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password: credentials.password,
    });
  } else {
    // Create new user with admin client (bypasses email confirmation)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
      user_metadata: { is_test_user: true },
    });

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Wait for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Now sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Failed to get user after login" };
  }

  // Set onboarding status based on mode
  const onboardingCompleted = mode === "dashboard";

  // Check if profile exists, create if not
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingProfile) {
    // Create profile manually if trigger didn't
    await supabaseAdmin.from("profiles").insert({
      id: user.id,
      email: user.email,
      onboarding_completed: onboardingCompleted,
    });
  } else {
    // Update existing profile
    await supabaseAdmin
      .from("profiles")
      .update({ onboarding_completed: onboardingCompleted })
      .eq("id", user.id);
  }

  revalidatePath("/");

  // Redirect based on mode
  if (mode === "onboarding") {
    redirect("/onboarding/charities");
  } else {
    redirect("/dashboard");
  }
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  displayName?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: data.displayName })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");

  return { success: true };
}

/**
 * Get current user profile
 */
export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  return profile?.onboarding_completed ?? false;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
