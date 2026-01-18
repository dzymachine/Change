"use client";

import { useState, useTransition } from "react";
import { updateRoundupEnabled } from "@/actions/user";

interface RoundupToggleProps {
  initialEnabled: boolean;
}

export function RoundupToggle({ initialEnabled }: RoundupToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    
    startTransition(async () => {
      const result = await updateRoundupEnabled(newValue);
      if (!result.success) {
        // Revert on error
        setEnabled(!newValue);
        console.error("Failed to update round-up setting:", result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-black">Enable round-ups</p>
        <p className="text-sm text-gray-500">
          {enabled 
            ? "Automatically round up transactions" 
            : "Round-ups are paused - no donations will be made"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex items-center cursor-pointer w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 ${enabled ? 'bg-emerald-600' : 'bg-gray-200'} ${isPending ? 'opacity-50' : ''}`}
      >
        <span
          className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}
