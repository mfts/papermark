import { NextApiRequest, NextApiResponse } from "next";

import publishFAQRoute from "@/ee/features/conversations/api/team-faqs-route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return await publishFAQRoute(req, res);
}
