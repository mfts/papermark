import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// GET /app/(ee)/api/workflows/[workflowId]/executions - List workflow executions
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
    const searchParams = req.nextUrl.searchParams;

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Validate workflowId format
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    if (!workflowIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid workflowId format" },
        { status: 400 },
      );
    }

    // Check workflow exists and user has access
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

    const isUserPartOfTeam = workflow.team.users.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );

    if (!isUserPartOfTeam) {
      return NextResponse.json(
        { error: "Unauthorized to access this workflow" },
        { status: 403 },
      );
    }

    // Fetch executions with pagination
    const [executions, totalCount] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: { workflowId },
        include: {
          stepLogs: {
            select: {
              id: true,
              workflowStepId: true,
              conditionsMatched: true,
              executedAt: true,
              duration: true,
              error: true,
            },
            orderBy: { executedAt: "asc" },
          },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workflowExecution.count({
        where: { workflowId },
      }),
    ]);

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching workflow executions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

