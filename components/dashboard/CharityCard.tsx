"use client";

import { useState } from "react";

interface CharityCardProps {
  id: string;
  name: string;
  logo?: string;
  category?: string | null;
  imageUrl?: string | null;
  charityUrl?: string;
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
  logo,
  imageUrl,
  charityUrl,
  category,
  goalAmount,
  currentAmount,
  isCompleted,
  donationMode,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const clampedCurrentAmount =
    goalAmount > 0 ? Math.min(currentAmount, goalAmount) : currentAmount;

  const progress =
    goalAmount > 0 ? (clampedCurrentAmount / goalAmount) * 100 : 0;
  const progressPercent = Math.round(progress);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasImage = typeof imageUrl === "string" && imageUrl.length > 0;

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
          transform: isDragging ? 'scale(1.03) rotate(1deg)' : 'scale(1) rotate(0deg)',
          backgroundColor: "var(--white)",
          border: isDragging ? "2px solid var(--green)" : "1px solid var(--border)",
          boxShadow: isDragging ? "0 10px 25px rgba(0, 122, 85, 0.15)" : "none",
          opacity: isCompleted ? 0.7 : 1,
          borderRadius: "12px",
        }}
        className={`p-4 flex flex-col min-h-[220px] sm:min-h-[240px] select-none ${
          draggable 
            ? "cursor-grab active:cursor-grabbing" 
            : ""
        } ${
          donationMode === "priority" 
            ? "hover:shadow-md hover:-translate-y-0.5" 
            : ""
        }`}
      >
        {/* Menu */}
        <div className="flex items-center justify-end mb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="p-1 transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              aria-label="Charity options"
            >
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
                  d="M6 12h.01M12 12h.01M18 12h.01"
                />
              </svg>
            </button>
            {isMenuOpen && (
              <div 
                className="absolute right-0 z-10 mt-2 w-40"
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  borderRadius: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingGoal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left font-body text-sm transition-colors duration-200"
                  style={{ color: "var(--foreground)" }}
                >
                  Edit goal
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRemove(id);
                    }}
                    className="w-full px-3 py-2 text-left font-body text-sm transition-colors duration-200"
                    style={{ color: "var(--red)" }}
                  >
                    Remove charity
                  </button>
                )}
                {charityUrl && (
                  <a
                    href={charityUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full px-3 py-2 text-left font-body text-sm transition-colors duration-200"
                    style={{ color: "var(--foreground)" }}
                  >
                    Open charity page
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Header with image placeholder */}
        <div 
          className="w-full h-24 sm:h-28 mb-3 flex items-center justify-center overflow-hidden"
          style={{ 
            background: hasImage ? "transparent" : "linear-gradient(135deg, rgba(162, 137, 108, 0.08) 0%, rgba(0, 122, 85, 0.05) 100%)",
            borderRadius: "8px",
          }}
        >
          {hasImage ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 flex items-center justify-center font-display text-xl"
              style={{ 
                backgroundColor: "rgba(162, 137, 108, 0.15)",
                color: "var(--tan)",
                fontWeight: 600,
                borderRadius: "50%",
              }}
            >
              {logo || initials}
            </div>
          )}
        </div>

        {/* Name and category */}
        <h3 
          className="font-body text-sm truncate"
          style={{ color: "var(--foreground)", fontWeight: 500 }}
        >
          {name}
        </h3>
        {category && (
          <p 
            className="font-body text-xs mb-3"
            style={{ color: "var(--muted)" }}
          >
            {category}
          </p>
        )}
        {!category && <div className="mb-3" />}

        {isEditingGoal ? (
          <div className="mt-auto space-y-2">
            <div className="relative">
              <span 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--muted)" }}
              >
                $
              </span>
              <input
                type="number"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                min="1"
                step="0.01"
                className="w-full pl-5 pr-2 py-1 font-body text-xs transition-all duration-200"
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
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoalSave}
                className="flex-1 py-1 font-body text-xs transition-all duration-200"
                style={{
                  backgroundColor: "var(--green)",
                  color: "var(--white)",
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingGoal(false);
                  setEditGoal(goalAmount.toFixed(2));
                }}
                className="flex-1 py-1 font-body text-xs transition-all duration-200"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div 
              className="h-1.5 overflow-hidden mb-2 mt-auto"
              style={{ backgroundColor: "var(--border)", borderRadius: "9999px" }}
            >
              <div
                style={{ 
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "var(--green)",
                  borderRadius: "9999px",
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>

            {/* Progress info */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span style={{ color: "var(--muted)" }}>{progressPercent}%</span>
              <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                ${clampedCurrentAmount.toFixed(2)} / ${goalAmount.toFixed(2)}
              </span>
            </div>
          </>
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
      className={`p-5 transition-all ${draggable ? "cursor-move" : ""} ${donationMode === "priority" ? "hover:shadow-md hover:-translate-y-0.5" : ""}`}
      style={{
        backgroundColor: "var(--white)",
        border: isDragging ? "2px solid var(--green)" : "1px solid var(--border)",
        opacity: isCompleted ? 0.7 : 1,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        boxShadow: isDragging ? "0 8px 20px rgba(0, 122, 85, 0.12)" : "none",
        borderRadius: "12px",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: hasImage ? "transparent" : "rgba(162, 137, 108, 0.1)",
              borderRadius: "50%",
            }}
          >
            {hasImage ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span 
                className="font-display text-lg"
                style={{ color: "var(--tan)", fontWeight: 600 }}
              >
                {logo || initials}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 
                className="font-body"
                style={{ color: "var(--foreground)", fontWeight: 500 }}
              >
                {name}
              </h3>
              {category && (
                <span 
                  className="font-mono text-xs px-2 py-0.5"
                  style={{ 
                    backgroundColor: "rgba(162, 137, 108, 0.1)",
                    color: "var(--muted)",
                    borderRadius: "4px",
                  }}
                >
                  {category}
                </span>
              )}
            </div>
            <p 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              {progressPercent}% of goal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingGoal ? (
            <div className="flex items-center gap-1">
              <span 
                className="font-body text-sm"
                style={{ color: "var(--muted)" }}
              >
                Goal
              </span>
              <div className="relative">
                <span 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  onBlur={handleGoalSave}
                  onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                  autoFocus
                  className="w-20 pl-5 pr-2 py-1 font-body text-sm"
                  style={{
                    backgroundColor: "var(--white)",
                    border: "1px solid var(--green)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="flex items-center gap-1 font-body text-sm transition-colors duration-200"
              style={{ color: "var(--muted)" }}
            >
              <span>Goal</span>
              <span style={{ fontWeight: 500 }}>${goalAmount.toFixed(2)}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-1.5 transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--red)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div 
        className="h-1.5 overflow-hidden mb-3"
        style={{ backgroundColor: "var(--border)", borderRadius: "9999px" }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ 
            width: `${progress}%`,
            backgroundColor: "var(--green)",
            borderRadius: "9999px",
          }}
        />
      </div>

      {/* Progress details - matching reference layout */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <span 
          className="font-body text-sm"
          style={{ color: "var(--foreground)" }}
        >
          ${clampedCurrentAmount.toFixed(2)} toward ${goalAmount.toFixed(2)}
        </span>
        <div className="flex justify-between sm:justify-end gap-4 sm:gap-6 text-right">
          <div>
            <p 
              className="font-mono text-xs"
              style={{ color: "var(--muted)" }}
            >
              Progress
            </p>
            <p 
              className="font-body"
              style={{ color: "var(--foreground)", fontWeight: 600 }}
            >
              ${clampedCurrentAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p 
              className="font-mono text-xs"
              style={{ color: "var(--muted)" }}
            >
              Goal
            </p>
            <p 
              className="font-body"
              style={{ color: "var(--foreground)", fontWeight: 600 }}
            >
              ${goalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
