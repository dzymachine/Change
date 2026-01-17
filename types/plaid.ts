/**
 * Plaid-specific types
 * 
 * These supplement the types from the plaid package
 */

// Link token creation response
export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

// Public token exchange metadata
export interface PlaidLinkMetadata {
  institution: {
    name: string;
    institution_id: string;
  };
  accounts: Array<{
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  }>;
  link_session_id: string;
}

// Plaid Link success callback data
export interface PlaidLinkOnSuccessData {
  public_token: string;
  metadata: PlaidLinkMetadata;
}

// Plaid Link exit callback data
export interface PlaidLinkOnExitData {
  error: {
    error_type: string;
    error_code: string;
    error_message: string;
    display_message: string;
  } | null;
  metadata: {
    status: string;
    institution: {
      name: string;
      institution_id: string;
    } | null;
    link_session_id: string;
  };
}

// Webhook types
export type PlaidWebhookType =
  | "TRANSACTIONS"
  | "ITEM"
  | "AUTH"
  | "ASSETS"
  | "HOLDINGS"
  | "INVESTMENTS_TRANSACTIONS"
  | "LIABILITIES";

export type TransactionWebhookCode =
  | "INITIAL_UPDATE"
  | "HISTORICAL_UPDATE"
  | "DEFAULT_UPDATE"
  | "TRANSACTIONS_REMOVED"
  | "SYNC_UPDATES_AVAILABLE";

export type ItemWebhookCode =
  | "ERROR"
  | "PENDING_EXPIRATION"
  | "USER_PERMISSION_REVOKED";
