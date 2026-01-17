// Plaid client configuration
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] 
    || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Environment info
export const PLAID_ENV = process.env.PLAID_ENV || "sandbox";
export const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;

// Check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return !!(
    process.env.PLAID_CLIENT_ID && 
    process.env.PLAID_SECRET
  );
}
