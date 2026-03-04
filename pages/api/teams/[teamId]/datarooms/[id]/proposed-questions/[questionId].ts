import { NextApiRequest, NextApiResponse } from "next";

import proposedQuestionsRoute from "@/ee/features/conversations/api/team-proposed-questions-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return await proposedQuestionsRoute(req, res);
}
