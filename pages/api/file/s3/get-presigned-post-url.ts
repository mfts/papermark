import { NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import slugify from "@sindresorhus/slugify";
import path from "node:path";

import { ONE_HOUR, ONE_SECOND } from "@/lib/constants";
import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { fileName, contentType, docId } = req.body as {
      fileName: string;
      contentType: string;
      docId: string;
    };

    try {
      // Get the basename and extension for the file
      const { name, ext } = path.parse(fileName);

      const slugifiedName = slugify(name) + ext;
      const key = `${req.team.id}/${docId}/${slugifiedName}`;

      const { client, config } = await getTeamS3ClientAndConfig(req.team.id);

      const putObjectCommand = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
        ContentDisposition: `attachment; filename="${slugifiedName}"`,
      });

      const url = await getSignedUrl(client, putObjectCommand, {
        expiresIn: ONE_HOUR / ONE_SECOND,
      });

      res.status(200).json({ url, key, docId, fileName: slugifiedName });
      return;
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },
});
