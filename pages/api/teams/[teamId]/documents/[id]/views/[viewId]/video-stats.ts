import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getVideoEventsByView } from "@/lib/tinybird/pipes";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const { id: documentId, viewId } = req.query as {
        id: string;
        viewId: string;
      };

      // Check document access (middleware already verified team access)
      const doc = await prisma.document.findFirst({
        where: {
          id: documentId,
          teamId: req.team?.id,
        },
        include: {
          versions: {
            where: {
              isPrimary: true,
            },
            select: {
              length: true,
            },
          },
        },
      });

      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      const videoLength = doc.versions[0]?.length;
      if (!videoLength) {
        res.status(400).json({ error: "Video length not found" });
        return;
      }

      // Fetch video events from Tinybird
      const response = await getVideoEventsByView({
        view_id: viewId,
        document_id: documentId,
      });

      if (!response?.data) {
        res.status(200).json({ data: [] });
        return;
      }

      // Filter for valid events and ensure valid time ranges > 1 second
      const validEvents = response.data.filter(
        (event) =>
          (event.event_type === "played" ||
            event.event_type === "muted" ||
            event.event_type === "unmuted" ||
            event.event_type === "rate_changed") &&
          event.end_time > event.start_time &&
          event.end_time - event.start_time >= 1,
      );

      // Create a baseline array with zeros for every second
      const viewDistributionMap = new Map<number, number>();
      for (let t = 0; t <= videoLength; t++) {
        viewDistributionMap.set(t, 0);
      }

      // Fill in the actual playback periods
      validEvents.forEach((event) => {
        // For each second in the duration, increment the view count
        for (let t = event.start_time; t < event.end_time; t++) {
          viewDistributionMap.set(t, (viewDistributionMap.get(t) || 0) + 1);
        }
      });

      // Convert to sorted array
      const distributionArray = Array.from(viewDistributionMap.entries())
        .map(([start_time, views]) => ({
          start_time,
          views,
        }))
        .sort((a, b) => a.start_time - b.start_time);

      res.status(200).json({
        data: distributionArray,
      });
    } catch (error) {
      console.error("Error fetching video stats:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
});
