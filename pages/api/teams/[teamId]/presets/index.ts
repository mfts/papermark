import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        users: { select: { userId: true } },
      },
    });

    // check that the user is member of the team, otherwise return 403
    const teamUsers = team?.users;
    const isUserPartOfTeam = teamUsers?.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );
    if (!isUserPartOfTeam) {
      return res.status(403).end("Unauthorized to access this team");
    }
  } catch (error) {
    errorhandler(error, res);
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/presets
    const presets = await prisma.linkPreset.findMany({
      where: {
        teamId: teamId,
      },
    });

    if (!presets) {
      return res.status(200).json(null);
    }

    return res.status(200).json(presets[0]);
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/presets
    const { metaImage, metaTitle, metaDescription, metaFavicon } = req.body as {
      metaImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      metaFavicon?: string;
    };

    // update team with new preset
    const preset = await prisma.linkPreset.create({
      data: {
        metaImage,
        metaTitle,
        metaDescription,
        metaFavicon,
        enableCustomMetaTag: true,
        name: "Default Link Metatag",
        teamId: teamId,
      },
    });

    return res.status(200).json({ message: "Preset created successfully" });
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/presets
    const { metaImage, metaTitle, metaDescription, metaFavicon } = req.body as {
      metaImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      metaFavicon?: string;
    };

    const presets = await prisma.linkPreset.findMany({
      where: {
        teamId: teamId,
      },
    });

    // if metaImage is different from previous one, delete the previous image

    const preset = await prisma.linkPreset.update({
      where: {
        teamId: teamId,
        id: presets[0].id,
      },
      data: {
        metaImage,
        metaTitle,
        metaDescription,
        metaFavicon,
      },
    });

    return res.status(200).json({ message: "Preset updated successfully" });
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/presets
    const preset = await prisma.linkPreset.findFirst({
      where: {
        teamId: teamId,
      },
      select: { id: true },
    });

    // delete the presets from database
    await prisma.linkPreset.delete({
      where: {
        id: preset?.id,
      },
    });

    return res.status(204).end();
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
