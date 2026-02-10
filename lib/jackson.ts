import jackson, {
  type IConnectionAPIController,
  type IDirectorySyncController,
  type IOAuthController,
  type JacksonOption,
} from "@boxyhq/saml-jackson";

const g = global as any;

export default async function init(): Promise<{
  oauthController: IOAuthController;
  connectionController: IConnectionAPIController;
  directorySyncController: IDirectorySyncController;
}> {
  // Singleton — reuse across hot reloads in dev
  if (
    g.oauthController &&
    g.connectionController &&
    g.directorySyncController
  ) {
    return {
      oauthController: g.oauthController,
      connectionController: g.connectionController,
      directorySyncController: g.directorySyncController,
    };
  }

  const opts: JacksonOption = {
    externalUrl: process.env.JACKSON_EXTERNAL_URL || process.env.NEXTAUTH_URL!,
    samlAudience: process.env.SAML_AUDIENCE || process.env.JACKSON_EXTERNAL_URL!,
    samlPath: process.env.SAML_PATH || "/api/auth/saml/callback",
    db: {
      engine: "sql",
      type: "postgres",
      url: process.env.POSTGRES_PRISMA_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL!,
      encryptionKey: process.env.JACKSON_ENCRYPTION_KEY!,
    },
    idpEnabled: true,
    scimPath: "/api/scim/v2.0",
    openid: {},
  };

  const {
    oauthController,
    connectionAPIController: connectionController,
    directorySyncController,
  } = await jackson(opts);

  g.oauthController = oauthController;
  g.connectionController = connectionController;
  g.directorySyncController = directorySyncController;

  return {
    oauthController,
    connectionController,
    directorySyncController,
  };
}
