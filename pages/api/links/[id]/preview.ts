import { NextApiResponse } from "next";

import { createPreviewSession } from "@/lib/auth/preview-auth";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import { CustomUser } from "@/lib/types";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/links/:id/preview
    const { id } = req.query as { id: string };

    const previewSession = await createPreviewSession(id, req.user.id);

    res.status(200).json({ previewToken: previewSession.token });
    return;
  },
});
