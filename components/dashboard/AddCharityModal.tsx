"use client";

import { useRef, useState, useTransition, useEffect } from "react";

interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

interface AddCharityModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCharityIds: string[];
  onAddCharities: (
    charities: {
      id: string;
      name?: string;
      logo?: string;
      imageUrl?: string;
      goalAmount: number;
    }[]
  ) => Promise<void>;
}

export function AddCharityModal({
  isOpen,
  onClose,
  existingCharityIds,
  onAddCharities,
}: AddCharityModalProps) {
  const [step, setStep] = useState<"select" | "goals">("select");
  const [selectedCharities, setSelectedCharities] = useState<Charity[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [goalAmounts, setGoalAmounts] = useState<Record<string, string>>({});
  const [goalError, setGoalError] = useState<string | null>(null);
  const goalInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isPending, startTransition] = useTransition();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setStep("select");
    setSelectedCharities([]);
    setExpandedIds(new Set());
    setGoalAmounts({});
    setGoalError(null);

    async function fetchCharities() {
      try {
        const response = await fetch("/api/charities");
        if (response.ok) {
          const data = await response.json();
          setCharities(data.charities || []);
        }
      } catch (error) {
        console.error("Failed to fetch charities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCharities();
  }, [isOpen]);

  const availableCharities = charities.filter(
    (c) => !existingCharityIds.includes(c.id)
  );

  const maxSelectable = Math.max(0, 5 - existingCharityIds.length);

  const toggleCharity = (charity: Charity) => {
    setSelectedCharities((prev) => {
      const exists = prev.some((item) => item.id === charity.id);
      if (exists) {
        setGoalAmounts((current) => {
          const next = { ...current };
          delete next[charity.id];
          return next;
        });
        return prev.filter((item) => item.id !== charity.id);
      }
      if (prev.length >= maxSelectable) {
        return prev;
      }
      setGoalAmounts((current) => ({
        ...current,
        [charity.id]: current[charity.id] ?? "5.00",
      }));
      return [...prev, charity];
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (selectedCharities.length === 0) return;
    const invalid = selectedCharities.find((charity) => {
      const value = parseFloat(goalAmounts[charity.id] || "");
      return Number.isNaN(value) || value <= 0;
    });
    if (invalid) {
      setGoalError("Enter a valid donation goal for each charity.");
      goalInputRefs.current[invalid.id]?.focus();
      return;
    }

    startTransition(async () => {
      setGoalError(null);
      await onAddCharities(
        selectedCharities.map((charity) => ({
          id: charity.id,
          name: charity.name,
          logo: charity.logo,
          imageUrl: charity.imageUrl,
          goalAmount: parseFloat(goalAmounts[charity.id]),
        }))
      );
      setSelectedCharities([]);
      setGoalAmounts({});
      setStep("select");
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div 
        className="relative w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: "var(--white)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div 
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 
              className="font-display text-xl"
              style={{ color: "var(--foreground)", fontWeight: 500 }}
            >
              {step === "select" ? "Add Charity" : "Set Goals"}
            </h2>
            <p 
              className="font-mono text-xs uppercase tracking-wider mt-1"
              style={{ color: "var(--tan)" }}
            >
              Step {step === "select" ? "1" : "2"} of 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors duration-200"
            style={{ color: "var(--muted)" }}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "select" ? (
            loading ? (
              <p 
                className="text-center font-body py-8"
                style={{ color: "var(--muted)" }}
              >
                Loading charities...
              </p>
            ) : availableCharities.length === 0 ? (
              <p 
                className="text-center font-body py-8"
                style={{ color: "var(--muted)" }}
              >
                You&apos;ve added all available charities!
              </p>
            ) : (
              <div className="space-y-3">
                <p 
                  className="font-body text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  Select up to {maxSelectable} charities
                </p>
                {availableCharities.map((charity) => {
                  const isExpanded = expandedIds.has(charity.id);
                  const isSelected = selectedCharities.some((item) => item.id === charity.id);

                  return (
                    <button
                      key={charity.id}
                      onClick={() => toggleCharity(charity)}
                      className="w-full p-4 text-left transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? "rgba(0, 122, 85, 0.04)" : "var(--white)",
                        border: isSelected ? "2px solid var(--green)" : "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-16 h-16 overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{ 
                            backgroundColor: charity.imageUrl ? "transparent" : "rgba(162, 137, 108, 0.1)"
                          }}
                        >
                          {charity.imageUrl ? (
                            <img
                              src={charity.imageUrl}
                              alt={charity.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{charity.logo}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-body truncate"
                            style={{ color: "var(--foreground)", fontWeight: 500 }}
                          >
                            {charity.name}
                          </p>
                          <p
                            className={`font-body text-sm leading-relaxed ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                            style={{ color: "var(--muted)" }}
                          >
                            {charity.description}
                          </p>
                          {charity.description.length > 80 && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleExpanded(charity.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  toggleExpanded(charity.id);
                                }
                              }}
                              className="font-body text-sm mt-1 inline-flex transition-colors duration-200"
                              style={{ color: "var(--green)" }}
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <label 
                className="block font-body text-sm"
                style={{ color: "var(--muted)" }}
              >
                Donation Goals
              </label>
              {selectedCharities.map((charity) => (
                <div key={charity.id} className="flex items-center gap-3">
                  <div 
                    className="flex-1 font-body text-sm truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {charity.name}
                  </div>
                  <div className="relative w-32">
                    <span 
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--muted)" }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      value={goalAmounts[charity.id] || ""}
                      onChange={(e) =>
                        setGoalAmounts((current) => ({
                          ...current,
                          [charity.id]: e.target.value,
                        }))
                      }
                      ref={(el) => {
                        goalInputRefs.current[charity.id] = el;
                      }}
                      min="1"
                      step="0.01"
                      placeholder="10.00"
                      className="w-full pl-7 pr-3 py-2 font-body text-sm transition-all duration-200"
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
                </div>
              ))}
              {goalError && (
                <p 
                  className="font-body text-sm"
                  style={{ color: "var(--red)" }}
                >
                  {goalError}
                </p>
              )}
            </div>
          )}
        </div>

        <div 
          className="p-6"
          style={{ 
            borderTop: "1px solid var(--border)",
            backgroundColor: "rgba(162, 137, 108, 0.03)",
          }}
        >
          {step === "select" ? (
            <button
              onClick={() => setStep("goals")}
              disabled={
                selectedCharities.length === 0 ||
                isPending ||
                availableCharities.length === 0
              }
              className="w-full py-3 font-body text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: selectedCharities.length > 0 ? "var(--green)" : "var(--border)",
                color: selectedCharities.length > 0 ? "var(--white)" : "var(--muted)",
                fontWeight: 500,
              }}
            >
              Next: Set goals
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-3 font-body text-sm transition-all duration-200"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                Back
              </button>
              <button
                onClick={handleAdd}
                disabled={selectedCharities.length === 0 || isPending}
                className="flex-1 py-3 font-body text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--green)",
                  color: "var(--white)",
                  fontWeight: 500,
                }}
              >
                {isPending
                  ? "Adding..."
                  : `Add ${selectedCharities.length} Charit${selectedCharities.length === 1 ? "y" : "ies"}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
