import { NextApiResponse } from "next";

import { del } from "@vercel/blob";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const brand = await prisma.brand.findUnique({
        where: {
          teamId: teamId,
        },
      });

      if (!brand) {
        res.status(200).json(null);
        return;
      }

      res.status(200).json(brand);
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { logo, brandColor, accentColor } = req.body as {
      logo?: string;
      brandColor?: string;
      accentColor?: string;
    };

    try {
      // update team with new branding
      const brand = await prisma.brand.create({
        data: {
          logo: logo,
          brandColor,
          accentColor,
          teamId: teamId,
        },
      });

      // Cache the logo URL in Redis if logo exists
      if (logo) {
        await redis.set(`brand:logo:${teamId}`, logo);
      }

      res.status(200).json(brand);
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },

  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { logo, brandColor, accentColor } = req.body as {
      logo?: string;
      brandColor?: string;
      accentColor?: string;
    };

    try {
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

      // Update logo in Redis cache
      if (logo) {
        await redis.set(`brand:logo:${teamId}`, logo);
      } else {
        // If logo is null or undefined, delete the cache
        await redis.del(`brand:logo:${teamId}`);
      }

      res.status(200).json(brand);
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },

  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const brand = await prisma.brand.findFirst({
        where: {
          teamId: teamId,
        },
        select: { id: true, logo: true },
      });

      if (brand && brand.logo) {
        // delete the logo from vercel blob
        await del(brand.logo);
      }

      // delete the branding from database
      await prisma.brand.delete({
        where: {
          id: brand?.id,
        },
      });

      // Remove logo from Redis cache
      await redis.del(`brand:logo:${teamId}`);

      res.status(204).end();
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },
});
