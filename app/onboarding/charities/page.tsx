"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CharityPicker, type Charity } from "@/components/onboarding/CharityPicker";

export default function OnboardingCharitiesPage() {
  const router = useRouter();
  const [selectedCharities, setSelectedCharities] = useState<Charity[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const handleToggle = (charity: Charity) => {
    setSelectedCharities((prev) => {
      const alreadySelected = prev.some((item) => item.id === charity.id);
      if (alreadySelected) {
        setSelectionError(null);
        return prev.filter((item) => item.id !== charity.id);
      }
      if (prev.length >= 5) {
        setSelectionError(null);
        return prev;
      }
      setSelectionError(null);
      return [...prev, charity];
    });
  };

  const handleContinue = () => {
    if (selectedCharities.length === 0) return;

    // Store selected charities in sessionStorage for the goals page
    sessionStorage.setItem(
      "onboarding_charities",
      JSON.stringify(selectedCharities)
    );
    router.push("/onboarding/goals");
  };

  // Total steps: 4 if >1 charity selected (includes donation-mode), 3 otherwise
  const totalSteps = selectedCharities.length > 1 ? 4 : 3;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-emerald-600 font-medium">
          Step 1 of {totalSteps}
        </p>
        <h1 className="text-3xl font-bold text-black">Choose your charities</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Select up to 5 charities that will receive your round-up
          donations. You can change this anytime.
        </p>
      </div>

      <CharityPicker selected={selectedCharities} onToggle={handleToggle} />

      {selectedCharities.length > 0 && (
        <p className="text-center text-sm text-gray-500">
          {selectedCharities.length} charit
          {selectedCharities.length === 1 ? "y" : "ies"} selected
        </p>
      )}
      {selectionError && (
        <p className="text-center text-sm text-red-500">{selectionError}</p>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedCharities.length === 0}
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedCharities.length > 0
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
