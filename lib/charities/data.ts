export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

// Mock charities - will be replaced with real data from GlobalGiving API
// Using numerical string IDs to match external charity API format
export const mockCharities: Charity[] = [
  {
    id: "1001",
    name: "Local Food Bank",
    description: "Fighting hunger in your local community",
    logo: "🍎",
  },
  {
    id: "1002",
    name: "Clean Water Initiative",
    description: "Providing clean water to communities in need",
    logo: "💧",
  },
  {
    id: "1003",
    name: "Education For All",
    description: "Supporting education in underserved areas",
    logo: "📚",
  },
  {
    id: "1004",
    name: "Animal Rescue League",
    description: "Saving and caring for abandoned animals",
    logo: "🐾",
  },
  {
    id: "1005",
    name: "Environmental Defense",
    description: "Protecting our planet for future generations",
    logo: "🌍",
  },
  {
    id: "1006",
    name: "Mental Health Support",
    description: "Providing resources for mental wellness",
    logo: "🧠",
  },
];

export function getCharityById(id: string): Charity | undefined {
  return mockCharities.find((c) => c.id === id);
}
