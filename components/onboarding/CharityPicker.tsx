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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {charities.map((charity) => {
        const isSelected = selected.some((item) => item.id === charity.id);

        return (
          <button
            key={charity.id}
            onClick={() => onToggle(charity)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              {typeof charity.imageUrl === "string" && charity.imageUrl ? (
                <img
                  src={charity.imageUrl}
                  alt={charity.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <span className="text-3xl">{charity.logo}</span>
              )}
              <div className="flex-1">
                <p className="font-semibold text-black">{charity.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {charity.description}
                </p>
              </div>
              {isSelected && (
                <span className="text-emerald-500 text-xl">✓</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
