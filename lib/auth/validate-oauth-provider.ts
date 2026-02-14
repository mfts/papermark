import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v3/userinfo";

/** How often (in ms) to revalidate the OAuth provider account. */
export const PROVIDER_REVALIDATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that a user's OAuth provider account is still active and authorized.
 *
 * Checks:
 * 1. The account link still exists in the database (not unlinked).
 * 2. The provider still recognizes the account (token refresh / userinfo call).
 *
 * Returns `{ valid: true }` on success.
 * Returns `{ valid: false, reason }` when the session should be revoked.
 *
 * Network / transient errors are treated as "valid" to avoid locking users out
 * due to temporary infrastructure issues.
 */
export async function validateOAuthProviderAccount(
  userId: string,
  provider: string,
): Promise<ValidationResult> {
  // 1. Ensure the account link exists in our database
  const account = await prisma.account.findFirst({
    where: { userId, provider },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account) {
    return { valid: false, reason: "account_unlinked" };
  }

  // 2. Provider-specific validation
  switch (provider) {
    case "google":
      return validateGoogleAccount(account);
    default:
      // Providers without specific validation are considered valid
      // as long as the account link exists
      return { valid: true };
  }
}

// ─── Google ──────────────────────────────────────────────────────────────────

async function validateGoogleAccount(account: {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}): Promise<ValidationResult> {
  try {
    // If we have no tokens at all, we can't validate — treat as valid
    // (the account link exists, which already proves historical auth)
    if (!account.access_token && !account.refresh_token) {
      return { valid: true };
    }

    // Determine whether the stored access token has expired
    const isExpired = account.expires_at
      ? account.expires_at * 1000 < Date.now()
      : true;

    let accessToken = account.access_token;

    // ─── Step A: If expired, refresh the token first ───
    if (isExpired && account.refresh_token) {
      const refreshResult = await refreshGoogleToken(account.refresh_token);

      if (!refreshResult.success) {
        // A definitive "invalid_grant" or "unauthorized" from Google means
        // the refresh token has been revoked / account deleted.
        return { valid: false, reason: "token_refresh_failed" };
      }

      accessToken = refreshResult.accessToken!;

      // Persist the refreshed token so future checks use it directly
      await persistRefreshedToken(account.id, refreshResult).catch((err) => {
        console.error(
          "[OAuth Validation] Failed to persist refreshed token:",
          err,
        );
      });
    }

    // ─── Step B: Call Google userinfo to confirm the account exists ───
    if (accessToken) {
      const userInfoResult = await checkGoogleUserInfo(accessToken);

      if (userInfoResult === "valid") {
        return { valid: true };
      }

      if (userInfoResult === "invalid") {
        // Access token was rejected — try one last refresh
        if (account.refresh_token) {
          const refreshResult = await refreshGoogleToken(
            account.refresh_token,
          );
          if (!refreshResult.success) {
            return { valid: false, reason: "account_invalid" };
          }

          // Persist the refreshed token
          await persistRefreshedToken(account.id, refreshResult).catch(
            () => {},
          );

          const retryResult = await checkGoogleUserInfo(
            refreshResult.accessToken!,
          );
          if (retryResult === "valid") {
            return { valid: true };
          }
          return { valid: false, reason: "account_invalid" };
        }

        return { valid: false, reason: "account_invalid" };
      }

      // "error" (transient) — don't invalidate
      return { valid: true };
    }

    return { valid: true };
  } catch (error) {
    // Any unexpected error is treated as transient — never lock users out
    console.error("[OAuth Validation] Unexpected error:", error);
    return { valid: true };
  }
}

/**
 * Calls Google's userinfo endpoint to check if the account is active.
 *
 * Returns:
 *  - "valid"   – 200 OK, account exists
 *  - "invalid" – 401 Unauthorized, account deleted / token revoked
 *  - "error"   – transient / unknown error (5xx, network, etc.)
 */
async function checkGoogleUserInfo(
  accessToken: string,
): Promise<"valid" | "invalid" | "error"> {
  try {
    const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (response.ok) return "valid";
    if (response.status === 401 || response.status === 403) return "invalid";
    return "error"; // 429, 5xx, etc.
  } catch {
    return "error";
  }
}

/**
 * Attempts to refresh a Google access token using the stored refresh token.
 *
 * Google returns HTTP 400 with `{"error": "invalid_grant"}` when the refresh
 * token has been revoked (account deleted, user revoked access, etc.).
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  expiresAt?: number;
}> {
  try {
    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      log({
        message: `[OAuth Validation] Google token refresh failed: ${response.status} ${body}`,
        type: "error",
      });
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : undefined,
    };
  } catch (error) {
    console.error("[OAuth Validation] Network error refreshing token:", error);
    // Network errors → treat as "cannot determine" → caller decides
    return { success: false };
  }
}

/**
 * Persists a refreshed access token and expiry back to the Account record
 * so subsequent validations can use it without re-refreshing.
 */
async function persistRefreshedToken(
  accountId: string,
  result: { accessToken?: string; expiresAt?: number },
) {
  const data: Record<string, unknown> = {};
  if (result.accessToken) data.access_token = result.accessToken;
  if (result.expiresAt) data.expires_at = result.expiresAt;

  if (Object.keys(data).length > 0) {
    await prisma.account.update({
      where: { id: accountId },
      data,
    });
  }
}
