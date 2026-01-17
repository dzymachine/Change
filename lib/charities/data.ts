/**
 * Charity type definition
 * Used throughout the app for charity data
 */
export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
}

/**
 * Get charity by ID
 * This is a client-side fallback - prefer fetching from /api/charities
 */
export function getCharityById(id: string): Charity | undefined {
  // This should be fetched from Supabase in production
  // Keeping as a fallback for edge cases
  return undefined;
}
