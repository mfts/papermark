import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "database";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const goolgeClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleEnabled = !!googleClientId && !!goolgeClientSecret;

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(isGoogleEnabled
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: goolgeClientSecret,
          }),
        ]
      : []),
  ],
};
