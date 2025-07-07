import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { generateChecksum } from "@/lib/utils/generate-checksum";
import { GoogleDriveClient } from "@/lib/google-drive";
import { scope } from "@/components/integrations/google-drive/google-drive";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const redirectWithError = (error: string) => {
        res.writeHead(302, {
            Location: `/settings/integrations?error=${error}`,
        });
        res.end();
    };

    const redirectSuccess = () => {
        res.writeHead(302, {
            Location: `/settings/integrations?success=true`,
        });
        res.end();
    };

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) return redirectWithError("unauthenticated");

        const { code, state } = req.query;
        if (!code || !state) return redirectWithError("no_code_or_state");

        const [stateBase, checksum] = (state as string).split("::");
        if (!stateBase || !checksum) return redirectWithError("invalid_state");

        const expectedChecksum = generateChecksum(stateBase);
        if (checksum !== expectedChecksum) return redirectWithError("invalid_checksum");

        const [email] = stateBase.split(":");
        const user = session.user as CustomUser;

        if (email !== user.email) return redirectWithError("email_mismatch");

        // Exchange authorization code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: code as string,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/google-drive/callback`,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) return redirectWithError("token_exchange_failed");

        const tokens = await tokenResponse.json();

        const grantedScopes = (tokens.scope || "").split(" ");
        const missingScopes = scope.filter(scope => !grantedScopes.includes(scope));

        if (missingScopes.length > 0) {
            console.error("Missing required scopes:", missingScopes);
            await GoogleDriveClient.getInstance().revokeToken(tokens.refresh_token);
            return redirectWithError("insufficient_permissions");
        }

        const [userInfoResponse] = await Promise.all([
            fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            })
        ]);

        if (!userInfoResponse.ok) {
            return redirectWithError("info_fetch_failed");
        }

        const userInfo = await userInfoResponse.json();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);
        const refreshTokenExpiresAt = tokens.refresh_token_expires_in ? new Date(now.getTime() + tokens.refresh_token_expires_in * 1000) : new Date("9999-12-31"); // effectively “no expiry”

        await prisma.googleDriveIntegration.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt,
                refreshTokenExpiresAt,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt,
                refreshTokenExpiresAt,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
            },
        });

        return redirectSuccess();
    } catch (error) {
        console.error("Google Drive callback error:", error);
        return redirectWithError("server_error");
    }
}