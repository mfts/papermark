import { jackson, jacksonProduct } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/saml/verify
 * Verifies that a team has SSO configured.
 * Accepts either `slug` (preferred, user-friendly) or `teamId` (fallback).
 * Returns only the teamId — no team names, provider info, or other metadata.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, teamId } = body;

    if (!slug && !teamId) {
      return NextResponse.json(
        { error: "Team slug or ID is required" },
        { status: 400 },
      );
    }

    // Look up team by slug first, then by ID
    const team = slug
      ? await prisma.team.findUnique({
          where: { slug },
          select: { id: true, ssoEnabled: true },
        })
      : await prisma.team.findUnique({
          where: { id: teamId },
          select: { id: true, ssoEnabled: true },
        });

    const ssoUnavailable = NextResponse.json(
      { error: "SSO is not available for this team." },
      { status: 404 },
    );

    if (!team || !team.ssoEnabled) {
      return ssoUnavailable;
    }

    // Check Jackson for actual SAML connections
    const { apiController } = await jackson();

    const connections = await apiController.getConnections({
      tenant: team.id,
      product: jacksonProduct,
    });

    if (!connections || connections.length === 0) {
      return ssoUnavailable;
    }

    // Only return the team ID — no names, providers, or other metadata
    return NextResponse.json({ data: { teamId: team.id } });
  } catch (error: any) {
    console.error("[SAML] Verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
