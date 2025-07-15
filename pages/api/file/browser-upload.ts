import type { NextApiResponse } from "next";

import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";

import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const body = req.body as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname: string) => {
          // Generate a client token for the browser to upload the file
          const userId = req.user.id;
          const team = await prisma.team.findFirst({
            where: {
              users: {
                some: {
                  userId,
                },
              },
            },
            select: {
              plan: true,
            },
          });

          let maxSize = 30 * 1024 * 1024; // 30 MB
          const stripedTeamPlan = team?.plan.replace("+old", "");
          if (
            stripedTeamPlan &&
            ["business", "datarooms", "datarooms-plus"].includes(
              stripedTeamPlan,
            )
          ) {
            maxSize = 100 * 1024 * 1024; // 100 MB
          }

          return {
            allowedContentTypes: [
              "application/pdf",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ],
            maximumSizeInBytes: maxSize, // 30 MB
            metadata: JSON.stringify({
              // optional, sent to your server on upload completion
              userId: req.user.id,
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          // Get notified of browser upload completion
          // ⚠️ This will not work on `localhost` websites,
          // Use ngrok or similar to get the full upload flow

          try {
            // Run any logic after the file upload completed
            // const { userId } = JSON.parse(tokenPayload);
            // await db.update({ avatar: blob.url, userId });
          } catch (error) {
            // throw new Error("Could not update user");
          }
        },
      });

      res.status(200).json(jsonResponse);
      return;
    } catch (error) {
      // The webhook will retry 5 times waiting for a 200
      res.status(400).json({ error: (error as Error).message });
      return;
    }
  },
});
