"use client";

import { useEffect, useState, useMemo } from "react";

export type CharityCategory = 
  | "Local"
  | "Education" 
  | "Climate Action"
  | "Humanitarian Crises"
  | "Health"
  | "Children & Youth";

// Categories available for filtering (Local is for future hardcoded charities)
const FILTER_CATEGORIES: CharityCategory[] = [
  "Local",
  "Education",
  "Climate Action", 
  "Humanitarian Crises",
  "Health",
  "Children & Youth",
];

export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
  categories?: CharityCategory[];
}

interface CharityPickerProps {
  selected: Charity[];
  onToggle: (charity: Charity) => void;
}

// Fisher-Yates shuffle for random ordering
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function CharityPicker({ selected, onToggle }: CharityPickerProps) {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<CharityCategory>("Local");

  // Select a filter category (single-select, always one active)
  const selectFilter = (category: CharityCategory) => {
    setActiveFilter(category);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCharities() {
      try {
        // Fetch from our charities API
        const response = await fetch("/api/charities");
        if (!response.ok) {
          throw new Error("Failed to load charities");
        }

        const data = await response.json();
        if (isMounted && Array.isArray(data.charities)) {
          // Shuffle charities on initial load for random distribution
          setCharities(shuffleArray(data.charities));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load charities"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCharities();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter charities based on active filter (single category)
  const displayedCharities = useMemo(() => {
    // Filter charities that match the active category
    // For Local category, show all to include all hardcoded charities
    // For other categories, limit to 10
    const limit = activeFilter === "Local" ? 999 : 10;
    let count = 0;
    return charities.filter((charity) => {
      if (count >= limit) return false;
      
      const charityCategories = charity.categories || [];
      const matches = charityCategories.includes(activeFilter);
      
      if (matches) {
        count++;
      }
      return matches;
    });
  }, [charities, activeFilter]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div 
          className="font-body text-base animate-pulse"
          style={{ color: "var(--muted)" }}
        >
          Loading charities...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p 
          className="font-body text-base mb-3"
          style={{ color: "var(--red)" }}
        >
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="font-body text-sm transition-colors duration-200"
          style={{ color: "var(--green)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--green-light)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--green)"}
        >
          Try again
        </button>
      </div>
    );
  }

  if (charities.length === 0) {
    return (
      <div 
        className="text-center py-12 font-body text-base"
        style={{ color: "var(--muted)" }}
      >
        No charities available. Please check back later.
      </div>
    );
  }

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

  return (
    <div className="space-y-8">
      {/* Category Filter Buttons (single-select) */}
      <div className="flex flex-wrap gap-3 justify-center">
        {FILTER_CATEGORIES.map((category) => {
          const isActive = activeFilter === category;
          return (
            <button
              key={category}
              onClick={() => selectFilter(category)}
              className="px-5 py-2 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: isActive ? "var(--green)" : "transparent",
                color: isActive ? "var(--white)" : "var(--muted)",
                border: isActive ? "1px solid var(--green)" : "1px solid var(--border)",
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--green)";
                  e.currentTarget.style.color = "var(--green)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Results info */}
      <p 
        className="text-center font-body text-sm"
        style={{ color: "var(--muted)" }}
      >
        Showing {displayedCharities.length} charit{displayedCharities.length === 1 ? "y" : "ies"} in {activeFilter}
      </p>

      {/* No results message */}
      {displayedCharities.length === 0 && (
        <div 
          className="text-center py-12 font-body text-base"
          style={{ color: "var(--muted)" }}
        >
          No charities found in {activeFilter}. Check back later!
        </div>
      )}

      {/* Charity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {displayedCharities.map((charity) => {
        const isSelected = selected.some((item) => item.id === charity.id);
        const isExpanded = expandedIds.has(charity.id);

        return (
          <button
            key={charity.id}
            onClick={() => onToggle(charity)}
            className="p-5 text-left transition-all duration-200"
            style={{
              backgroundColor: isSelected ? "rgba(0, 122, 85, 0.04)" : "var(--white)",
              border: isSelected ? "2px solid var(--green)" : "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = "var(--tan)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = "var(--border)";
              }
            }}
          >
            <div className="flex flex-col gap-4">
              {typeof charity.imageUrl === "string" && charity.imageUrl ? (
                <img
                  src={charity.imageUrl}
                  alt={charity.name}
                  className="h-44 w-full object-cover"
                  style={{ backgroundColor: "var(--border)" }}
                />
              ) : (
                <div 
                  className="h-44 w-full flex items-center justify-center"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(162, 137, 108, 0.1) 0%, rgba(0, 122, 85, 0.08) 100%)"
                  }}
                >
                  {charity.logo ? (
                    <span className="text-5xl">{charity.logo}</span>
                  ) : (
                    <span 
                      className="text-4xl font-display"
                      style={{ color: "var(--tan)", fontWeight: 500 }}
                    >
                      {charity.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div className="flex-1">
                <p 
                  className="font-body text-lg mb-1"
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
                    className="font-body text-sm mt-2 inline-flex transition-colors duration-200"
                    style={{ color: "var(--green)" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--green-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--green)"}
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </span>
                )}
              </div>
            </div>
            {isSelected && (
              <span 
                className="mt-4 inline-flex items-center gap-2 font-body text-sm"
                style={{ color: "var(--green)", fontWeight: 500 }}
              >
                <span className="text-base">✓</span>
                Selected
              </span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
