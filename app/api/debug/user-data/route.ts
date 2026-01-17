import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DEBUG ONLY - Remove in production
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user charities
  const { data: userCharities, error: charitiesError } = await supabase
    .from("user_charities")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || { error: profileError?.message },
    userCharities: userCharities || { error: charitiesError?.message },
  }, { status: 200 });
}
