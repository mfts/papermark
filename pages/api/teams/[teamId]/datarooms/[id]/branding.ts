import { NextApiResponse } from "next";

import { del } from "@vercel/blob";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

  try {
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      res.status(404).end("Dataroom not found");
      return;
    }
  } catch (error) {
    errorhandler(error, res);
    return;
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findUnique({
      where: {
        dataroomId,
      },
    });

    if (!brand) {
      res.status(200).json(null);
      return;
    }

    res.status(200).json(brand);
    return;
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/branding
    const { logo, banner, brandColor, accentColor } = req.body as {
      logo?: string;
      banner?: string;
      brandColor?: string;
      accentColor?: string;
    };

    // update team with new branding
    const brand = await prisma.dataroomBrand.create({
      data: {
        logo,
        banner,
        brandColor,
        accentColor,
        dataroomId,
      },
    });

    res.status(200).json(brand);
    return;
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/datarooms/:id/branding
    const { logo, banner, brandColor, accentColor } = req.body as {
      logo?: string;
      banner?: string;
      brandColor?: string;
      accentColor?: string;
    };

    const brand = await prisma.dataroomBrand.update({
      where: {
        dataroomId,
      },
      data: {
        logo,
        banner,
        brandColor,
        accentColor,
      },
    });

    res.status(200).json(brand);
    return;
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findFirst({
      where: {
        dataroomId,
      },
      select: { id: true, logo: true, banner: true },
    });

    if (brand && brand.logo) {
      // delete the logo from vercel blob
      await del(brand.logo);
    }
    if (brand && brand.banner) {
      // delete the logo from vercel blob
      await del(brand.banner);
    }

    // delete the branding from database
    await prisma.dataroomBrand.delete({
      where: {
        id: brand?.id,
      },
    });

    res.status(204).end();
  }
}

export default createTeamHandler({
  GET: handler,
  POST: handler,
  PUT: handler,
  DELETE: handler,
});
