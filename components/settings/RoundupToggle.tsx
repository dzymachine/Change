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
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={isPending}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${isPending ? 'opacity-50' : ''}`}></div>
      </label>
    </div>
  );
}
