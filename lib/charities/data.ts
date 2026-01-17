export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

// Mock charities - will be replaced with real data from database
// Using UUIDs to match database schema
export const mockCharities: Charity[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Local Food Bank",
    description: "Fighting hunger in your local community",
    logo: "🍎",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Clean Water Initiative",
    description: "Providing clean water to communities in need",
    logo: "💧",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Education For All",
    description: "Supporting education in underserved areas",
    logo: "📚",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Animal Rescue League",
    description: "Saving and caring for abandoned animals",
    logo: "🐾",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Environmental Defense",
    description: "Protecting our planet for future generations",
    logo: "🌍",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Mental Health Support",
    description: "Providing resources for mental wellness",
    logo: "🧠",
  },
];

export function getCharityById(id: string): Charity | undefined {
  return mockCharities.find((c) => c.id === id);
}
