import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/debug/user-charities
 * Debug endpoint to check what's saved in user_charities for the current user
 */
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: userCharities, error } = await supabase
    .from("user_charities")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    charityCount: userCharities?.length || 0,
    charities: userCharities,
  });
}
