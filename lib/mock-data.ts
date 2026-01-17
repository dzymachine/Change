/**
 * Centralized Mock Data - Single Source of Truth
 * 
 * This file contains all mock/demo data used throughout the app.
 * When integrating with Supabase, these will be replaced with actual database queries.
 * 
 * SUPABASE INTEGRATION NOTES:
 * - Each data type maps to a database table
 * - User-specific data will be fetched using user.id from auth
 * - Real-time subscriptions can be added for live updates
 */

// ============================================
// CHARITIES
// ============================================

export interface Charity {
  id: string;
  name: string;
  description: string;
  location: string;
  logo?: string;
  category?: string;
}

// Available charities (would come from `charities` table)
export const mockCharities: Charity[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Homeless Garden Project",
    description: "Providing job training and support for people experiencing homelessness",
    location: "Santa Cruz",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Gray Bears",
    description: "Supporting seniors in Santa Cruz County",
    location: "Santa Cruz",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Ocean Cleanup",
    description: "Removing plastic from the world's oceans",
    location: "Santa Cruz",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Local Food Bank",
    description: "Fighting hunger in your local community",
    location: "Santa Cruz",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Education For All",
    description: "Supporting education in underserved areas",
    location: "Santa Cruz",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Animal Rescue League",
    description: "Saving and caring for abandoned animals",
    location: "Santa Cruz",
  },
];

// ============================================
// USER CHARITY GOALS
// ============================================

export interface UserCharityGoal {
  id: string;
  charityId: string;
  name: string;
  logo: string;
  goalAmount: number;
  currentAmount: number;
  priority: number;
  isCompleted: boolean;
}

// Active charity goals (would come from `user_charities` table)
export const mockActiveCharities: UserCharityGoal[] = [
  {
    id: "goal-1",
    charityId: "11111111-1111-1111-1111-111111111111",
    name: "Homeless Garden Project",
    logo: "",
    goalAmount: 5.00,
    currentAmount: 2.18,
    priority: 1,
    isCompleted: false,
  },
  {
    id: "goal-2",
    charityId: "22222222-2222-2222-2222-222222222222",
    name: "Gray Bears",
    logo: "",
    goalAmount: 5.00,
    currentAmount: 4.55,
    priority: 2,
    isCompleted: false,
  },
  {
    id: "goal-3",
    charityId: "33333333-3333-3333-3333-333333333333",
    name: "Ocean Cleanup",
    logo: "",
    goalAmount: 5.00,
    currentAmount: 1.07,
    priority: 3,
    isCompleted: false,
  },
];

// Completed charity goals
export const mockCompletedCharities: UserCharityGoal[] = [
  {
    id: "goal-completed-1",
    charityId: "44444444-4444-4444-4444-444444444444",
    name: "Local Food Bank",
    logo: "",
    goalAmount: 10.00,
    currentAmount: 10.00,
    priority: 1,
    isCompleted: true,
  },
  {
    id: "goal-completed-2",
    charityId: "55555555-5555-5555-5555-555555555555",
    name: "Education For All",
    logo: "",
    goalAmount: 5.00,
    currentAmount: 5.00,
    priority: 2,
    isCompleted: true,
  },
];

// Combined for easy access
export const mockAllCharityGoals: UserCharityGoal[] = [
  ...mockActiveCharities,
  ...mockCompletedCharities,
];

// ============================================
// TRANSACTIONS
// ============================================

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  roundup: number;
  date: string;
  category?: string;
}

// Recent transactions (would come from `transactions` table)
export const mockTransactions: Transaction[] = [
  { id: "tx-1", merchant: "Starbucks", amount: 5.75, roundup: 0.25, date: "2026-01-16" },
  { id: "tx-2", merchant: "Amazon", amount: 47.32, roundup: 0.68, date: "2026-01-15" },
  { id: "tx-3", merchant: "Whole Foods", amount: 89.17, roundup: 0.83, date: "2026-01-15" },
  { id: "tx-4", merchant: "Netflix", amount: 15.99, roundup: 0.01, date: "2026-01-14" },
  { id: "tx-5", merchant: "Uber", amount: 23.45, roundup: 0.55, date: "2026-01-14" },
];

// ============================================
// DONATIONS
// ============================================

export interface Donation {
  id: string;
  amount: number;
  charityId: string;
  charityName: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

// Donation history (would come from `donations` table)
export const mockDonations: Donation[] = [
  { id: "don-1", amount: 25.00, charityId: "44444444-4444-4444-4444-444444444444", charityName: "Local Food Bank", date: "2026-01-15", status: "completed" },
  { id: "don-2", amount: 18.50, charityId: "44444444-4444-4444-4444-444444444444", charityName: "Local Food Bank", date: "2026-01-08", status: "completed" },
  { id: "don-3", amount: 22.30, charityId: "44444444-4444-4444-4444-444444444444", charityName: "Local Food Bank", date: "2026-01-01", status: "completed" },
];

// ============================================
// COMPUTED VALUES
// ============================================

// Total donated across all charities
export const getTotalDonated = (): number => {
  const fromGoals = mockAllCharityGoals.reduce((sum, c) => sum + c.currentAmount, 0);
  return fromGoals;
};

// Total from completed donations
export const getTotalFromDonations = (): number => {
  return mockDonations
    .filter(d => d.status === "completed")
    .reduce((sum, d) => sum + d.amount, 0);
};

// Total roundups collected
export const getTotalRoundups = (): number => {
  return mockTransactions.reduce((sum, tx) => sum + tx.roundup, 0);
};

// Mock computed stats
export const mockStats = {
  totalDonated: getTotalDonated(), // $22.80 (sum of all charity goal progress)
  totalFromDonationHistory: getTotalFromDonations(), // $65.80 (from donation records)
  totalRoundups: getTotalRoundups(), // $2.32 (from transactions)
  activeCharitiesCount: mockActiveCharities.length,
  completedCharitiesCount: mockCompletedCharities.length,
};

// ============================================
// SUPABASE QUERY HELPERS (to be implemented)
// ============================================

/**
 * These functions will replace mock data with real Supabase queries.
 * 
 * Example implementation:
 * 
 * export async function getUserCharities(userId: string) {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('user_charities')
 *     .select(`
 *       *,
 *       charity:charities(name, description, location)
 *     `)
 *     .eq('user_id', userId)
 *     .order('priority', { ascending: true });
 *   
 *   if (error) throw error;
 *   return data;
 * }
 * 
 * export async function getUserTransactions(userId: string, limit?: number) {
 *   const supabase = await createClient();
 *   let query = supabase
 *     .from('transactions')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .order('created_at', { ascending: false });
 *   
 *   if (limit) query = query.limit(limit);
 *   
 *   const { data, error } = await query;
 *   if (error) throw error;
 *   return data;
 * }
 * 
 * export async function getUserDonations(userId: string) {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('donations')
 *     .select(`
 *       *,
 *       charity:charities(name)
 *     `)
 *     .eq('user_id', userId)
 *     .order('created_at', { ascending: false });
 *   
 *   if (error) throw error;
 *   return data;
 * }
 */
