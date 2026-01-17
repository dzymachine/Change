import { formatCurrency } from "@/lib/utils/currency";

interface TransactionListProps {
  showAll?: boolean;
}

// Mock data - will be replaced with real data from database
const mockTransactions = [
  { id: "1", merchant: "Starbucks", amount: 5.75, roundup: 0.25, date: "2026-01-16" },
  { id: "2", merchant: "Amazon", amount: 47.32, roundup: 0.68, date: "2026-01-15" },
  { id: "3", merchant: "Whole Foods", amount: 89.17, roundup: 0.83, date: "2026-01-15" },
  { id: "4", merchant: "Netflix", amount: 15.99, roundup: 0.01, date: "2026-01-14" },
  { id: "5", merchant: "Uber", amount: 23.45, roundup: 0.55, date: "2026-01-14" },
];

export function TransactionList({ showAll = false }: TransactionListProps) {
  const transactions = showAll ? mockTransactions : mockTransactions.slice(0, 5);

  if (transactions.length === 0) {
    return (
      <div className="border rounded-xl p-8 text-center">
        <p className="text-gray-500">No transactions yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Link a bank account to start tracking your round-ups
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl divide-y">
      {transactions.map((tx) => (
        <div key={tx.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              {tx.merchant[0]}
            </div>
            <div>
              <p className="font-medium">{tx.merchant}</p>
              <p className="text-sm text-gray-500">{tx.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(tx.amount)}</p>
            <p className="text-sm text-emerald-600">
              +{formatCurrency(tx.roundup)} round-up
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
