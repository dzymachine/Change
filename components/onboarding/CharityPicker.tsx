"use client";

import { selectCharity } from "@/actions/donations";

interface CharityPickerProps {
  selected: string | null;
  onSelect: (charityId: string) => void;
}

// Mock charities - will be replaced with real data from database
const mockCharities = [
  {
    id: "1",
    name: "Local Food Bank",
    description: "Fighting hunger in your local community",
    logo: "🍎",
  },
  {
    id: "2",
    name: "Clean Water Initiative",
    description: "Providing clean water to communities in need",
    logo: "💧",
  },
  {
    id: "3",
    name: "Education For All",
    description: "Supporting education in underserved areas",
    logo: "📚",
  },
  {
    id: "4",
    name: "Animal Rescue League",
    description: "Saving and caring for abandoned animals",
    logo: "🐾",
  },
  {
    id: "5",
    name: "Environmental Defense",
    description: "Protecting our planet for future generations",
    logo: "🌍",
  },
  {
    id: "6",
    name: "Mental Health Support",
    description: "Providing resources for mental wellness",
    logo: "🧠",
  },
];

export function CharityPicker({ selected, onSelect }: CharityPickerProps) {
  const handleSelect = async (charityId: string) => {
    onSelect(charityId);
    await selectCharity(charityId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockCharities.map((charity) => {
        const isSelected = selected === charity.id;
        
        return (
          <button
            key={charity.id}
            onClick={() => handleSelect(charity.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{charity.logo}</span>
              <div>
                <p className="font-semibold">{charity.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {charity.description}
                </p>
              </div>
              {isSelected && (
                <span className="ml-auto text-emerald-500 text-xl">✓</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
