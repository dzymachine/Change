/**
 * Round-up calculation logic
 * 
 * Core formula: round up to nearest dollar and calculate the difference
 * Example: $25.40 → $26.00 → round-up = $0.60
 */

/**
 * Calculate the round-up amount for a transaction
 * @param amount - The transaction amount (positive number)
 * @returns The round-up amount (always between $0.01 and $1.00)
 */
export function calculateRoundup(amount: number): number {
  // Ensure we're working with a positive amount
  const absoluteAmount = Math.abs(amount);
  
  // Round up to the nearest dollar
  const roundedUp = Math.ceil(absoluteAmount);
  
  // Calculate the difference
  const roundup = roundedUp - absoluteAmount;
  
  // If the transaction was exactly a whole dollar, round up to next dollar
  // i.e., $25.00 → round-up of $1.00, not $0.00
  if (roundup === 0) {
    return 1.00;
  }
  
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(roundup * 100) / 100;
}

/**
 * Calculate total round-up from an array of transactions
 * @param amounts - Array of transaction amounts
 * @returns Total round-up amount
 */
export function calculateTotalRoundup(amounts: number[]): number {
  const total = amounts.reduce((sum, amount) => {
    return sum + calculateRoundup(amount);
  }, 0);
  
  return Math.round(total * 100) / 100;
}

/**
 * Format a donation amount for display
 * @param amount - The amount to format
 * @returns Formatted string like "$25.40"
 */
export function formatDonationAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Check if a round-up amount meets minimum threshold
 * We may want to batch small round-ups to reduce transaction fees
 */
export const MINIMUM_DONATION_THRESHOLD = 5.00; // $5 minimum batch

export function meetsMinimumThreshold(totalRoundup: number): boolean {
  return totalRoundup >= MINIMUM_DONATION_THRESHOLD;
}
