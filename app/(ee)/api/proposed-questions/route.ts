import { NextRequest } from "next/server";

import { handleGetProposedQuestions } from "@/ee/features/conversations/api/proposed-questions-route";

export async function GET(req: NextRequest) {
  return handleGetProposedQuestions(req);
}
