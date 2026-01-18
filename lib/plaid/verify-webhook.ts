/**
 * Plaid Webhook Verification
 * 
 * Verifies incoming Plaid webhooks using JWT signature verification.
 * This ensures webhooks are authentic and haven't been tampered with.
 * 
 * Based on Plaid's official documentation:
 * https://plaid.com/docs/api/webhooks/webhook-verification/
 */

import { createHash } from "crypto";
import * as jose from "jose";
import { plaidClient } from "./client";
import { logJson } from "@/lib/log-json";

// Cache for Plaid's webhook verification key
// Key ID -> { key, fetchedAt }
const keyCache = new Map<string, { key: jose.CryptoKey; fetchedAt: number }>();
const KEY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface VerificationResult {
  verified: boolean;
  error?: string;
  skipped?: boolean;
}

/**
 * Verify a Plaid webhook request
 * 
 * @param rawBody - The raw request body as a string (NOT parsed JSON)
 * @param plaidVerificationHeader - The Plaid-Verification header value (JWT)
 * @returns Verification result
 */
export async function verifyPlaidWebhook(
  rawBody: string,
  plaidVerificationHeader: string | null
): Promise<VerificationResult> {
  // In sandbox/development, verification header may not be present
  // Allow skipping verification for testing, but log a warning
  if (!plaidVerificationHeader) {
    const env = process.env.PLAID_ENV || "sandbox";
    if (env === "sandbox") {
      logJson("warn", "plaid.webhook.verification_skipped", {
        reason: "no_verification_header",
        plaid_env: env,
        note: "Plaid-Verification header not present, skipping verification in sandbox",
      });
      return { verified: true, skipped: true };
    }
    return { verified: false, error: "Missing Plaid-Verification header" };
  }

  try {
    // 1. Decode the JWT header to get the key ID (kid)
    const decodedHeader = jose.decodeProtectedHeader(plaidVerificationHeader);
    const keyId = decodedHeader.kid;
    
    if (!keyId) {
      return { verified: false, error: "JWT missing key ID (kid)" };
    }

    // 2. Get the verification key from Plaid (with caching)
    const verificationKey = await getVerificationKey(keyId);
    if (!verificationKey) {
      return { verified: false, error: `Failed to fetch verification key for kid: ${keyId}` };
    }

    // 3. Verify the JWT signature
    const { payload } = await jose.jwtVerify(plaidVerificationHeader, verificationKey, {
      algorithms: ["ES256"],
      // Plaid's JWTs have a 5-minute validity window
      // Allow some clock skew
      clockTolerance: 60, // 60 seconds tolerance
    });

    // 4. Verify the request body hash matches
    const expectedBodyHash = payload.request_body_sha256 as string;
    if (!expectedBodyHash) {
      return { verified: false, error: "JWT payload missing request_body_sha256" };
    }

    const actualBodyHash = createHash("sha256").update(rawBody).digest("hex");
    
    if (actualBodyHash !== expectedBodyHash) {
      logJson("error", "plaid.webhook.body_hash_mismatch", {
        expected: expectedBodyHash.substring(0, 16) + "...",
        actual: actualBodyHash.substring(0, 16) + "...",
      });
      return { verified: false, error: "Request body hash mismatch" };
    }

    logJson("info", "plaid.webhook.verified", {
      key_id: keyId,
    });

    return { verified: true };
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jose.errors.JWTExpired) {
      return { verified: false, error: "JWT has expired" };
    }
    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      return { verified: false, error: "JWT signature verification failed" };
    }
    if (error instanceof jose.errors.JWSInvalid) {
      return { verified: false, error: "Invalid JWT format" };
    }

    logJson("error", "plaid.webhook.verification_error", { error });
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : "Unknown verification error" 
    };
  }
}

/**
 * Get a verification key from Plaid's API
 * Uses caching to avoid hitting the API for every webhook
 */
async function getVerificationKey(keyId: string): Promise<jose.CryptoKey | null> {
  // Check cache first
  const cached = keyCache.get(keyId);
  if (cached && Date.now() - cached.fetchedAt < KEY_CACHE_TTL) {
    return cached.key;
  }

  try {
    // Fetch the verification key from Plaid
    const response = await plaidClient.webhookVerificationKeyGet({
      key_id: keyId,
    });

    const jwk = response.data.key;
    
    // Convert JWK to CryptoKey
    const importedKey = await jose.importJWK(jwk, "ES256");
    
    // importJWK returns CryptoKey | Uint8Array, but for ES256 it's always CryptoKey
    if (importedKey instanceof Uint8Array) {
      logJson("error", "plaid.webhook.unexpected_key_type", { key_id: keyId });
      return null;
    }
    
    // Cache the key
    keyCache.set(keyId, { key: importedKey, fetchedAt: Date.now() });
    
    return importedKey;
  } catch (error) {
    logJson("error", "plaid.webhook.key_fetch_failed", { 
      key_id: keyId, 
      error 
    });
    return null;
  }
}

/**
 * Clear the key cache (useful for testing or key rotation)
 */
export function clearKeyCache(): void {
  keyCache.clear();
}
