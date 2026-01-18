"use client";

import { useEffect, useState, useTransition } from "react";
import { CharityCard } from "./CharityCard";
import { AddCharityModal } from "./AddCharityModal";
import {
  updateDonationMode,
  updateCharityPriorities,
} from "@/actions/donations";
import { addUserCharity, removeUserCharity, updateCharityGoal } from "@/actions/charities";

interface CharityGoal {
  id: string;
  charityId: string;
  name: string;
  logo: string;
  imageUrl?: string | null;
  goalAmount: number;
  currentAmount: number;
  priority: number;
  isCompleted: boolean;
}

interface CharitiesSectionProps {
  charities: CharityGoal[];
  donationMode: "random" | "priority";
  maxCharities?: number;
}

export function CharitiesSection({
  charities: initialCharities,
  donationMode: initialMode,
  maxCharities = 5,
}: CharitiesSectionProps) {
  const [mode, setMode] = useState(initialMode);
  const [charities, setCharities] = useState(initialCharities);
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  const activeCharities = charities.filter((c) => !c.isCompleted);
  const completedCharities = charities.filter((c) => c.isCompleted);
  const displayedCharities = showCompleted ? completedCharities : activeCharities;

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

    const activeList = charities.filter((c) => !c.isCompleted);
    const completedList = charities.filter((c) => c.isCompleted);

    const newActive = [...activeList];
    const draggedItem = newActive[draggedIndex];
    newActive.splice(draggedIndex, 1);
    newActive.splice(index, 0, draggedItem);

    newActive.forEach((c, i) => {
      c.priority = i + 1;
    });

    setCharities([...newActive, ...completedList]);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null) return;

    const priorities = charities
      .filter((c) => !c.isCompleted)
      .map((c) => ({
        charityId: c.charityId,
        priority: c.priority,
      }));

    startTransition(async () => {
      await updateCharityPriorities(priorities);
    });

    setDraggedIndex(null);
  };

  const handleAddCharities = async (
    charitiesToAdd: {
      id: string;
      name?: string;
      logo?: string;
      imageUrl?: string;
      goalAmount: number;
    }[]
  ) => {
    await Promise.all(
      charitiesToAdd.map((charity) =>
        addUserCharity(charity.id, charity.goalAmount, {
          name: charity.name,
          logo: charity.logo,
          imageUrl: charity.imageUrl,
        })
      )
    );
    // Refresh will happen from revalidatePath
    window.location.reload();
  };

  const handleRemoveCharity = async (id: string) => {
    const charity = charities.find((c) => c.id === id);
    if (!charity) return;

    startTransition(async () => {
      await removeUserCharity(charity.charityId);
      setCharities(charities.filter((c) => c.id !== id));
    });
  };

  const handleGoalChange = async (id: string, newGoal: number) => {
    const charity = charities.find((c) => c.id === id);
    if (!charity) return;

    startTransition(async () => {
      await updateCharityGoal(charity.charityId, newGoal);
      setCharities(
        charities.map((c) =>
          c.id === id ? { ...c, goalAmount: newGoal } : c
        )
      );
    });
  };

  const existingCharityIds = charities.map((c) => c.charityId);
  const showDebug = process.env.NODE_ENV === "development";

  const handleSimulateTransaction = async () => {
    try {
      setIsSimulating(true);
      setSimulateError(null);
      const response = await fetch("/api/debug/simulate-transaction", {
        method: "POST",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to simulate transaction");
      }
      window.location.reload();
    } catch (error) {
      setSimulateError(
        error instanceof Error ? error.message : "Failed to simulate transaction"
      );
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchUrls = async () => {
      try {
        const response = await fetch("/api/charities");
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data.charities)) return;
        const nextMap: Record<string, string> = {};
        for (const charity of data.charities) {
          if (typeof charity.id === "string" && typeof charity.charityUrl === "string") {
            nextMap[charity.id] = charity.charityUrl;
          }
        }
        if (isMounted) setUrlMap(nextMap);
      } catch {
        // Ignore URL lookup failures
      }
    };
    fetchUrls();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="font-body text-2xl mb-1"
            style={{ color: "var(--foreground)", fontWeight: 500 }}
          >
            Your Charities
          </h2>
          <p 
            className="font-body text-sm"
            style={{ color: "var(--muted)" }}
          >
            {showCompleted ? "Completed goals" : `Active donations (${activeCharities.length}/${maxCharities})`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showDebug && (
            <button
              onClick={handleSimulateTransaction}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                borderRadius: "9999px",
              }}
            >
              {isSimulating ? "Simulating..." : "Simulate payment"}
            </button>
          )}
          {/* Active/Completed filter tiles */}
          <div 
            className="flex items-center p-1"
            style={{ backgroundColor: "rgba(162, 137, 108, 0.08)", borderRadius: "9999px" }}
          >
            <button
              onClick={() => setShowCompleted(false)}
              className="px-4 py-1.5 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: !showCompleted ? "var(--white)" : "transparent",
                color: !showCompleted ? "var(--foreground)" : "var(--muted)",
                fontWeight: !showCompleted ? 500 : 400,
                boxShadow: !showCompleted ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                borderRadius: "9999px",
              }}
            >
              Active
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className="px-4 py-1.5 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: showCompleted ? "var(--white)" : "transparent",
                color: showCompleted ? "var(--foreground)" : "var(--muted)",
                fontWeight: showCompleted ? 500 : 400,
                boxShadow: showCompleted ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                borderRadius: "9999px",
              }}
            >
              Completed
            </button>
          </div>

          {/* Random shuffle button */}
          <button
            onClick={() => handleModeChange("random")}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 font-body text-sm transition-all duration-200"
            style={{
              backgroundColor: mode === "random" ? "var(--green)" : "transparent",
              border: mode === "random" ? "1px solid var(--green)" : "1px solid var(--border)",
              color: mode === "random" ? "var(--white)" : "var(--foreground)",
              fontWeight: 500,
              borderRadius: "9999px",
            }}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${mode === "random" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Random
          </button>

          {/* Priority queue button */}
          <button
            onClick={() => handleModeChange("priority")}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 font-body text-sm transition-all duration-200"
            style={{
              backgroundColor: mode === "priority" ? "var(--green)" : "transparent",
              border: mode === "priority" ? "1px solid var(--green)" : "1px solid var(--border)",
              color: mode === "priority" ? "var(--white)" : "var(--foreground)",
              fontWeight: 500,
              borderRadius: "9999px",
            }}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${mode === "priority" ? "scale-110" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            Priority
          </button>

        </div>
      </div>

      {/* Charities grid */}
      {displayedCharities.length === 0 && (
        <div 
          className="col-span-full text-center font-body text-sm mb-2"
          style={{ color: "var(--muted)" }}
        >
          No charities selected yet. Add up to {maxCharities} to start tracking your goals.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-300">
        {displayedCharities.map((charity, index) => (
          <CharityCard
            key={charity.id}
            id={charity.id}
            name={charity.name}
            logo={charity.logo}
            imageUrl={charity.imageUrl}
            charityUrl={urlMap[charity.charityId]}
            goalAmount={charity.goalAmount}
            currentAmount={charity.currentAmount}
            priority={charity.priority}
            isCompleted={charity.isCompleted}
            donationMode={mode}
            onGoalChange={handleGoalChange}
            onRemove={showCompleted ? undefined : handleRemoveCharity}
            draggable={mode === "priority" && !showCompleted && activeCharities.length > 1}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex === index}
            compact
          />
        ))}

        {/* Add charity card - only show in active view when under max */}
        {!showCompleted && activeCharities.length < maxCharities && (
          <button
            onClick={() => setShowAddModal(true)}
            className="p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[200px] group"
            style={{
              border: "2px dashed var(--border)",
              backgroundColor: "transparent",
              borderRadius: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.backgroundColor = "rgba(0, 122, 85, 0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div 
              className="w-12 h-12 flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(162, 137, 108, 0.1)", borderRadius: "50%" }}
            >
              <svg 
                className="w-6 h-6 transition-colors duration-200" 
                style={{ color: "var(--tan)" }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span 
              className="font-body text-sm transition-colors duration-200"
              style={{ color: "var(--muted)" }}
            >
              Add Charity
            </span>
          </button>
        )}

        {/* Empty placeholder cards to fill the row */}
        {!showCompleted && activeCharities.length < maxCharities - 1 && 
          Array.from({ length: Math.max(0, 4 - activeCharities.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[180px]" style={{ border: "1px solid transparent" }} />
          ))
        }
      </div>

      {mode === "priority" && !showCompleted && activeCharities.length > 1 && (
        <p 
          className="font-mono text-xs text-center mt-4"
          style={{ color: "var(--muted)" }}
        >
          Drag to reorder priorities
        </p>
      )}
      {simulateError && (
        <p 
          className="font-body text-xs text-center mt-2"
          style={{ color: "var(--red)" }}
        >
          {simulateError}
        </p>
      )}

      {/* Add Charity Modal */}
        <AddCharityModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          existingCharityIds={existingCharityIds}
          onAddCharities={handleAddCharities}
        />
    </div>
  );
}
