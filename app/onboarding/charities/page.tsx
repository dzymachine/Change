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
    <div className="space-y-10">
      {/* Header Section */}
      <header className="text-center">
        <p 
          className="font-mono text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--tan)" }}
        >
          Step 1 of {totalSteps}
        </p>
        <h1 
          className="font-display text-3xl md:text-4xl mb-4"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          Choose your charities
        </h1>
        <p 
          className="font-body text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Select up to 5 charities that will receive your round-up donations. 
          You can change this anytime.
        </p>
      </header>

      {/* Charity Picker */}
      <CharityPicker selected={selectedCharities} onToggle={handleToggle} />

      {/* Selection Status */}
      {selectedCharities.length > 0 && (
        <p 
          className="text-center font-body text-sm"
          style={{ color: "var(--muted)" }}
        >
          {selectedCharities.length} charit
          {selectedCharities.length === 1 ? "y" : "ies"} selected
        </p>
      )}
      
      {selectionError && (
        <p 
          className="text-center font-body text-sm"
          style={{ color: "var(--red)" }}
        >
          {selectionError}
        </p>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedCharities.length === 0}
          className="px-8 py-3 font-body text-sm tracking-wide transition-all duration-200"
          style={{
            backgroundColor: selectedCharities.length > 0 ? "var(--green)" : "var(--border)",
            color: selectedCharities.length > 0 ? "var(--white)" : "var(--muted)",
            cursor: selectedCharities.length > 0 ? "pointer" : "not-allowed",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (selectedCharities.length > 0) {
              e.currentTarget.style.backgroundColor = "var(--green-light)";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCharities.length > 0) {
              e.currentTarget.style.backgroundColor = "var(--green)";
            }
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
