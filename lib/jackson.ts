import type {
  IConnectionAPIController,
  IDirectorySyncController,
  IOAuthController,
  JacksonOption,
} from "@boxyhq/saml-jackson";
import samlJackson from "@boxyhq/saml-jackson";

export const samlAudience =
  process.env.SAML_AUDIENCE || "https://saml.papermark.com";

const opts: JacksonOption = {
  externalUrl: process.env.NEXTAUTH_URL || "https://app.papermark.com",
  samlPath: "/api/auth/saml/callback",
  samlAudience,
  db: {
    engine: "sql",
    type: "postgres",
    url:
      process.env.POSTGRES_PRISMA_URL_NON_POOLING ||
      (process.env.POSTGRES_PRISMA_URL as string),
  },
  idpEnabled: true, // to allow folks to SSO directly from their IDP
  scimPath: "/api/scim/v2.0",
  clientSecretVerifier: process.env.NEXTAUTH_SECRET as string,
};

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
    const ret = await samlJackson(opts);
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
