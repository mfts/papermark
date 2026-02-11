import { jackson, jacksonProduct, samlAudience } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/pages/api/auth/[...nextauth]";

const SSO_ELIGIBLE_PLANS = ["datarooms-premium", "datarooms-premium+old"];

async function getAuthenticatedAdmin(teamId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = (session.user as CustomUser).id;

  const teamAccess = await prisma.userTeam.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });

  if (!teamAccess || teamAccess.role !== "ADMIN") return null;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, plan: true, ssoEnabled: true, ssoEmailDomain: true, ssoEnforcedAt: true, slug: true },
  });

  if (!team) return null;

  return { userId, team, email: (session.user as CustomUser).email! };
}

// GET /api/teams/:teamId/saml — list SAML connections + issuer/acs info
export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const auth = await getAuthenticatedAdmin(teamId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apiController } = await jackson();

    const connections = await apiController.getConnections({
      tenant: teamId,
      product: jacksonProduct,
    });

    return NextResponse.json({
      connections,
      issuer: samlAudience,
      acs: `${process.env.NEXTAUTH_URL}/api/auth/saml/callback`,
      ssoEmailDomain: auth.team.ssoEmailDomain,
      ssoEnforcedAt: auth.team.ssoEnforcedAt,
      slug: auth.team.slug,
    });
  } catch (error: any) {
    console.error("[SAML] Get connections error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/teams/:teamId/saml — create a new SAML connection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const auth = await getAuthenticatedAdmin(teamId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan gate
  if (!SSO_ELIGIBLE_PLANS.includes(auth.team.plan)) {
    return NextResponse.json(
      { error: "SSO requires a Datarooms Premium plan" },
      { status: 403 },
    );
  }

  // Feature flag gate
  if (!auth.team.ssoEnabled) {
    return NextResponse.json(
      { error: "SSO is not enabled for this team" },
      { status: 403 },
    );
  }

  try {
    const { apiController } = await jackson();
    const body = await req.json();
    const { rawMetadata, encodedRawMetadata, metadataUrl } = body;

    if (!rawMetadata && !metadataUrl && !encodedRawMetadata) {
      return NextResponse.json(
        {
          error:
            "Either rawMetadata, encodedRawMetadata, or metadataUrl is required",
        },
        { status: 400 },
      );
    }

    // Extract email domain from the admin's email for SSO domain binding
    const ssoEmailDomain = auth.email.split("@")[1]?.toLowerCase();

    const connection = await apiController.createSAMLConnection({
      defaultRedirectUrl: `${process.env.NEXTAUTH_URL}/auth/saml`,
      redirectUrl: process.env.NEXTAUTH_URL as string,
      tenant: teamId,
      product: jacksonProduct,
      rawMetadata: rawMetadata || undefined,
      encodedRawMetadata: encodedRawMetadata || undefined,
      metadataUrl: metadataUrl || undefined,
    });

    // Store the email domain for SSO enforcement
    await prisma.team.update({
      where: { id: teamId },
      data: {
        ssoEmailDomain: ssoEmailDomain || undefined,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    console.error("[SAML] Create connection error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/teams/:teamId/saml — update SSO enforcement settings
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const auth = await getAuthenticatedAdmin(teamId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enforced } = body;

    if (typeof enforced !== "boolean") {
      return NextResponse.json(
        { error: "'enforced' must be a boolean" },
        { status: 400 },
      );
    }

    // Can only enforce if there's an ssoEmailDomain set (which is set when SAML is configured)
    if (enforced && !auth.team.ssoEmailDomain) {
      return NextResponse.json(
        {
          error:
            "Cannot enforce SSO without a configured email domain. Please configure SAML first.",
        },
        { status: 400 },
      );
    }

    // Verify there are active SAML connections before enforcing
    if (enforced) {
      const { apiController } = await jackson();
      const connections = await apiController.getConnections({
        tenant: teamId,
        product: jacksonProduct,
      });

      if (!connections || connections.length === 0) {
        return NextResponse.json(
          {
            error:
              "Cannot enforce SSO without an active SAML connection. Please configure SAML first.",
          },
          { status: 400 },
        );
      }
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        ssoEnforcedAt: enforced ? new Date() : null,
      },
    });

    return NextResponse.json({
      enforced,
      ssoEnforcedAt: enforced ? new Date().toISOString() : null,
    });
  } catch (error: any) {
    console.error("[SAML] Update enforcement error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/:teamId/saml — remove a SAML connection
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const auth = await getAuthenticatedAdmin(teamId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apiController } = await jackson();
    const body = await req.json();
    const { clientID, clientSecret } = body;

    if (!clientID || !clientSecret) {
      return NextResponse.json(
        { error: "clientID and clientSecret are required" },
        { status: 400 },
      );
    }

    await apiController.deleteConnections({ clientID, clientSecret });

    // Check if there are remaining connections
    const remaining = await apiController.getConnections({
      tenant: teamId,
      product: jacksonProduct,
    });

    if (!remaining || (Array.isArray(remaining) && remaining.length === 0)) {
      // No more connections — clear SSO domain and enforcement
      await prisma.team.update({
        where: { id: teamId },
        data: {
          ssoEmailDomain: null,
          ssoEnforcedAt: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[SAML] Delete connection error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
