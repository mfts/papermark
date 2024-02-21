import { NextApiRequest, NextApiResponse } from "next";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/files/aws-client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import path from "node:path";
import slugify from "@sindresorhus/slugify";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ONE_HOUR, ONE_SECOND } from "@/lib/constants";

const client = getS3Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { fileName, contentType, teamId, docId } = req.body as {
    fileName: string;
    contentType: string;
    teamId: string;
    docId: string;
  };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      users: {
        some: {
          userId: (session.user as CustomUser).id,
        },
      },
    },
    select: { id: true },
  });

  if (!team) {
    return res.status(403).end("Unauthorized to access this team");
  }

  try {
    // Get the basename and extension for the file
    const { name, ext } = path.parse(fileName);

    let key = `${team.id}/${docId}/${slugify(name)}${ext}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(client, putObjectCommand, {
      expiresIn: ONE_HOUR / ONE_SECOND,
    });

    return res.status(200).json({ url, key, docId });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
