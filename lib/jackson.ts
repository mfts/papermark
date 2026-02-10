import samlJackson, {
  type IConnectionAPIController,
  type IDirectorySyncController,
  type IOAuthController,
  type JacksonOption,
} from "@boxyhq/saml-jackson";

const DEFAULT_SAML_PATH = "/api/auth/saml/callback";
const DEFAULT_SCIM_PATH = "/api/scim/v2.0";
const DEFAULT_JACKSON_SCHEMA = "jackson";

const requireEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getBaseUrl = (): string =>
  process.env.JACKSON_EXTERNAL_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

const withJacksonSchema = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);

    if (!parsed.searchParams.get("schema")) {
      parsed.searchParams.set("schema", DEFAULT_JACKSON_SCHEMA);
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

const getJacksonDatabaseUrl = (): string => {
  const explicitUrl = process.env.JACKSON_DATABASE_URL;
  if (explicitUrl) return explicitUrl;

  const fallbackUrl =
    process.env.POSTGRES_PRISMA_URL_NON_POOLING ?? process.env.POSTGRES_PRISMA_URL;

  if (!fallbackUrl) {
    throw new Error(
      "Missing JACKSON_DATABASE_URL or POSTGRES_PRISMA_URL(_NON_POOLING).",
    );
  }

  return withJacksonSchema(fallbackUrl);
};

export const getJacksonProduct = (): string =>
  process.env.JACKSON_PRODUCT ??
  process.env.NEXT_PUBLIC_JACKSON_PRODUCT ??
  "papermark";

export const getSamlAudience = (): string =>
  process.env.SAML_AUDIENCE ?? getBaseUrl();

declare global {
  var jacksonOauthController: IOAuthController | undefined;
  var jacksonConnectionController: IConnectionAPIController | undefined;
  var jacksonDirectorySyncController: IDirectorySyncController | undefined;
}

export default async function initJackson(): Promise<{
  oauthController: IOAuthController;
  connectionController: IConnectionAPIController;
  directorySyncController: IDirectorySyncController;
}> {
  if (
    globalThis.jacksonOauthController &&
    globalThis.jacksonConnectionController &&
    globalThis.jacksonDirectorySyncController
  ) {
    return {
      oauthController: globalThis.jacksonOauthController,
      connectionController: globalThis.jacksonConnectionController,
      directorySyncController: globalThis.jacksonDirectorySyncController,
    };
  }

  const opts: JacksonOption = {
    externalUrl: getBaseUrl(),
    samlAudience: getSamlAudience(),
    samlPath: process.env.SAML_PATH ?? DEFAULT_SAML_PATH,
    db: {
      engine: "sql",
      type: "postgres",
      url: getJacksonDatabaseUrl(),
      encryptionKey: requireEnv("JACKSON_ENCRYPTION_KEY"),
    },
    idpEnabled: true,
    scimPath: process.env.SCIM_PATH ?? DEFAULT_SCIM_PATH,
    clientSecretVerifier: process.env.NEXTAUTH_SECRET,
    openid: {},
  };

  const {
    oauthController,
    connectionAPIController: connectionController,
    directorySyncController,
  } = await samlJackson(opts);

  globalThis.jacksonOauthController = oauthController;
  globalThis.jacksonConnectionController = connectionController;
  globalThis.jacksonDirectorySyncController = directorySyncController;

  return {
    oauthController,
    connectionController,
    directorySyncController,
  };
}
