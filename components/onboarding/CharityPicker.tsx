"use client";

import { useEffect, useState } from "react";
import { mockCharities } from "@/lib/charities/data";

// Re-export for backward compatibility
export { mockCharities, type Charity } from "@/lib/charities/data";

interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

interface CharityPickerProps {
  selected: string[];
  onToggle: (charityId: string, charity?: Charity) => void;
  onCharityData?: (setter: (prev: Map<string, Charity>) => Map<string, Charity>) => void;
}

export function CharityPicker({ selected, onToggle, onCharityData }: CharityPickerProps) {
  const [charities, setCharities] = useState<Charity[]>(mockCharities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCharities() {
      try {
        const response = await fetch("/api/globalgiving/featured");
        if (!response.ok) {
          throw new Error("Failed to load charities");
        }

        const data = await response.json();
        if (isMounted && Array.isArray(data.charities)) {
          setCharities(data.charities);
          // Pass all charity data to parent
          if (onCharityData) {
            onCharityData(() => {
              const map = new Map<string, Charity>();
              data.charities.forEach((c: Charity) => map.set(c.id, c));
              return map;
            });
          }
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
  }, [onCharityData]);

  if (loading) {
    return (
      <div className="text-center text-sm text-gray-500">
        Loading charities...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {charities.map((charity) => {
        const isSelected = selected.includes(charity.id);

        return (
          <button
            key={charity.id}
            onClick={() => onToggle(charity.id, charity)}
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
