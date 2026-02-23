import type {
  IConnectionAPIController,
  IDirectorySyncController,
  IOAuthController,
  JacksonOption,
} from "@boxyhq/saml-jackson";
import samlJackson from "@boxyhq/saml-jackson";
import crypto from "crypto";

export const samlAudience = "https://saml.papermark.com";

export { JACKSON_PRODUCT as jacksonProduct } from "@/ee/features/security/sso/product";

// Jackson's AES-256-GCM encrypter requires exactly 32 bytes.
// Derive a stable 32-byte key from NEXTAUTH_SECRET using SHA-256.
const encryptionKey = crypto
  .createHash("sha256")
  .update(process.env.NEXTAUTH_SECRET || "")
  .digest("base64url")
  .substring(0, 32);

function sanitizePostgresUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);

    // Some providers emit ssl cert params with value "system", which can cause
    // node-postgres to attempt reading a local file literally named "system".
    for (const param of ["sslcert", "sslrootcert", "sslkey", "sslcrl"]) {
      const value = parsed.searchParams.get(param);
      if (value?.toLowerCase() === "system") {
        parsed.searchParams.delete(param);
      }
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, pass through so downstream errors remain visible.
    return rawUrl;
  }
}

function getJacksonDbUrl(): string {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_PRISMA_URL_NON_POOLING,
  ];

  const dbUrl = candidates.find((value) => typeof value === "string" && value.trim().length > 0);

  if (!dbUrl) {
    throw new Error(
      "Missing Jackson DB URL. Set POSTGRES_PRISMA_URL or POSTGRES_PRISMA_URL_NON_POOLING.",
    );
  }

  return sanitizePostgresUrl(dbUrl);
}

function getJacksonOptions(): JacksonOption {
  return {
    externalUrl: process.env.NEXTAUTH_URL || "https://app.papermark.com",
    samlPath: "/api/auth/saml/callback",
    samlAudience,
    db: {
      engine: "sql",
      type: "postgres",
      url: getJacksonDbUrl(),
      encryptionKey,
    },
    idpEnabled: true, // to allow to SSO from their IDP
    scimPath: "/api/scim/v2.0",
    clientSecretVerifier: process.env.NEXTAUTH_SECRET as string,
  };
}

declare global {
  var apiController: IConnectionAPIController | undefined;
  var oauthController: IOAuthController | undefined;
  var directorySyncController: IDirectorySyncController | undefined;
}

export async function jackson() {
  if (
    !globalThis.apiController ||
    !globalThis.oauthController ||
    !globalThis.directorySyncController
  ) {
    const ret = await samlJackson(getJacksonOptions());
    globalThis.apiController = ret.connectionAPIController;
    globalThis.oauthController = ret.oauthController;
    globalThis.directorySyncController = ret.directorySyncController;
  }

  return {
    apiController: globalThis.apiController,
    oauthController: globalThis.oauthController,
    directorySyncController: globalThis.directorySyncController,
  };
}
