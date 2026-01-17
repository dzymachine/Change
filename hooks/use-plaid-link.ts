"use client";

/**
 * Hook for Plaid Link integration
 */

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink as useReactPlaidLink } from "react-plaid-link";

interface UsePlaidLinkOptions {
  onSuccess?: (publicToken: string, metadata: PlaidLinkMetadata) => void;
  onExit?: () => void;
}

interface PlaidLinkMetadata {
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
}

export function usePlaidLink(options: UsePlaidLinkOptions = {}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a link token from our API
   */
  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create link token");
      }

      const data = await response.json();
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the react-plaid-link hook
  const { open, ready } = useReactPlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      if (options.onSuccess) {
        options.onSuccess(publicToken, metadata as unknown as PlaidLinkMetadata);
      }
    },
    onExit: () => {
      if (options.onExit) {
        options.onExit();
      }
    },
  });

  // Auto-fetch link token on mount
  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  return {
    open,
    ready: ready && !!linkToken,
    loading,
    error,
    fetchLinkToken,
  };
}

// Re-export for convenience
export type { PlaidLinkMetadata };
