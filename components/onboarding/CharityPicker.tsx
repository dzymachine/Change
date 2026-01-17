"use client";

import { mockCharities } from "@/lib/charities/data";

// Re-export for backward compatibility
export { mockCharities, type Charity } from "@/lib/charities/data";

interface CharityPickerProps {
  selected: string[];
  onToggle: (charityId: string) => void;
}

export function CharityPicker({ selected, onToggle }: CharityPickerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockCharities.map((charity) => {
        const isSelected = selected.includes(charity.id);

        return (
          <button
            key={charity.id}
            onClick={() => onToggle(charity.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{charity.logo}</span>
              <div className="flex-1">
                <p className="font-semibold text-black">{charity.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {charity.description}
                </p>
              </div>
              {isSelected && (
                <span className="text-emerald-500 text-xl">✓</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
