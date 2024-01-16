import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../auth/[...nextauth]";
import { errorhandler } from "@/lib/errorHandler";
import { PutBlobResult, put } from "@vercel/blob";
import { Brand } from "@prisma/client";

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
    // GET /api/teams/:teamId/branding
    const brand = await prisma.brand.findUnique({
      where: {
        teamId: teamId,
      },
    });

    if (!brand) {
      res.status(404).end("Brand not found");
    }

    return res.status(200).json(brand);
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/branding
    const { logo, brandColor, accentColor, isNewLogo } = req.body as {
      logo?: string;
      brandColor?: string;
      accentColor?: string;
      isNewLogo: boolean;
    };

    let blob: PutBlobResult | null = null;

    if (isNewLogo && logo) {
      const logoString = Buffer.from(logo, "base64").toString("utf-8");

      // upload logo to blob storage
      blob = await put("Logo", logoString, { access: "public" });
      console.log(blob);
    }

    // update team with new branding
    const brand = await prisma.brand.create({
      data: {
        logo: blob ? blob.url : null,
        brandColor,
        accentColor,
        teamId: teamId,
      },
    });

    return res.status(200).json(brand);
  } else if (req.method === "PUT") {
    // POST /api/teams/:teamId/branding
    const { logo, brandColor, accentColor, isNewLogo } = req.body as {
      logo?: string;
      brandColor?: string;
      accentColor?: string;
      isNewLogo: boolean;
    };

    const brand = await prisma.brand.update({
      where: {
        teamId: teamId,
      },
      data: {
        logo,
        brandColor,
        accentColor,
      },
    });

    return res.status(200).json(brand);
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
