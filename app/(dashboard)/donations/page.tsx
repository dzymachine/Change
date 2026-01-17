export default function DonationsPage() {
  // TODO: Fetch donation history from database
  const mockDonations = [
    { id: "1", amount: 25.00, charity: "Local Food Bank", date: "2026-01-15", status: "completed" },
    { id: "2", amount: 18.50, charity: "Local Food Bank", date: "2026-01-08", status: "completed" },
    { id: "3", amount: 22.30, charity: "Local Food Bank", date: "2026-01-01", status: "completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Donations</h1>
        <p className="text-gray-500 mt-1">
          Your donation history and impact
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="text-center">
          <p className="text-sm text-emerald-600 font-medium">Total Impact</p>
          <p className="text-4xl font-bold text-emerald-700 mt-1">$65.80</p>
          <p className="text-sm text-emerald-600 mt-1">donated to charity</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Donation History</h2>
        
        <div className="border rounded-xl divide-y">
          {mockDonations.map((donation) => (
            <div key={donation.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{donation.charity}</p>
                <p className="text-sm text-gray-500">{donation.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600">
                  ${donation.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{donation.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
