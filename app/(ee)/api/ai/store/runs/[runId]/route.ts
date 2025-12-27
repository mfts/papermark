import { runs } from "@trigger.dev/sdk/v3";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

/**
 * GET /api/ai/store/runs/[runId]
 * Get the status of a Trigger.dev run for polling
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = params;

    const run = await runs.retrieve(runId);

    return NextResponse.json({
      id: run.id,
      status: run.status,
      metadata: run.metadata,
      isCompleted: run.isCompleted,
      isFailed: run.isFailed,
      output: run.output,
    });
  } catch (error) {
    console.error("Error retrieving run status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve run status" },
      { status: 500 },
    );
  }
}
