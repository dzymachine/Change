import { createClient } from "@/lib/supabase/server";
import { ImpactCard } from "@/components/dashboard/ImpactCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { CharityGoals } from "@/components/dashboard/CharityGoals";
import { mockCharities } from "@/lib/charities/data";

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
  const charityGoals =
    userCharities?.map((uc) => {
      const charity = mockCharities.find((c) => c.id === uc.charity_id);
      return {
        id: uc.id,
        charityId: uc.charity_id,
        name: charity?.name || "Unknown Charity",
        logo: charity?.logo || "❓",
        goalAmount: parseFloat(uc.goal_amount) || 0,
        currentAmount: parseFloat(uc.current_amount) || 0,
        priority: uc.priority,
        isCompleted: uc.is_completed,
      };
    }) || [];

  // Calculate stats
  const totalDonated = charityGoals.reduce(
    (sum, c) => sum + c.currentAmount,
    0
  );
  const totalGoal = charityGoals.reduce((sum, c) => sum + c.goalAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.email?.split("@")[0]}
        </p>
      </div>

      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ImpactCard
          title="Total Donated"
          value={`$${totalDonated.toFixed(2)}`}
          subtitle="All time"
          icon="💰"
        />
        <ImpactCard
          title="Charities"
          value={charityGoals.length.toString()}
          subtitle="Selected"
          icon="❤️"
        />
        <ImpactCard
          title="Total Goal"
          value={`$${totalGoal.toFixed(2)}`}
          subtitle="Combined"
          icon="🎯"
        />
        <ImpactCard
          title="Progress"
          value={
            totalGoal > 0
              ? `${Math.round((totalDonated / totalGoal) * 100)}%`
              : "0%"
          }
          subtitle="Toward goals"
          icon="📈"
        />
      </div>

      {/* Charity Goals */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Charities</h2>
        <CharityGoals
          charities={charityGoals}
          donationMode={profile?.donation_mode || "priority"}
        />
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Round-ups</h2>
        <TransactionList />
      </div>
    </div>
  );
}
