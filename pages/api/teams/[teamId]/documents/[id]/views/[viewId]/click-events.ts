import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import { getClickEventsByView } from "@/lib/tinybird/pipes";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id, viewId } = req.query as {
      id: string;
      viewId: string;
    };

    try {
      // Check if team plan includes "free" - this is the business logic
      if (req.team?.plan?.includes("free")) {
        res.status(403).end("Forbidden");
        return;
      }

      const data = await getClickEventsByView({
        document_id: id,
        view_id: viewId,
      });

      res.status(200).json(data);
    } catch (error) {
      log({
        message: `Failed to get click events for document ${id} and view ${viewId}. \n\n ${error}`,
        type: "error",
        mention: true,
      });
      res.status(500).json({ error: "Failed to get click events" });
    }
  },
});
