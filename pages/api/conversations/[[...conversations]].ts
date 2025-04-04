import { NextApiRequest, NextApiResponse } from "next";

import { handleRoute } from "@/ee/features/conversations/api/conversations-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handleRoute(req, res);
}
