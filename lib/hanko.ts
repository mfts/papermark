import { tenant } from "@teamhanko/passkeys-next-auth-provider";

if (!process.env.HANKO_API_KEY || !process.env.NEXT_PUBLIC_HANKO_TENANT_ID) {
  // These need to be set in .env.local
  // You get them from the Passkey API itself, e.g. when first setting up the server.
  throw new Error(
    "Please set HANKO_API_KEY and NEXT_PUBLIC_HANKO_TENANT_ID in your .env.local file.",
  );
}

const hanko = tenant({
  apiKey: process.env.HANKO_API_KEY!,
  tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID!,
});

export default hanko;
