import { NextApiRequest, NextApiResponse } from "next";

import handleRoute from "@/ee/features/dataroom-invitations/api/group-invite";

export const config = {
  maxDuration: 300,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handleRoute(req, res);
}
