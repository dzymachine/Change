/**
 * Shared application types
 */

// User profile (extends Supabase auth.users)
export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  onboardingCompleted: boolean;
  selectedCharityId: string | null;
  roundupEnabled: boolean;
  createdAt: string;
}

// Linked bank account (Plaid item)
export interface LinkedAccount {
  id: string;
  userId: string;
  plaidItemId: string;
  institutionName: string | null;
  institutionId: string | null;
  isActive: boolean;
  createdAt: string;
}

// Transaction from Plaid
export interface Transaction {
  id: string;
  userId: string;
  linkedAccountId: string;
  plaidTransactionId: string;
  amount: number;
  roundupAmount: number | null;
  merchantName: string | null;
  category: string[] | null;
  date: string;
  isDonation: boolean;
  isPending: boolean;
  processedForDonation: boolean;
  createdAt: string;
}

// Charity for donations
export interface Charity {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

// Donation batch
export interface Donation {
  id: string;
  userId: string;
  charityId: string;
  amount: number;
  transactionCount: number;
  status: DonationStatus;
  processedAt: string | null;
  createdAt: string;
}

export type DonationStatus = "pending" | "processing" | "completed" | "failed";

// Onboarding state
export interface OnboardingState {
  step: 1 | 2 | 3;
  bankLinked: boolean;
  charitySelected: boolean;
}

// Dashboard stats
export interface DashboardStats {
  totalDonated: number;
  transactionsCount: number;
  currentCharity: string | null;
  monthlyAverage: number;
  pendingRoundup: number;
}
