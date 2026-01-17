"use client";

import { useState, useTransition } from "react";
import { updateDonationMode, updateCharityPriorities } from "@/actions/donations";

interface CharityGoal {
  id: string;
  charityId: string;
  name: string;
  logo: string;
  goalAmount: number;
  currentAmount: number;
  priority: number;
  isCompleted: boolean;
}

interface CharityGoalsProps {
  charities: CharityGoal[];
  donationMode: "random" | "priority";
}

export function CharityGoals({
  charities: initialCharities,
  donationMode: initialMode,
}: CharityGoalsProps) {
  const [mode, setMode] = useState(initialMode);
  const [charities, setCharities] = useState(initialCharities);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (newMode: "random" | "priority") => {
    setMode(newMode);
    startTransition(async () => {
      await updateDonationMode(newMode);
    });
  };

  const handleDragStart = (index: number) => {
    if (mode !== "priority") return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (mode !== "priority" || draggedIndex === null || draggedIndex === index)
      return;

    const newCharities = [...charities];
    const draggedItem = newCharities[draggedIndex];
    newCharities.splice(draggedIndex, 1);
    newCharities.splice(index, 0, draggedItem);

    // Update priorities
    newCharities.forEach((c, i) => {
      c.priority = i + 1;
    });

    setCharities(newCharities);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null) return;

    // Save new priorities
    const priorities = charities.map((c) => ({
      charityId: c.charityId,
      priority: c.priority,
    }));

    startTransition(async () => {
      await updateCharityPriorities(priorities);
    });

    setDraggedIndex(null);
  };

  if (charities.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-500">
        No charities selected. Complete onboarding to set up your donations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle - only show if multiple charities */}
      {charities.length > 1 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Donation Mode</h3>
              <p className="text-sm text-gray-500">
                {mode === "random"
                  ? "Donations are randomly distributed"
                  : "Donations fill goals in order"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange("random")}
                disabled={isPending}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  mode === "random"
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🎲 Random
              </button>
              <button
                onClick={() => handleModeChange("priority")}
                disabled={isPending}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  mode === "priority"
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📊 Priority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charity List */}
      <div className="space-y-2">
        {charities.map((charity, index) => {
          const progress =
            charity.goalAmount > 0
              ? Math.min(
                  (charity.currentAmount / charity.goalAmount) * 100,
                  100
                )
              : 0;

          return (
            <div
              key={charity.id}
              draggable={mode === "priority" && charities.length > 1}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border p-4 transition-all ${
                mode === "priority" && charities.length > 1
                  ? "cursor-move hover:shadow-md"
                  : ""
              } ${
                draggedIndex === index
                  ? "border-emerald-500 shadow-lg scale-[1.02]"
                  : ""
              } ${charity.isCompleted ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-4">
                {/* Priority number (only in priority mode with multiple charities) */}
                {mode === "priority" && charities.length > 1 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                )}

                {/* Charity info */}
                <span className="text-2xl flex-shrink-0">{charity.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate text-black">{charity.name}</p>
                    <p className="text-sm text-gray-500 ml-2 flex-shrink-0">
                      ${charity.currentAmount.toFixed(2)} / $
                      {charity.goalAmount.toFixed(2)}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        charity.isCompleted ? "bg-emerald-500" : "bg-emerald-400"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Drag handle (only in priority mode) */}
                {mode === "priority" && charities.length > 1 && (
                  <div className="text-gray-400 flex-shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>
                )}

                {/* Completed badge */}
                {charity.isCompleted && (
                  <span className="text-emerald-500 text-sm font-medium flex-shrink-0">
                    ✓ Complete
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mode === "priority" && charities.length > 1 && (
        <p className="text-xs text-gray-400 text-center">
          Drag to reorder priorities
        </p>
      )}
    </div>
  );
}
