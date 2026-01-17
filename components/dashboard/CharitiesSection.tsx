"use client";

import { useState, useTransition } from "react";
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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

  const handleAddCharity = async (charityId: string, goalAmount: number) => {
    await addUserCharity(charityId, goalAmount);
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

  return (
    <div className="bg-white border rounded-xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-black">Your Charities</h2>
          <p className="text-sm text-gray-500">
            {showCompleted ? "Completed goals" : `Active donations (${activeCharities.length}/${maxCharities})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active/Completed filter tiles */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
            <button
              onClick={() => setShowCompleted(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
                !showCompleted
                  ? "bg-white text-black shadow-md transform scale-[1.02]"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
                showCompleted
                  ? "bg-white text-black shadow-md transform scale-[1.02]"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Random shuffle button */}
          <button
            onClick={() => handleModeChange("random")}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ease-out hover:shadow-md ${
              mode === "random"
                ? "bg-black text-white border-black shadow-md"
                : "bg-white text-black border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5"
            }`}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${mode === "random" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Random shuffle
          </button>

          {/* Priority queue button */}
          <button
            onClick={() => handleModeChange("priority")}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ease-out hover:shadow-md ${
              mode === "priority"
                ? "bg-black text-white border-black shadow-md"
                : "bg-white text-black border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5"
            }`}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${mode === "priority" ? "scale-110" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            Priority queue
          </button>

        </div>
      </div>

      {/* Charities grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-300">
        {displayedCharities.map((charity, index) => (
          <CharityCard
            key={charity.id}
            id={charity.id}
            name={charity.name}
            imageUrl={charity.imageUrl || undefined}
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
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out min-h-[200px] group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110">
              <svg className="w-6 h-6 text-gray-400 transition-colors duration-300 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm text-gray-500 font-medium transition-colors duration-300 group-hover:text-emerald-600">Add Charity</span>
          </button>
        )}

        {/* Empty placeholder cards to fill the row */}
        {!showCompleted && activeCharities.length < maxCharities - 1 && 
          Array.from({ length: Math.max(0, 4 - activeCharities.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="border border-transparent rounded-xl min-h-[180px]" />
          ))
        }
      </div>

      {mode === "priority" && !showCompleted && activeCharities.length > 1 && (
        <p className="text-xs text-gray-600 text-center mt-4">
          Drag to reorder priorities
        </p>
      )}

      {/* Add Charity Modal */}
      <AddCharityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingCharityIds={existingCharityIds}
        onAddCharity={handleAddCharity}
      />
    </div>
  );
}
