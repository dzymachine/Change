import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/debug/reset-user-data
 * 
 * Resets the current user's transaction history and charity progress.
 * This is useful for testing the simulate payment flow with a clean slate.
 * 
 * DEVELOPMENT ONLY
 */
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Delete all transactions for this user
    const { error: txError, count: txCount } = await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("user_id", user.id);

    if (txError) {
      console.error("Failed to delete transactions:", txError);
    }

    // Reset all user charity goals to 0 progress
    const { error: charityError, count: charityCount } = await supabaseAdmin
      .from("user_charities")
      .update({ current_amount: 0, is_completed: false })
      .eq("user_id", user.id);

    if (charityError) {
      console.error("Failed to reset charity progress:", charityError);
    }

    // Reset roundup_enabled to true
    await supabaseAdmin
      .from("profiles")
      .update({ roundup_enabled: true })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "User data reset successfully",
      deleted: {
        transactions: txCount ?? "unknown",
        charities_reset: charityCount ?? "unknown",
      },
    });
  } catch (error) {
    console.error("Reset user data error:", error);
    return NextResponse.json(
      { error: "Failed to reset user data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: "Reset user transaction history and charity progress for testing",
    usage: "POST /api/debug/reset-user-data",
    warning: "This will DELETE all transactions and reset charity progress to 0",
  });
}
