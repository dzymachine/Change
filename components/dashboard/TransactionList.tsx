import { formatCurrency } from "@/lib/utils/currency";
import { mockTransactions } from "@/lib/mock-data";

interface TransactionListProps {
  showAll?: boolean;
}

export function TransactionList({ showAll = false }: TransactionListProps) {
  const transactions = showAll ? mockTransactions : mockTransactions.slice(0, 5);

  if (transactions.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <p className="text-gray-600">No transactions yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Link a bank account to start tracking your round-ups
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl divide-y">
      {transactions.map((tx) => (
        <div key={tx.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium text-black">
              {tx.merchant[0]}
            </div>
            <div>
              <p className="font-medium text-black">{tx.merchant}</p>
              <p className="text-sm text-gray-500">{tx.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-black">{formatCurrency(tx.amount)}</p>
            <p className="text-sm text-emerald-600 font-medium">
              +{formatCurrency(tx.roundup)} round-up
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
