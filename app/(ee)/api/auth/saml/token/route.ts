import { jackson } from "@/lib/jackson";
// These imports fix crypto module bundling issues with Jackson in Next.js.
// Without them, the serverless function bundle tree-shakes away jose's crypto
// primitives, causing ERR_CRYPTO_INVALID_KEYLEN at runtime.
// See: https://github.com/ory/polis/blob/main/pages/api/import-hack.ts
import * as jose from "jose";
import { NextResponse } from "next/server";
import * as openidClient from "openid-client";

// Reference the imports so they aren't removed by tree-shaking
const _dependencies = [jose, openidClient];
void _dependencies;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { oauthController } = await jackson();

    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    const token = await oauthController.token(body as any);

    return NextResponse.json(token);
  } catch (error: any) {
    console.error("[SAML] Token error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
