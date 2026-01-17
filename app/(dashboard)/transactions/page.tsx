import { TransactionList } from "@/components/dashboard/TransactionList";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-500 mt-1">
          All your transactions and round-ups
        </p>
      </div>

      {/* TODO: Add filters (date range, account, etc.) */}
      <div className="flex gap-4">
        <select className="px-4 py-2 border rounded-lg">
          <option>All accounts</option>
        </select>
        <select className="px-4 py-2 border rounded-lg">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>All time</option>
        </select>
      </div>

      <TransactionList showAll />
    </div>
  );
}
