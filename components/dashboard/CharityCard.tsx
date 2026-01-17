"use client";

import { useState } from "react";

interface CharityCardProps {
  id: string;
  name: string;
  location?: string;
  imageUrl?: string;
  goalAmount: number;
  currentAmount: number;
  priority: number;
  isCompleted: boolean;
  donationMode: "random" | "priority";
  onGoalChange?: (id: string, newGoal: number) => void;
  onRemove?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  compact?: boolean;
}

export function CharityCard({
  id,
  name,
  location = "Santa Cruz",
  imageUrl,
  goalAmount,
  currentAmount,
  isCompleted,
  onGoalChange,
  onRemove,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging = false,
  compact = false,
}: CharityCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(goalAmount.toFixed(2));

  const progress = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
  const progressPercent = Math.round(progress);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Generate a consistent color based on the charity name
  const colors = [
    { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500" },
    { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-500" },
    { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-500" },
    { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" },
    { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", bar: "bg-rose-500" },
    { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", bar: "bg-cyan-500" },
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  const handleGoalSave = () => {
    const newGoal = parseFloat(editGoal);
    if (!isNaN(newGoal) && newGoal > 0 && onGoalChange) {
      onGoalChange(id, newGoal);
    }
    setIsEditingGoal(false);
  };

  // Compact card layout for grid view
  if (compact) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        style={{
          transition: isDragging 
            ? 'transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s ease-out' 
            : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.05) rotate(2deg)' : 'scale(1) rotate(0deg)',
        }}
        className={`bg-white border rounded-xl p-4 flex flex-col min-h-[200px] select-none ${
          draggable 
            ? "cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-gray-300 hover:-translate-y-1" 
            : "hover:shadow-sm"
        } ${isDragging 
            ? "border-emerald-500 shadow-2xl z-50 opacity-95" 
            : "border-gray-200 shadow-sm"
        } ${isCompleted ? "opacity-80" : ""}`}
      >
        {/* Drag indicator for priority mode */}
        {draggable && (
          <div className="flex justify-center mb-2 transition-opacity duration-200">
            <div className="flex gap-1 opacity-40 hover:opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}

        {/* Header with image placeholder */}
        <div className="w-full h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 mb-3 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-base font-bold ${color.border} border-2`}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name and location */}
        <h3 className="font-semibold text-black text-sm truncate">{name}</h3>
        <p className="text-xs text-gray-500 mb-3">{location}</p>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2 mt-auto">
          <div
            className={`h-full rounded-full ${
              isCompleted ? "bg-emerald-500" : color.bar
            }`}
            style={{ 
              width: `${progress}%`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Progress info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">{progressPercent}%</span>
          <span className="text-black font-semibold">${currentAmount.toFixed(2)} / ${goalAmount.toFixed(2)}</span>
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="mt-3 w-full py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  // Full card layout (original)
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded-xl p-5 transition-all ${
        draggable ? "cursor-move" : ""
      } ${isDragging ? "border-emerald-500 shadow-lg scale-[1.02]" : "border-gray-200"} ${
        isCompleted ? "opacity-70" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full ${color.bg} ${color.text} flex items-center justify-center text-sm font-semibold ${color.border} border`}
              >
                {initials}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-black">{name}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {location}
              </span>
            </div>
            <p className="text-sm text-gray-500">{progressPercent}% of goal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingGoal ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">Goal</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  onBlur={handleGoalSave}
                  onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                  autoFocus
                  className="w-20 pl-5 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <span>Goal</span>
              <span className="font-medium">${goalAmount.toFixed(2)}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted ? "bg-emerald-500" : "bg-black"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress details - matching reference layout */}
      <div className="flex items-end justify-between">
        <span className="text-sm text-black">
          ${currentAmount.toFixed(2)} toward ${goalAmount.toFixed(2)}
        </span>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs text-gray-500">Progress</p>
            <p className="font-semibold text-black">
              ${currentAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Goal</p>
            <p className="font-semibold text-black">${goalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
