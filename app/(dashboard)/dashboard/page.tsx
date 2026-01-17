import { createClient } from "@/lib/supabase/server";
import { ImpactCard } from "@/components/dashboard/ImpactCard";
import { TransactionList } from "@/components/dashboard/TransactionList";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TODO: Fetch real data from database
  const mockStats = {
    totalDonated: 127.45,
    transactionsCount: 234,
    currentCharity: "Local Food Bank",
    monthlyAverage: 32.50,
  };

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
          value={`$${mockStats.totalDonated.toFixed(2)}`}
          subtitle="All time"
          icon="💰"
        />
        <ImpactCard
          title="Transactions"
          value={mockStats.transactionsCount.toString()}
          subtitle="Rounded up"
          icon="📊"
        />
        <ImpactCard
          title="Current Charity"
          value={mockStats.currentCharity}
          subtitle="Active"
          icon="❤️"
        />
        <ImpactCard
          title="Monthly Average"
          value={`$${mockStats.monthlyAverage.toFixed(2)}`}
          subtitle="Per month"
          icon="📈"
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
