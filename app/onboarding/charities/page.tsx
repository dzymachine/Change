"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CharityPicker } from "@/components/onboarding/CharityPicker";

interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

export default function OnboardingCharitiesPage() {
  const router = useRouter();
  const [selectedCharityIds, setSelectedCharityIds] = useState<string[]>([]);
  const [charityData, setCharityData] = useState<Map<string, Charity>>(new Map());

  const handleToggle = (charityId: string, charity?: Charity) => {
    setSelectedCharityIds((prev) =>
      prev.includes(charityId)
        ? prev.filter((id) => id !== charityId)
        : [...prev, charityId]
    );
    
    // Store charity data when selected
    if (charity && !charityData.has(charityId)) {
      setCharityData((prev) => new Map(prev).set(charityId, charity));
    }
  };

  const handleContinue = () => {
    if (selectedCharityIds.length === 0) return;

    // Store full charity objects in sessionStorage for the goals page
    const selectedCharities = selectedCharityIds
      .map((id) => charityData.get(id))
      .filter((c): c is Charity => c !== undefined);
    
    sessionStorage.setItem(
      "onboarding_charities",
      JSON.stringify(selectedCharities)
    );
    router.push("/onboarding/goals");
  };

  // Total steps: 4 if >1 charity selected (includes donation-mode), 3 otherwise
  const totalSteps = selectedCharityIds.length > 1 ? 4 : 3;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-emerald-600 font-medium">
          Step 1 of {totalSteps}
        </p>
        <h1 className="text-3xl font-bold">Choose your charities</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Select one or more charities that will receive your round-up
          donations. You can change this anytime.
        </p>
      </div>

      <CharityPicker selected={selectedCharityIds} onToggle={handleToggle} onCharityData={setCharityData} />

      {selectedCharityIds.length > 0 && (
        <p className="text-center text-sm text-gray-500">
          {selectedCharityIds.length} charit
          {selectedCharityIds.length === 1 ? "y" : "ies"} selected
        </p>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedCharityIds.length === 0}
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedCharityIds.length > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
