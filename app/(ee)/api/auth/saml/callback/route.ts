import { jackson } from "@/lib/jackson";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { oauthController } = await jackson();

    const formData = await req.formData();
    const RelayState = (formData.get("RelayState") as string) || "";
    const SAMLResponse = (formData.get("SAMLResponse") as string) || "";

    const { redirect_url } = await oauthController.samlResponse({
      RelayState,
      SAMLResponse,
    });

    if (!redirect_url) {
      return NextResponse.json(
        { error: "No redirect URL returned" },
        { status: 400 },
      );
    }

    return NextResponse.redirect(redirect_url, { status: 302 });
  } catch (error: any) {
    console.error("[SAML] Callback error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
