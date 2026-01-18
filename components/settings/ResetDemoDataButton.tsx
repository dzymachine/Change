"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetDemoDataButton() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setResult(null);

    try {
      const response = await fetch("/api/debug/reset-user-data", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: "Demo data cleared successfully!" });
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh();
          setShowConfirm(false);
          setResult(null);
        }, 1500);
      } else {
        setResult({ success: false, message: data.error || "Failed to reset data" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error - please try again" });
    } finally {
      setIsResetting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          This will delete all your transactions and reset charity progress to $0. Are you sure?
        </p>
        {result && (
          <p className={`text-sm ${result.success ? "text-emerald-600" : "text-red-600"}`}>
            {result.message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isResetting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? "Resetting..." : "Yes, Reset Everything"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-black">Reset Demo Data</p>
        <p className="text-sm text-gray-500">
          Clear all transactions and reset charity progress for testing
        </p>
      </div>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
      >
        Reset
      </button>
    </div>
  );
}
