// Plaid client configuration
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let plaidClientInstance: PlaidApi | null = null;

function getPlaidClient(): PlaidApi {
  if (!plaidClientInstance) {
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
    plaidClientInstance = new PlaidApi(configuration);
  }
  return plaidClientInstance;
}

// Lazy-initialized Plaid client
export const plaidClient = new Proxy({} as PlaidApi, {
  get(_target, prop) {
    return Reflect.get(getPlaidClient(), prop);
  },
});

// Environment info - use getters for lazy evaluation
export const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

export function getPlaidClientId(): string | undefined {
  return process.env.PLAID_CLIENT_ID;
}

// Check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return !!(
    process.env.PLAID_CLIENT_ID && 
    process.env.PLAID_SECRET
  );
}
