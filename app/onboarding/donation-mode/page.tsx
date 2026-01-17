"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Charity } from "@/components/onboarding/CharityPicker";
import { saveDonationMode } from "@/actions/donations";

interface CharityWithGoal {
  charity: Charity;
  goalAmount: number;
  priority: number;
}

export default function OnboardingDonationModePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"random" | "priority" | null>(null);
  const [charities, setCharities] = useState<CharityWithGoal[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load charities from sessionStorage
  useEffect(() => {
    let isMounted = true;
    const cleanup = () => {
      isMounted = false;
    };
    const storedCharities = sessionStorage.getItem("onboarding_charities");
    const storedGoals = sessionStorage.getItem("onboarding_goals");

    if (!storedCharities || !storedGoals) {
      router.push("/onboarding/charities");
      return cleanup;
    }

    let parsedCharities: unknown;
    let goals: { charityId: string; goalAmount: number }[] = [];

    try {
      parsedCharities = JSON.parse(storedCharities);
      goals = JSON.parse(storedGoals);
    } catch {
      router.push("/onboarding/charities");
      return cleanup;
    }

    const isCharity = (value: unknown): value is Charity =>
      Boolean(
        value &&
          typeof value === "object" &&
          "id" in value &&
          "name" in value
      );

    const buildCharities = (ids: string[], list: Charity[]) =>
      ids
        .map((id, index) => {
          const charity = list.find((c) => c.id === id);
          const goal = goals.find((g) => g.charityId === id);
          if (!charity || !goal) return null;
          return {
            charity,
            goalAmount: goal.goalAmount,
            priority: index + 1,
          };
        })
        .filter((c): c is CharityWithGoal => c !== null);

    const loadFromIds = async (ids: string[]) => {
      try {
        // Fetch charities from our Supabase endpoint
        const response = await fetch("/api/charities");
        if (response.ok) {
          const data = await response.json();
          const fromApi = Array.isArray(data.charities)
            ? (data.charities as Charity[])
            : [];
          const charitiesWithGoals = buildCharities(ids, fromApi);
          if (isMounted && charitiesWithGoals.length > 0) {
            setCharities(charitiesWithGoals);
            return;
          }
        }
      } catch {
        // If API fails, redirect to charity selection
      }

      if (isMounted) {
        router.push("/onboarding/charities");
      }
    };

    if (
      Array.isArray(parsedCharities) &&
      parsedCharities.every((item) => typeof item === "string")
    ) {
      const ids = parsedCharities;
      if (ids.length <= 1) {
        router.push("/onboarding/plaid");
        return cleanup;
      }
      loadFromIds(ids);
      return cleanup;
    }

    if (Array.isArray(parsedCharities)) {
      const charities = parsedCharities.filter(isCharity);
      if (charities.length <= 1) {
        router.push("/onboarding/plaid");
        return cleanup;
      }
      const ids = charities.map((charity) => charity.id);
      const charitiesWithGoals = buildCharities(ids, charities);
      if (charitiesWithGoals.length === 0) {
        router.push("/onboarding/charities");
        return cleanup;
      }
      setCharities(charitiesWithGoals);
      return cleanup;
    }

    router.push("/onboarding/charities");
    return cleanup;
  }, [router]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

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
    setDraggedIndex(null);
  };

  const handleContinue = async () => {
    if (!mode) return;

    setError(null);
    setIsSaving(true);

    // Update priorities with full charity info for upsert
    const updatedGoals = charities.map((c) => ({
      charityId: c.charity.id,
      charityInfo: {
        id: c.charity.id,
        name: c.charity.name,
        description: c.charity.description,
        logo: c.charity.logo,
        imageUrl: c.charity.imageUrl,
      },
      goalAmount: c.goalAmount,
      priority: c.priority,
    }));
    sessionStorage.setItem("onboarding_goals", JSON.stringify(updatedGoals));

    const result = await saveDonationMode(mode, updatedGoals);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save donation mode");
      return;
    }

    // Clear sessionStorage and continue
    sessionStorage.removeItem("onboarding_charities");
    sessionStorage.removeItem("onboarding_goals");
    router.push("/onboarding/plaid");
  };

  const totalSteps = charities.length > 1 ? 4 : 3;

  if (charities.length === 0) {
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
          Step 3 of {totalSteps}
        </p>
        <h1 className="text-3xl font-bold text-black">How should we distribute?</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Choose how your donations are distributed across your selected
          charities.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMode("random")}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            mode === "random"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎲</span>
            <div className="flex-1">
              <p className="font-semibold text-lg text-black">Random</p>
              <p className="text-sm text-gray-500 mt-1">
                Each donation is randomly assigned to one of your charities.
                Great for supporting all causes equally over time.
              </p>
            </div>
            {mode === "random" && (
              <span className="text-emerald-500 text-xl">✓</span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("priority")}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            mode === "priority"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">📊</span>
            <div className="flex-1">
              <p className="font-semibold text-lg text-black">Priority Queue</p>
              <p className="text-sm text-gray-500 mt-1">
                Donations go to your #1 charity until its goal is met, then move
                to #2, and so on.
              </p>
            </div>
            {mode === "priority" && (
              <span className="text-emerald-500 text-xl">✓</span>
            )}
          </div>
        </button>
      </div>

      {/* Priority Ranking (only shown when priority mode selected) */}
      {mode === "priority" && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-black">Rank your charities</h2>
            <p className="text-sm text-gray-500">
              Drag to reorder. Donations fill goals from top to bottom.
            </p>
          </div>

          <div className="space-y-2">
            {charities.map((item, index) => (
              <div
                key={item.charity.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-move transition-all ${
                  draggedIndex === index
                    ? "border-emerald-500 shadow-lg scale-[1.02]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                  {index + 1}
                </div>
                <span className="text-2xl">{item.charity.logo}</span>
                <div className="flex-1">
                  <p className="font-medium text-black">{item.charity.name}</p>
                  <p className="text-sm text-gray-500">
                    Goal: ${item.goalAmount}
                  </p>
                </div>
                <div className="text-gray-400">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Random mode info */}
      {mode === "random" && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-600">
            Your donations will be randomly distributed to:
          </p>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {charities.map((item) => (
              <div
                key={item.charity.id}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border"
              >
                <span className="text-xl">{item.charity.logo}</span>
                <span className="text-sm font-medium">
                  <span className="text-black">{item.charity.name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => router.push("/onboarding/goals")}
          className="text-gray-500 hover:text-gray-700"
          disabled={isSaving}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!mode || isSaving}
          className={`px-6 py-2 rounded-lg transition-colors ${
            mode && !isSaving
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
