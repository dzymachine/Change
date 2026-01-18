"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  roundup_amount: number;
  date: string;
}

interface TransactionListProps {
  showAll?: boolean;
  userId?: string;
}

export function TransactionList({ showAll = false }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  const displayTransactions = showAll ? transactions : transactions.slice(0, 5);

  if (displayTransactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <p className="text-gray-600">No transactions yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Simulate a transaction to see your round-ups in action
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm divide-y">
      {displayTransactions.map((tx, index) => (
        <div key={tx.id || `transaction-${index}`} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium text-black">
              {(tx.merchant_name || "?")[0]}
            </div>
            <div>
              <p className="font-medium text-black">{tx.merchant_name || "Unknown"}</p>
              <p className="text-sm text-gray-500">{tx.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-black">{formatCurrency(tx.amount || 0)}</p>
            <p className="text-sm text-emerald-600 font-medium">
              +{formatCurrency(tx.roundup_amount || 0)} round-up
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
