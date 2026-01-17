"use client";

import { useState, useTransition, useEffect } from "react";

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
    charities: { id: string; name?: string; logo?: string; imageUrl?: string }[],
    goalAmount: number
  ) => Promise<void>;
}

export function AddCharityModal({
  isOpen,
  onClose,
  existingCharityIds,
  onAddCharities,
}: AddCharityModalProps) {
  const [selectedCharities, setSelectedCharities] = useState<Charity[]>([]);
  const [goalAmount, setGoalAmount] = useState<string>("5.00");
  const [isPending, startTransition] = useTransition();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

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
        return prev.filter((item) => item.id !== charity.id);
      }
      if (prev.length >= maxSelectable) {
        return prev;
      }
      return [...prev, charity];
    });
  };

  const handleAdd = () => {
    if (selectedCharities.length === 0) return;

    startTransition(async () => {
      await onAddCharities(
        selectedCharities.map((charity) => ({
          id: charity.id,
          name: charity.name,
          logo: charity.logo,
          imageUrl: charity.imageUrl,
        })),
        parseFloat(goalAmount) || 5
      );
      setSelectedCharities([]);
      setGoalAmount("5.00");
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add Charity</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading charities...</p>
          ) : availableCharities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              You&apos;ve added all available charities!
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Select up to {maxSelectable} charities
              </p>
              {availableCharities.map((charity) => (
                <button
                  key={charity.id}
                  onClick={() => toggleCharity(charity)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedCharities.some((item) => item.id === charity.id)
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {charity.imageUrl ? (
                        <img
                          src={charity.imageUrl}
                          alt={charity.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{charity.logo}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-black">{charity.name}</p>
                      <p className="text-sm text-gray-500">
                        {charity.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedCharities.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donation Goal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full pl-7 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleAdd}
            disabled={
              selectedCharities.length === 0 ||
              isPending ||
              availableCharities.length === 0
            }
            className="w-full py-2.5 bg-black text-white rounded-lg font-medium transition-colors hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPending
              ? "Adding..."
              : `Add ${selectedCharities.length || ""} Charit${selectedCharities.length === 1 ? "y" : "ies"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
