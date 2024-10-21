import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { fetchDataroomLinkData } from "@/lib/api/links/link-data";
import { errorhandler } from "@/lib/errorHandler";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/getViewerDoc?linkId=${linkId}
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { linkId, viewerId, type } = req.query as {
      linkId: string;
      viewerId: string;
      type?: "USER" | "VIEWER";
    };
    const userId = (session.user as CustomUser).id;
    try {
      const data = await fetchDataroomLinkData({
        linkId: linkId,
        type: type ?? "VIEWER",
        viewerId: viewerId,
        ownerId: viewerId === "undefined" ? userId : undefined,
      });

      const documents =
        data?.linkData?.dataroom?.documents.map((li) => {
          return {
            ...li.document,
            dataroomDocumentId: li.id,
            orderIndex: li.orderIndex,
            folderId: li.folderId,
          };
        }) || [];
      return res.status(200).json(documents);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
