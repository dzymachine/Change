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
    // Use full page navigation to ensure cookies from server action are properly handled
    window.location.href = "/onboarding/plaid";
  };

  const totalSteps = charities.length > 1 ? 4 : 3;

  if (charities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="font-body text-base"
          style={{ color: "var(--muted)" }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <p 
          className="font-mono text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--tan)" }}
        >
          Step 3 of {totalSteps}
        </p>
        <h1 
          className="font-display text-3xl md:text-4xl mb-4"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          How should we distribute?
        </h1>
        <p 
          className="font-body text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Choose how your donations are distributed across your selected charities.
        </p>
      </header>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Random Option */}
        <button
          type="button"
          onClick={() => setMode("random")}
          className="p-6 text-left transition-all duration-200"
          style={{
            backgroundColor: mode === "random" ? "rgba(0, 122, 85, 0.04)" : "var(--white)",
            border: mode === "random" ? "2px solid var(--green)" : "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            if (mode !== "random") {
              e.currentTarget.style.borderColor = "var(--tan)";
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== "random") {
              e.currentTarget.style.borderColor = "var(--border)";
            }
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div 
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: mode === "random" ? "rgba(0, 122, 85, 0.1)" : "rgba(162, 137, 108, 0.1)",
              }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke={mode === "random" ? "var(--green)" : "var(--tan)"} 
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </div>
            <div className="flex-1">
              <p 
                className="font-display text-lg mb-2"
                style={{ color: "var(--foreground)", fontWeight: 500 }}
              >
                Random
              </p>
              <p 
                className="font-body text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Each donation is randomly assigned to one of your charities. Great for supporting all causes equally over time.
              </p>
            </div>
          </div>
        </button>

        {/* Priority Option */}
        <button
          type="button"
          onClick={() => setMode("priority")}
          className="p-6 text-left transition-all duration-200"
          style={{
            backgroundColor: mode === "priority" ? "rgba(0, 122, 85, 0.04)" : "var(--white)",
            border: mode === "priority" ? "2px solid var(--green)" : "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            if (mode !== "priority") {
              e.currentTarget.style.borderColor = "var(--tan)";
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== "priority") {
              e.currentTarget.style.borderColor = "var(--border)";
            }
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div 
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: mode === "priority" ? "rgba(0, 122, 85, 0.1)" : "rgba(162, 137, 108, 0.1)",
              }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke={mode === "priority" ? "var(--green)" : "var(--tan)"} 
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21l3.75-3.75" />
              </svg>
            </div>
            <div className="flex-1">
              <p 
                className="font-display text-lg mb-2"
                style={{ color: "var(--foreground)", fontWeight: 500 }}
              >
                Priority Queue
              </p>
              <p 
                className="font-body text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Donations go to your #1 charity until its goal is met, then move to #2, and so on.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Priority Ranking (only shown when priority mode selected) */}
      {mode === "priority" && (
        <div 
          className="space-y-6 animate-fade-in"
          style={{
            animation: "fadeIn 0.4s ease-out forwards",
          }}
        >
          <div className="text-center">
            <h2 
              className="font-display text-xl mb-2"
              style={{ color: "var(--foreground)", fontWeight: 500 }}
            >
              Rank your charities
            </h2>
            <p 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              Drag to reorder. Donations fill goals from top to bottom.
            </p>
          </div>

          <div className="space-y-3">
            {charities.map((item, index) => (
              <div
                key={item.charity.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-4 p-4 cursor-move transition-all duration-200"
                style={{
                  backgroundColor: "var(--white)",
                  border: draggedIndex === index ? "2px solid var(--green)" : "1px solid var(--border)",
                  transform: draggedIndex === index ? "scale(1.02)" : "scale(1)",
                  boxShadow: draggedIndex === index ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {/* Priority Number */}
                <div 
                  className="flex items-center justify-center w-8 h-8 font-mono text-sm"
                  style={{ 
                    backgroundColor: "rgba(0, 122, 85, 0.1)",
                    color: "var(--green)",
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Charity Image or Initial */}
                {item.charity.imageUrl ? (
                  <img
                    src={item.charity.imageUrl}
                    alt={item.charity.name}
                    className="w-10 h-10 object-cover flex-shrink-0"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-display"
                    style={{ 
                      background: "linear-gradient(135deg, rgba(162, 137, 108, 0.15) 0%, rgba(0, 122, 85, 0.1) 100%)",
                      color: "var(--tan)",
                      fontWeight: 500,
                    }}
                  >
                    {item.charity.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Charity Info */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-body text-base truncate"
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  >
                    {item.charity.name}
                  </p>
                  <p 
                    className="font-mono text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    Goal: ${item.goalAmount}
                  </p>
                </div>
                
                {/* Drag Handle */}
                <div style={{ color: "var(--muted)" }}>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
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
        <div 
          className="p-6 text-center"
          style={{ 
            backgroundColor: "rgba(162, 137, 108, 0.06)",
            animation: "fadeIn 0.4s ease-out forwards",
          }}
        >
          <p 
            className="font-body text-sm mb-4"
            style={{ color: "var(--muted)" }}
          >
            Your donations will be randomly distributed to:
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {charities.map((item) => (
              <div
                key={item.charity.id}
                className="flex items-center gap-2 px-3 py-2"
                style={{ 
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--border)",
                }}
              >
                {item.charity.imageUrl ? (
                  <img
                    src={item.charity.imageUrl}
                    alt={item.charity.name}
                    className="w-6 h-6 object-cover"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 flex items-center justify-center font-display text-xs"
                    style={{ 
                      background: "linear-gradient(135deg, rgba(162, 137, 108, 0.15) 0%, rgba(0, 122, 85, 0.1) 100%)",
                      color: "var(--tan)",
                      fontWeight: 500,
                    }}
                  >
                    {item.charity.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span 
                  className="font-body text-sm"
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  {item.charity.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p 
          className="font-body text-sm text-center"
          style={{ color: "var(--red)" }}
        >
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => router.push("/onboarding/goals")}
          className="font-body text-sm transition-colors duration-200"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
          disabled={isSaving}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!mode || isSaving}
          className="px-8 py-3 font-body text-sm tracking-wide transition-all duration-200"
          style={{
            backgroundColor: mode && !isSaving ? "var(--green)" : "var(--border)",
            color: mode && !isSaving ? "var(--white)" : "var(--muted)",
            cursor: mode && !isSaving ? "pointer" : "not-allowed",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (mode && !isSaving) {
              e.currentTarget.style.backgroundColor = "var(--green-light)";
            }
          }}
          onMouseLeave={(e) => {
            if (mode && !isSaving) {
              e.currentTarget.style.backgroundColor = "var(--green)";
            }
          }}
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
