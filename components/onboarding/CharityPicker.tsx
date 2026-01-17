"use client";

import { useEffect, useState } from "react";

export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

interface CharityPickerProps {
  selected: Charity[];
  onToggle: (charity: Charity) => void;
}

export function CharityPicker({ selected, onToggle }: CharityPickerProps) {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadCharities() {
      try {
        // Fetch from our Supabase charities table
        const response = await fetch("/api/charities");
        if (!response.ok) {
          throw new Error("Failed to load charities");
        }

        const data = await response.json();
        if (isMounted && Array.isArray(data.charities)) {
          setCharities(data.charities);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {charities.map((charity) => {
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
                <div className="h-44 w-full rounded-xl bg-emerald-50 flex items-center justify-center">
                  <span className="text-5xl">{charity.logo}</span>
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
                {charity.description.length > 140 && (
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
  );
}
