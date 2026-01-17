import { createClient } from "@/lib/supabase/server";
import { TransactionList } from "@/components/dashboard/TransactionList";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's donation stats
  const { data: userCharities } = await supabase
    .from("user_charities")
    .select("current_amount")
    .eq("user_id", user?.id);

  const totalDonated = userCharities?.reduce(
    (sum, c) => sum + (parseFloat(String(c.current_amount)) || 0),
    0
  ) || 0;

  // Fetch recent donations
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      id,
      amount,
      status,
      created_at,
      charity:charities(name)
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-black">Profile</h1>
        <p className="text-gray-600 mt-1">
          Your account details, transactions, and donations
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-black">Account</h2>
        <div className="bg-white border rounded-xl p-5">
          <label className="text-sm text-gray-500">Email</label>
          <p className="font-medium text-black">{user?.email}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-black">Transactions</h2>
        <div className="flex gap-4">
          <select className="px-4 py-2 border rounded-lg bg-white text-black">
            <option>All accounts</option>
          </select>
          <select className="px-4 py-2 border rounded-lg bg-white text-black">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
        </div>
        <TransactionList showAll />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-black">Donations</h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="text-center">
            <p className="text-sm text-emerald-700 font-medium">Total Impact</p>
            <p className="text-4xl font-bold text-black mt-1">
              ${totalDonated.toFixed(2)}
            </p>
            <p className="text-sm text-emerald-700 mt-1">donated to charity</p>
          </div>
        </div>

        {donations && donations.length > 0 ? (
          <div className="bg-white border rounded-xl divide-y">
            {donations.map((donation) => {
              const charityData = donation.charity as { name: string } | null;
              return (
                <div key={donation.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">
                      {charityData?.name || "Unknown Charity"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">
                      ${parseFloat(String(donation.amount)).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{donation.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-8 text-center">
            <p className="text-gray-600">No donation history yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your donation batches will appear here
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
