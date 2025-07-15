import { NextApiResponse } from "next";

import { cancelSubscription } from "@/ee/stripe";
import { isOldAccount } from "@/ee/stripe/utils";
import { DocumentStorageType } from "@prisma/client";

import { removeDomainFromVercelProject } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import { deleteFiles } from "@/lib/files/delete-team-files-server";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { unsubscribe } from "@/lib/unsend";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              role: true,
              teamId: true,
              userId: true,
              status: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
          documents: {
            select: {
              owner: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json(team);
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },

  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      // check if the team exists
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: true,
          domains: true,
        },
      });
      if (!team) {
        res.status(400).json("Team doesn't exists");
        return;
      }

      // check if current user is admin of the team
      const isUserAdmin = team.users.some(
        (user) => user.role === "ADMIN" && user.userId === req.user.id,
      );
      if (!isUserAdmin) {
        res
          .status(403)
          .json({ message: "You are not permitted to perform this action" });
        return;
      }

      // get all documents using Vercel Blob storage
      const documentsUsingBlob = await prisma.document.findMany({
        where: {
          teamId: teamId,
          storageType: DocumentStorageType.VERCEL_BLOB,
        },
        select: {
          file: true,
          versions: {
            select: {
              file: true,
              pages: {
                select: {
                  file: true,
                },
              },
            },
          },
        },
      });

      // get all branding files
      const brandingFiles = await prisma.brand.findMany({
        where: {
          teamId,
        },
        select: {
          logo: true,
        },
      });

      // get all dataroom branding files
      const dataroomBrandingFiles = await prisma.dataroomBrand.findMany({
        where: {
          dataroom: {
            teamId: teamId,
          },
        },
        select: {
          logo: true,
          banner: true,
        },
      });

      let files: string[] = [];
      let hasBlobDocuments = false;

      if (documentsUsingBlob) {
        hasBlobDocuments = true;
        // flatten documents and extract file fields
        files = documentsUsingBlob.flatMap((doc) => [
          doc.file,
          ...doc.versions.flatMap((version) => [
            version.file,
            ...version.pages.map((page) => page.file),
          ]),
        ]);
      }

      if (brandingFiles) {
        files = [
          ...files,
          ...brandingFiles
            .map((brand) => brand.logo)
            .filter((logo): logo is string => logo !== null),
        ];
      }

      if (dataroomBrandingFiles) {
        files = [
          ...files,
          ...dataroomBrandingFiles
            .flatMap((brand) => [brand.logo, brand.banner])
            .filter((item): item is string => item !== null),
        ];
      }

      // delete all files from storage
      await deleteFiles({ teamId, data: hasBlobDocuments ? files : undefined });

      // if user doesn't have other teams, delete the user
      const userTeams = await prisma.team.findMany({
        where: {
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      // prepare a list of promises to delete domains
      let domainPromises: void[] = [];
      if (team.domains) {
        domainPromises = team.domains.map((domain) => {
          removeDomainFromVercelProject(domain.slug);
        });
      }

      await Promise.all([
        // delete domains, if exists on team
        team.domains && domainPromises,
        // delete subscription, if exists on team
        team.stripeId &&
          cancelSubscription(team.stripeId, isOldAccount(team.plan)),
        // delete user from contact book
        unsubscribe(req.user.email ?? ""),
        // delete user, if no other teams
        userTeams.length === 1 &&
          prisma.user.delete({
            where: {
              id: req.user.id,
            },
          }),
        // delete team branding from redis
        redis.del(`brand:logo:${teamId}`),
        // delete team
        prisma.team.delete({
          where: {
            id: teamId,
          },
        }),
      ]);

      res.status(204).end();
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },
});
