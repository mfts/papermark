import { jackson } from "@/lib/jackson";
// Force-include crypto dependencies (same workaround as token route)
import * as jose from "jose";
import { NextResponse } from "next/server";
import * as openidClient from "openid-client";

const _dependencies = [jose, openidClient];
void _dependencies;

// Prevent Next.js from statically generating this route at build time —
// it requires a live database connection via Jackson.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { oauthController } = await jackson();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RFC 6750: token type is case-insensitive
    const token = authHeader.replace(/^bearer\s+/i, "");
    const userInfo = await oauthController.userInfo(token);

    return NextResponse.json(userInfo);
  } catch (error: any) {
    console.error("[SAML] UserInfo error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
