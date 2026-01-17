import { createClient } from "@/lib/supabase/server";
import { CharitiesSection } from "@/components/dashboard/CharitiesSection";
import { DonationChart } from "@/components/dashboard/DonationChart";
import { 
  mockCharities,
  mockAllCharityGoals,
  mockStats,
  type UserCharityGoal 
} from "@/lib/mock-data";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile for donation mode
  const { data: profile } = await supabase
    .from("profiles")
    .select("donation_mode")
    .eq("id", user?.id)
    .single();

  // Fetch user's charity goals
  const { data: userCharities } = await supabase
    .from("user_charities")
    .select("*")
    .eq("user_id", user?.id)
    .order("priority", { ascending: true });

  // Map user charities to include charity details
  let charityGoals: UserCharityGoal[] =
    userCharities?.map((uc) => {
      const charity = mockCharities.find((c) => c.id === uc.charity_id);
      return {
        id: uc.id,
        charityId: uc.charity_id,
        name: charity?.name || "Unknown Charity",
        logo: "",
        goalAmount: parseFloat(uc.goal_amount) || 0,
        currentAmount: parseFloat(uc.current_amount) || 0,
        priority: uc.priority,
        isCompleted: uc.is_completed,
      };
    }) || [];

  // Use mock data if no real charities exist (for demo/testing)
  if (charityGoals.length === 0) {
    charityGoals = mockAllCharityGoals;
  }

  // Calculate total donated
  const totalDonated = charityGoals.reduce(
    (sum, c) => sum + c.currentAmount,
    0
  );

  // Use computed total (matches mock stats)
  const displayTotal = totalDonated > 0 ? totalDonated : mockStats.totalDonated;

  return (
    <div className="space-y-6">
      {/* Charities Section */}
      <CharitiesSection
        charities={charityGoals}
        donationMode={profile?.donation_mode || "priority"}
        maxCharities={5}
      />

      {/* Total Donated & Chart */}
      <DonationChart totalDonated={displayTotal} />
    </div>
  );
}
