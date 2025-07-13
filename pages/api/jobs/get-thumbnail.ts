import { NextApiResponse } from "next";

import { getFileForDocumentPage } from "@/lib/documents/get-file-helper";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";

export default createAuthenticatedHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { documentId, pageNumber, versionNumber } = req.query as {
      documentId: string;
      pageNumber: string;
      versionNumber: string;
    };

    try {
      const imageUrl = await getFileForDocumentPage(
        Number(pageNumber),
        documentId,
        versionNumber === "undefined" ? undefined : Number(versionNumber),
      );

      res.status(200).json({ imageUrl });
      return;
    } catch (error) {
      console.error("Thumbnail retrieval error:", error);
      res.status(500).json({ message: "Failed to retrieve thumbnail" });
      return;
    }
  },
});
