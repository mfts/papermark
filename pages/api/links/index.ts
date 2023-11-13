import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hashPassword } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import {
  getDocumentWithTeamAndUser,
  getTeamWithUsersAndDocument,
} from "@/lib/team/helper";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { documentId, password, expiresAt, ...linkDomainData } = req.body;

    const userId = (session.user as CustomUser).id;

    try {
      // check if the the team that own the document has the current user
      await getDocumentWithTeamAndUser({
        docId: documentId,
        userId,
        options: {
          team: {
            select: {
              users: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      const hashedPassword =
        password && password.length > 0 ? await hashPassword(password) : null;
      const exat = expiresAt ? new Date(expiresAt) : null;

      let { domain, slug, ...linkData } = linkDomainData;

      // set domain and slug to null if the domain is papermark.io
      if (domain && domain === "papermark.io") {
        domain = null;
        slug = null;
      }

      let domainObj;

      if (domain && slug) {
        domainObj = await prisma.domain.findUnique({
          where: {
            slug: domain,
          },
        });

        if (!domainObj) {
          return res.status(400).json({ error: "Domain not found." });
        }

        // console.log(domainObj);

        const existingLink = await prisma.link.findUnique({
          where: {
            domainSlug_slug: {
              slug: slug,
              domainSlug: domain,
            },
          },
        });

        if (existingLink) {
          return res.status(400).json({
            error: "The link already exists.",
          });
        }
      }

      // Fetch the link and its related document from the database
      const link = await prisma.link.create({
        data: {
          documentId: documentId,
          password: hashedPassword,
          name: linkData.name || null,
          emailProtected: linkData.emailProtected,
          expiresAt: exat,
          allowDownload: linkData.allowDownload,
          domainId: domainObj?.id || null,
          domainSlug: domain || null,
          slug: slug || null,
          enableNotification: linkData.enableNotification,
        },
      });

      const linkWithView = {
        ...link,
        _count: { views: 0 },
        views: [],
      };

      if (!linkWithView) {
        return res.status(404).json({ error: "Link not found" });
      }

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Link Added",
        linkId: linkWithView.id,
        documentId: linkWithView.documentId,
        customDomain: linkWithView.domainSlug,
      });

      return res.status(200).json(linkWithView);
    } catch (error) {
      errorhandler(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
