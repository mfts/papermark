import { NextApiRequest, NextApiResponse } from "next";

import { AnnotationImage, DocumentAnnotation } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id: linkId, viewId } = req.query as { id: string; viewId: string };

  try {
    const view = await prisma.view.findUnique({
      where: { id: viewId, linkId: linkId },
      include: {
        link: true,
        document: {
          include: {
            annotations: {
              where: {
                isVisible: true, // Only return visible annotations for viewers
              },
              include: {
                images: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!view) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    if (view.link.deletedAt) {
      return res.status(404).json({ error: "Link deleted" });
    }

    if (view.viewedAt < new Date(Date.now() - 1000 * 60 * 60 * 23)) {
      // if view is older than 23 hours, we should not allow the annotations to be accessed
      return res.status(404).json({ error: "Annotation not found" });
    }

    // Check if annotations feature is enabled for this team
    const featureFlags = await getFeatureFlags({
      teamId: view.teamId || undefined,
    });
    if (!featureFlags.annotations) {
      return res.status(200).json([]); // Return empty array if feature is disabled
    }

    // This endpoint only handles DOCUMENT_LINK types
    // For DATAROOM_LINK types, use /api/links/[id]/documents/[documentId]/annotations
    let annotations: (DocumentAnnotation & { images: AnnotationImage[] })[] =
      [];
    if (view.link.linkType === "DOCUMENT_LINK" && view.document) {
      annotations = view.document.annotations || [];
    } else if (view.link.linkType === "DATAROOM_LINK") {
      // For dataroom links, return empty array - they should use the specific document endpoint
      annotations = [];
    }

    // Remove sensitive information (don't expose createdBy details to viewers)
    const sanitizedAnnotations = annotations.map((annotation) => ({
      id: annotation.id,
      title: annotation.title,
      content: annotation.content,
      pages: annotation.pages,
      images: annotation.images,
      createdAt: annotation.createdAt,
    }));

    return res.status(200).json(sanitizedAnnotations);
  } catch (error) {
    log({
      message: `Failed to get annotations for link: _${linkId}_. \n\n ${error}`,
      type: "error",
    });
    errorhandler(error, res);
  }
}
