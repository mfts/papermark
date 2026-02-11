import { jackson } from "@/lib/jackson";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { oauthController } = await jackson();

    const url = new URL(req.url);
    const requestParams = Object.fromEntries(url.searchParams.entries());

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

    const body = await req.json();

    const { redirect_url, authorize_form } =
      await oauthController.authorize(body);

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
