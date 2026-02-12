import { jackson } from "@/lib/jackson";
import type { OAuthReq } from "@boxyhq/saml-jackson";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { oauthController } = await jackson();

    const url = new URL(req.url);
    const requestParams = Object.fromEntries(
      url.searchParams.entries(),
    ) as unknown as OAuthReq;

    const { redirect_url, authorize_form } =
      await oauthController.authorize(requestParams);

    if (redirect_url) {
      return NextResponse.redirect(redirect_url, { status: 302 });
    } else if (authorize_form) {
      return new Response(authorize_form, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(
      { error: "No redirect URL returned" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[SAML] Authorize error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { oauthController } = await jackson();

    const contentType = req.headers.get("content-type") || "";

    let body: Record<string, any>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    const { redirect_url, authorize_form } =
      await oauthController.authorize(body as unknown as OAuthReq);

    if (redirect_url) {
      return NextResponse.redirect(redirect_url, { status: 302 });
    } else if (authorize_form) {
      return new Response(authorize_form, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(
      { error: "No redirect URL returned" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[SAML] Authorize error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
