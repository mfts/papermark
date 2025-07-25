import type { NextApiRequest, NextApiResponse } from "next";

import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { getServerSession } from "next-auth/next";

import { CustomUser } from "@/lib/types";

import { authOptions } from "../auth/[...nextauth]";

const uploadConfig = {
  profile: {
    allowedContentTypes: ["image/png", "image/jpg"],
    maximumSizeInBytes: 2 * 1024 * 1024, // 2MB
  },
  assets: {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/x-icon",
      "image/ico",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
  },
};

// logo-upload/?type= "profile" | "assets"
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = req.body as HandleUploadBody;
  const type = Array.isArray(req.query.type)
    ? req.query.type[0]
    : req.query.type;

  if (!type || !(type in uploadConfig)) {
    return res.status(400).json({ error: "Invalid upload type specified." });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        // Generate a client token for the browser to upload the file

        const session = await getServerSession(req, res, authOptions);
        if (!session) {
          res.status(401).end("Unauthorized");
          throw new Error("Unauthorized");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes:
            uploadConfig[type as keyof typeof uploadConfig].allowedContentTypes,
          maximumSizeInBytes:
            uploadConfig[type as keyof typeof uploadConfig].maximumSizeInBytes,
          metadata: JSON.stringify({
            // optional, sent to your server on upload completion
            userId: (session.user as CustomUser).id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of browser upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow

        console.log("blob upload completed", blob, tokenPayload);

        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          // throw new Error("Could not update user");
        }
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    // The webhook will retry 5 times waiting for a 200
    return res.status(400).json({ error: (error as Error).message });
  }
}
