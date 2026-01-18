"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Charity } from "@/components/onboarding/CharityPicker";
import { saveCharityGoals } from "@/actions/donations";

interface CharityGoal {
  charityId: string;
  charityInfo?: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    imageUrl?: string;
  };
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

  // Load selected charities from sessionStorage
  useEffect(() => {
    let isMounted = true;
    const cleanup = () => {
      isMounted = false;
    };
    
    // Small delay to ensure sessionStorage is ready after navigation
    const timer = setTimeout(() => {
      if (!isMounted) return;
      
      const stored = sessionStorage.getItem("onboarding_charities");
      console.log("[Goals] sessionStorage check:", stored ? "found" : "empty");
      
      if (!stored) {
        console.log("[Goals] No charities in sessionStorage, redirecting to charities page");
        router.replace("/onboarding/charities");
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stored);
      } catch (e) {
        console.log("[Goals] Failed to parse sessionStorage:", e);
        router.replace("/onboarding/charities");
        return;
      }

      const isCharity = (value: unknown): value is Charity =>
        Boolean(
          value &&
            typeof value === "object" &&
            "id" in value &&
            "name" in value
        );

      const loadFromIds = async (ids: string[]) => {
        try {
          // Fetch charities from our Supabase endpoint
          const response = await fetch("/api/charities");
          if (response.ok) {
            const data = await response.json();
            const fromApi = Array.isArray(data.charities)
              ? (data.charities as Charity[]).filter((c) => ids.includes(c.id))
              : [];
            if (isMounted && fromApi.length > 0) {
              setSelectedCharities(fromApi);
              return;
            }
          }
        } catch {
          // If API fails, redirect back to charity selection
        }

        if (isMounted) {
          router.replace("/onboarding/charities");
        }
      };

      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        loadFromIds(parsed);
        return;
      }

      if (Array.isArray(parsed)) {
        const charities = parsed.filter(isCharity);
        if (charities.length === 0) {
          router.replace("/onboarding/charities");
          return;
        }
        setSelectedCharities(charities);
        return;
      }

      router.replace("/onboarding/charities");
    }, 50); // Small delay to ensure client hydration is complete
    
    return () => {
      cleanup();
      clearTimeout(timer);
    };
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

    // Save the goal with full charity info for upsert
    const newGoals: CharityGoal[] = [
      ...goals,
      { 
        charityId: currentCharity.id, 
        charityInfo: {
          id: currentCharity.id,
          name: currentCharity.name,
          description: currentCharity.description,
          logo: currentCharity.logo,
          imageUrl: currentCharity.imageUrl,
        },
        goalAmount: amount 
      },
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
        try {
          console.log("[Goals] Saving single charity goal...");
          const result = await saveCharityGoals(newGoals);
          console.log("[Goals] Save result:", result);
          setIsSaving(false);

          if (!result.success) {
            setError(result.error || "Failed to save goals");
            return;
          }

          // Clear sessionStorage and move to next step
          sessionStorage.removeItem("onboarding_charities");
          console.log("[Goals] Navigating to plaid page...");
          // Use full page navigation to ensure cookies from server action are properly handled
          window.location.href = "/onboarding/plaid";
        } catch (err) {
          console.error("[Goals] Error saving goals:", err);
          setIsSaving(false);
          setError("An unexpected error occurred. Please try again.");
        }
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
          Step 2 of {totalSteps}
        </p>
        <h1 
          className="font-display text-3xl md:text-4xl mb-4"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          Set your goals
        </h1>
        <p 
          className="font-body text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Set a donation goal for each charity. This helps you track your giving progress.
        </p>
      </header>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        {selectedCharities.map((_, index) => (
          <div
            key={index}
            className="h-1 transition-all duration-300"
            style={{
              width: index === currentIndex ? "2rem" : "0.5rem",
              backgroundColor: index <= currentIndex ? "var(--green)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* Charity card with sliding animation */}
      <div className="relative overflow-hidden min-h-[320px]">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isSliding
              ? slideDirection === "out"
                ? "-translate-x-full opacity-0"
                : "translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div 
            className="p-8 text-center space-y-6"
            style={{ 
              backgroundColor: "var(--white)",
              border: "1px solid var(--border)",
            }}
          >
            {currentCharity.imageUrl ? (
              <img
                src={currentCharity.imageUrl}
                alt={currentCharity.name}
                className="mx-auto h-28 w-28 object-cover"
                style={{ backgroundColor: "var(--border)" }}
              />
            ) : (
              <div 
                className="mx-auto h-28 w-28 flex items-center justify-center"
                style={{ 
                  background: "linear-gradient(135deg, rgba(162, 137, 108, 0.1) 0%, rgba(0, 122, 85, 0.08) 100%)"
                }}
              >
                {currentCharity.logo ? (
                  <span className="text-5xl">{currentCharity.logo}</span>
                ) : (
                  <span 
                    className="text-4xl font-display"
                    style={{ color: "var(--tan)", fontWeight: 500 }}
                  >
                    {currentCharity.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <div>
              <h2 
                className="font-display text-2xl mb-2"
                style={{ color: "var(--foreground)", fontWeight: 500 }}
              >
                {currentCharity.name}
              </h2>
              <p 
                className="font-body text-sm leading-relaxed max-w-md mx-auto"
                style={{ color: "var(--muted)" }}
              >
                {currentCharity.description}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label
                htmlFor="goal"
                className="block font-body text-sm"
                style={{ color: "var(--muted)" }}
              >
                Donation Goal
              </label>
              <div className="relative max-w-[200px] mx-auto">
                <span 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-body"
                  style={{ color: "var(--muted)" }}
                >
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
                  className="w-full pl-10 pr-4 py-3 text-2xl text-center font-body transition-all duration-200"
                  style={{
                    backgroundColor: "var(--white)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--green)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                  disabled={isSaving}
                />
              </div>
              <p 
                className="font-mono text-xs"
                style={{ color: "var(--muted)", opacity: 0.6 }}
              >
                Press Enter to continue
              </p>
            </div>
          </div>
        </div>
      </div>

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
          onClick={() => router.push("/onboarding/charities")}
          className="font-body text-sm transition-colors duration-200"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
          disabled={isSaving}
        >
          Back
        </button>
        <div className="flex items-center gap-6">
          <span 
            className="font-mono text-xs"
            style={{ color: "var(--muted)" }}
          >
            {currentIndex + 1} of {selectedCharities.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentGoal || isSaving}
            className="px-8 py-3 font-body text-sm tracking-wide transition-all duration-200"
            style={{
              backgroundColor: currentGoal && !isSaving ? "var(--green)" : "var(--border)",
              color: currentGoal && !isSaving ? "var(--white)" : "var(--muted)",
              cursor: currentGoal && !isSaving ? "pointer" : "not-allowed",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (currentGoal && !isSaving) {
                e.currentTarget.style.backgroundColor = "var(--green-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentGoal && !isSaving) {
                e.currentTarget.style.backgroundColor = "var(--green)";
              }
            }}
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
