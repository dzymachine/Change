import { createClient } from "@/lib/supabase/server";
import { CharitiesSection } from "@/components/dashboard/CharitiesSection";
import { DonationChart } from "@/components/dashboard/DonationChart";
import type { DonationMode } from "@/types/database";

export interface UserCharityGoal {
  id: string;
  charityId: string;
  name: string;
  logo: string;
  imageUrl?: string | null;
  goalAmount: number;
  currentAmount: number;
  priority: number;
  isCompleted: boolean;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile for donation mode
  const { data: profile } = await supabase
    .from("profiles")
    .select("donation_mode, roundup_enabled")
    .eq("id", user?.id)
    .single();

  // Fetch user's charity goals (denormalized - charity info stored directly)
  const { data: userCharities, error: charitiesError } = await supabase
    .from("user_charities")
    .select(`
      id,
      charity_id,
      charity_name,
      charity_logo,
      charity_image_url,
      goal_amount,
      current_amount,
      priority,
      is_completed
    `)
    .eq("user_id", user?.id)
    .order("priority", { ascending: true });

  if (charitiesError) {
    console.error("Error fetching user_charities:", charitiesError);
  }

  // Map to the expected format
  const charityGoals: UserCharityGoal[] = (userCharities || []).map((uc) => {
    return {
      id: uc.id,
      charityId: uc.charity_id,
      name: uc.charity_name || "Unknown Charity",
      logo: uc.charity_logo || "🎯",
      imageUrl: uc.charity_image_url,
      goalAmount: parseFloat(String(uc.goal_amount)) || 0,
      currentAmount: parseFloat(String(uc.current_amount)) || 0,
      priority: uc.priority,
      isCompleted: uc.is_completed,
    };
  });

  // Calculate total donated from current progress
  const totalDonated = charityGoals.reduce(
    (sum, c) => sum + c.currentAmount,
    0
  );

  // Get donation mode with fallback
  const donationMode: DonationMode = (profile?.donation_mode as DonationMode) || "priority";

  return (
    <div className="space-y-6">
      {/* Charities Section */}
      <CharitiesSection
        charities={charityGoals}
        donationMode={donationMode}
        maxCharities={5}
      />

      {/* Total Donated & Chart */}
      <DonationChart totalDonated={totalDonated} />
    </div>
  );
}
