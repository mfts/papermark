import { NextApiRequest, NextApiResponse } from "next";

import handleRoute from "@/ee/features/dataroom-invitations/api/uninvited";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handleRoute(req, res);
}
