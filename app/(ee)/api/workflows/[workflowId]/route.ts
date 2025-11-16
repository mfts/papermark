import { NextRequest, NextResponse } from "next/server";

import {
  UpdateWorkflowRequestSchema,
  formatZodError,
} from "@/ee/features/workflows/lib/validation";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// GET /app/(ee)/api/workflows/[workflowId] - Get single workflow with details
export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = params;

    // Validate workflowId format
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    if (!workflowIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid workflowId format" },
        { status: 400 },
      );
    }

    // Fetch workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        entryLink: {
          select: {
            id: true,
            slug: true,
            domainSlug: true,
          },
        },
        steps: {
          orderBy: { stepOrder: "asc" },
        },
        team: {
          select: {
            id: true,
            users: { select: { userId: true } },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Check user is part of the team
    const isUserPartOfTeam = workflow.team.users.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );

    if (!isUserPartOfTeam) {
      return NextResponse.json(
        { error: "Unauthorized to access this workflow" },
        { status: 403 },
      );
    }

    // Build entry URL
    const entryUrl =
      workflow.entryLink.domainSlug && workflow.entryLink.slug
        ? `https://${workflow.entryLink.domainSlug}/${workflow.entryLink.slug}`
        : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${workflow.entryLink.id}`;

    // Remove team data from response
    const { team, ...workflowData } = workflow;

    return NextResponse.json({
      ...workflowData,
      entryUrl,
    });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /app/(ee)/api/workflows/[workflowId] - Update workflow
export async function PATCH(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = params;
    const body = await req.json();

    // Validate workflowId format
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    if (!workflowIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid workflowId format" },
        { status: 400 },
      );
    }

    // Validate request body
    const validation = UpdateWorkflowRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: formatZodError(validation.error),
        },
        { status: 400 },
      );
    }

    // Fetch workflow to check ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        teamId: true,
        team: {
          select: {
            users: { select: { userId: true } },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Check user is part of the team
    const isUserPartOfTeam = workflow.team.users.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );

    if (!isUserPartOfTeam) {
      return NextResponse.json(
        { error: "Unauthorized to modify this workflow" },
        { status: 403 },
      );
    }

    // Update workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: validation.data,
      include: {
        entryLink: {
          select: {
            id: true,
            slug: true,
            domainSlug: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /app/(ee)/api/workflows/[workflowId] - Delete workflow
export async function DELETE(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = params;

    // Validate workflowId format
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    if (!workflowIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid workflowId format" },
        { status: 400 },
      );
    }

    // Fetch workflow to check ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        entryLinkId: true,
        teamId: true,
        team: {
          select: {
            users: { select: { userId: true } },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Check user is part of the team
    const isUserPartOfTeam = workflow.team.users.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );

    if (!isUserPartOfTeam) {
      return NextResponse.json(
        { error: "Unauthorized to delete this workflow" },
        { status: 403 },
      );
    }

    // Delete workflow and entry link in transaction
    // Note: Steps and executions will cascade delete via Prisma relations
    await prisma.$transaction([
      // Delete workflow first (cascade deletes steps and executions)
      prisma.workflow.delete({
        where: { id: workflowId },
      }),
      // Delete entry link
      prisma.link.update({
        where: { id: workflow.entryLinkId },
        data: {
          deletedAt: new Date(),
          isArchived: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
