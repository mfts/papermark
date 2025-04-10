import { NextApiRequest, NextApiResponse } from "next";

import toggleConversationsRoute from "@/ee/features/conversations/api/toggle-conversations-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return toggleConversationsRoute(req, res);
}
