"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveCharityGoals } from "@/actions/donations";

interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

interface CharityGoal {
  charityId: string;
  goalAmount: number;
}

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedCharities, setSelectedCharities] = useState<Charity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [goals, setGoals] = useState<CharityGoal[]>([]);
  const [currentGoal, setCurrentGoal] = useState("");
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"in" | "out">("in");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Determine total steps: 4 if >1 charity (includes donation-mode), 3 otherwise
  const totalSteps = selectedCharities.length > 1 ? 4 : 3;

  // Load selected charities from sessionStorage (now stored as full objects)
  useEffect(() => {
    const stored = sessionStorage.getItem("onboarding_charities");
    if (!stored) {
      router.push("/onboarding/charities");
      return;
    }

    try {
      const charities: Charity[] = JSON.parse(stored);
      
      if (!Array.isArray(charities) || charities.length === 0) {
        router.push("/onboarding/charities");
        return;
      }

      setSelectedCharities(charities);
    } catch {
      router.push("/onboarding/charities");
    }
  }, [router]);

  // Focus input when charity changes
  useEffect(() => {
    if (inputRef.current && !isSliding) {
      inputRef.current.focus();
    }
  }, [currentIndex, isSliding]);

  const currentCharity = selectedCharities[currentIndex];
  const isLastCharity = currentIndex === selectedCharities.length - 1;

  const handleNext = useCallback(async () => {
    // Get value from ref for better compatibility
    const inputValue = inputRef.current?.value || currentGoal;
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid goal amount");
      return;
    }

    setError(null);

    // Save the goal
    const newGoals = [
      ...goals,
      { charityId: currentCharity.id, goalAmount: amount },
    ];
    setGoals(newGoals);

    if (isLastCharity) {
      // All goals set
      if (selectedCharities.length > 1) {
        // Multiple charities: store in sessionStorage and go to donation-mode page
        sessionStorage.setItem("onboarding_goals", JSON.stringify(newGoals));
        router.push("/onboarding/donation-mode");
      } else {
        // Single charity: save to database and go to plaid
        setIsSaving(true);
        const result = await saveCharityGoals(newGoals);
        setIsSaving(false);

        if (!result.success) {
          setError(result.error || "Failed to save goals");
          return;
        }

        // Clear sessionStorage and move to next step
        sessionStorage.removeItem("onboarding_charities");
        router.push("/onboarding/plaid");
      }
    } else {
      // Animate to next charity
      setSlideDirection("out");
      setIsSliding(true);

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setCurrentGoal("");
        setSlideDirection("in");

        setTimeout(() => {
          setIsSliding(false);
        }, 300);
      }, 300);
    }
  }, [currentGoal, currentCharity, goals, isLastCharity, selectedCharities.length, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  if (selectedCharities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-emerald-600 font-medium">
          Step 2 of {totalSteps}
        </p>
        <h1 className="text-3xl font-bold">Set your goals</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Set a donation goal for each charity. This helps you track your
          giving progress.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        {selectedCharities.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < currentIndex
                ? "bg-emerald-500"
                : index === currentIndex
                  ? "bg-emerald-600 w-4"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Charity card with sliding animation */}
      <div className="relative overflow-hidden min-h-[280px]">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isSliding
              ? slideDirection === "out"
                ? "-translate-x-full opacity-0"
                : "translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center space-y-6">
            {currentCharity.imageUrl ? (
              <img
                src={currentCharity.imageUrl}
                alt={currentCharity.name}
                className="w-24 h-24 mx-auto rounded-xl object-cover"
              />
            ) : (
              <div className="text-6xl">{currentCharity.logo}</div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-black">{currentCharity.name}</h2>
              <p className="text-gray-500 mt-1 line-clamp-3">{currentCharity.description}</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal"
                className="block text-sm font-medium text-gray-700"
              >
                Donation Goal
              </label>
              <div className="relative max-w-xs mx-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                  $
                </span>
                <input
                  ref={inputRef}
                  id="goal"
                  type="number"
                  min="1"
                  step="1"
                  value={currentGoal}
                  onChange={(e) => setCurrentGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="100"
                  className="w-full pl-10 pr-4 py-3 text-2xl text-center border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors"
                  disabled={isSaving}
                />
              </div>
              <p className="text-xs text-gray-400">Press Enter to continue</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => router.push("/onboarding/charities")}
          className="text-gray-500 hover:text-gray-700"
          disabled={isSaving}
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {selectedCharities.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentGoal || isSaving}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentGoal && !isSaving
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving
              ? "Saving..."
              : isLastCharity
                ? "Finish & Continue"
                : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
