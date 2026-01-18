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
      <div className="text-center py-8">
        <div className="animate-pulse text-gray-500">Loading charities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <br />
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-emerald-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (charities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
    <div className="space-y-6">
      {/* Category Filter Buttons (single-select) */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FILTER_CATEGORIES.map((category) => {
          const isActive = activeFilter === category;
          return (
            <button
              key={category}
              onClick={() => selectFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Results info */}
      <p className="text-center text-sm text-gray-500">
        Showing {displayedCharities.length} charit{displayedCharities.length === 1 ? "y" : "ies"} in {activeFilter}
      </p>

      {/* No results message */}
      {displayedCharities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
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
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex flex-col gap-4">
              {typeof charity.imageUrl === "string" && charity.imageUrl ? (
                <img
                  src={charity.imageUrl}
                  alt={charity.name}
                  className="h-44 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="h-44 w-full rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  {charity.logo ? (
                    <span className="text-5xl">{charity.logo}</span>
                  ) : (
                    <span className="text-4xl font-bold text-emerald-300">
                      {charity.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold text-black">
                  {charity.name}
                </p>
                <p
                  className={`text-sm text-gray-500 mt-1 ${
                    isExpanded ? "" : "line-clamp-2"
                  }`}
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
                    className="text-sm text-emerald-600 hover:underline mt-1 inline-flex"
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </span>
                )}
              </div>
            </div>
            {isSelected && (
              <span className="mt-4 inline-flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <span className="text-lg">✓</span>
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
