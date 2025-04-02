import { NextApiRequest, NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth";
import path from "node:path";

import { ONE_HOUR, ONE_SECOND } from "@/lib/constants";
import { getS3Client } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

const client = getS3Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { fileName, contentType, teamId, docId, viewerId } = req.body as {
    fileName: string;
    contentType: string;
    teamId: string;
    docId: string;
    viewerId: string;
  };

  const session = await getServerSession(req, res, authOptions);

  // If no session and no viewerId, unauthorized
  if (!session && !viewerId) {
    return res.status(401).end("Unauthorized");
  }

  let hasAccess = false;

  // Check if user is a team member (only if session exists)
  if (session?.user) {
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
    hasAccess = !!team;
  }

  // Check if user is a viewer (if viewerId is provided)
  if (viewerId) {
    const viewer = await prisma.viewer.findUnique({
      where: {
        id: viewerId,
        teamId: teamId,
      },
    });
    hasAccess = hasAccess || !!viewer;
  }

  if (!hasAccess) {
    return res.status(403).end("Unauthorized to access this team");
  }

  try {
    // Get the basename and extension for the file
    const { name, ext } = path.parse(fileName);

    const slugifiedName = slugify(name) + ext;
    const key = `${viewerId ? `${viewerId}/${teamId}` : teamId}/${docId}/${slugifiedName}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="${slugifiedName}"`,
    });

    const url = await getSignedUrl(client, putObjectCommand, {
      expiresIn: ONE_HOUR / ONE_SECOND,
    });

    return res.status(200).json({ url, key, docId, fileName: slugifiedName });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
