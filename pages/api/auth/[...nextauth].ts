import { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import PasskeyProvider from "@teamhanko/passkeys-next-auth-provider";
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { dub } from "@/lib/dub";
import { isBlacklistedEmail } from "@/lib/edge-config/blacklist";
import { sendVerificationRequestEmail } from "@/lib/emails/send-verification-request";
import { sendWelcomeEmail } from "@/lib/emails/send-welcome";
import hanko from "@/lib/hanko";
import prisma from "@/lib/prisma";
import { CreateUserEmailProps, CustomUser } from "@/lib/types";
import { subscribe } from "@/lib/unsend";
import { log } from "@/lib/utils";
import { generateChecksum } from "@/lib/utils/generate-checksum";
import { getIpAddress } from "@/lib/utils/ip";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

function getMainDomainUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXTAUTH_URL || "http://localhost:3000";
  }
  return process.env.NEXTAUTH_URL || "https://app.papermark.com";
}

// This function can run for a maximum of 180 seconds
export const config = {
  maxDuration: 180,
};

export const authOptions: NextAuthOptions = {
  pages: {
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      authorization: {
        params: { scope: "openid profile email" },
      },
      issuer: "https://www.linkedin.com/oauth",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
      profile(profile, tokens) {
        const defaultImage =
          "https://cdn-icons-png.flaticon.com/512/174/174857.png";
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture ?? defaultImage,
        };
      },
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        const hasValidNextAuthUrl = !!process.env.NEXTAUTH_URL;
        let finalUrl = url;

        if (!hasValidNextAuthUrl) {
          const mainDomainUrl = getMainDomainUrl();
          const urlObj = new URL(url);
          const mainDomainObj = new URL(mainDomainUrl);
          urlObj.hostname = mainDomainObj.hostname;
          urlObj.protocol = mainDomainObj.protocol;
          urlObj.port = mainDomainObj.port || "";

          finalUrl = urlObj.toString();
        }

        if (process.env.NODE_ENV === "development") {
          const checksum = generateChecksum(finalUrl);
          const verificationUrlParams = new URLSearchParams({
            verification_url: finalUrl,
            checksum,
          });

          const baseUrl = hasValidNextAuthUrl
            ? process.env.NEXTAUTH_URL
            : getMainDomainUrl();

          const verificationUrl = `${baseUrl}/verify?${verificationUrlParams}`;
          console.log("[Login URL]", verificationUrl);
          return;
        } else {
          await sendVerificationRequestEmail({
            url: finalUrl,
            email: identifier,
          });
        }
      },
    }),
    PasskeyProvider({
      tenant: hanko,
      async authorize({ userId }) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return user;
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT ? ".papermark.com" : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async (params) => {
      const { token, user, trigger } = params;
      if (!token.email) {
        return {};
      }
      if (user) {
        token.user = user;
      }
      // refresh the user data
      if (trigger === "update") {
        const user = token?.user as CustomUser;
        const refreshedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (refreshedUser) {
          token.user = refreshedUser;
        } else {
          return {};
        }

        if (refreshedUser?.email !== user.email) {
          // if user has changed email, delete all accounts for the user
          if (user.id && refreshedUser.email) {
            await prisma.account.deleteMany({
              where: { userId: user.id },
            });
          }
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      (session.user as CustomUser) = {
        id: token.sub,
        // @ts-ignore
        ...(token || session).user,
      };
      return session;
    },
  },
  events: {
    async createUser(message) {
      const params: CreateUserEmailProps = {
        user: {
          name: message.user.name,
          email: message.user.email,
        },
      };

      await identifyUser(message.user.email ?? message.user.id);
      await trackAnalytics({
        event: "User Signed Up",
        email: message.user.email,
        userId: message.user.id,
      });

      await sendWelcomeEmail(params);

      if (message.user.email) {
        await subscribe(message.user.email);
      }
    },
  },
};

const getAuthOptions = (req: NextApiRequest): NextAuthOptions => {
  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      signIn: async ({ user }) => {
        if (!user.email || (await isBlacklistedEmail(user.email))) {
          await identifyUser(user.email ?? user.id);
          await trackAnalytics({
            event: "User Sign In Attempted",
            email: user.email ?? undefined,
            userId: user.id,
          });
          return false;
        }

        // Apply rate limiting for signin attempts
        try {
          if (req) {
            const clientIP = getIpAddress(req.headers);
            const rateLimitResult = await checkRateLimit(
              rateLimiters.auth,
              clientIP,
            );

            if (!rateLimitResult.success) {
              log({
                message: `Rate limit exceeded for IP ${clientIP} during signin attempt`,
                type: "error",
              });
              return false; // Block the signin
            }
          }
        } catch (error) {}

        return true;
      },
    },
    events: {
      ...authOptions.events,
      signIn: async (message) => {
        // Identify and track sign-in without blocking the event flow
        await Promise.allSettled([
          identifyUser(message.user.email ?? message.user.id),
          trackAnalytics({
            event: "User Signed In",
            email: message.user.email,
          }),
        ]);

        if (message.isNewUser) {
          const { dub_id } = req.cookies;
          // Only fire lead event if Dub is enabled
          if (dub_id && process.env.DUB_API_KEY) {
            try {
              await dub.track.lead({
                clickId: dub_id,
                eventName: "Sign Up",
                customerExternalId: message.user.id,
                customerName: message.user.name,
                customerEmail: message.user.email,
                customerAvatar: message.user.image ?? undefined,
              });
            } catch (err) {
              console.error("dub.track.lead failed", err);
            }
          }
        }
      },
    },
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return NextAuth(req, res, getAuthOptions(req));
}
