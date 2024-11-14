import { Document, DocumentVersion, Domain, Link, View } from "@prisma/client";

import prisma from "@/lib/prisma";
import { decryptEncrpytedPassword } from "@/lib/utils";

import { DocumentError, TeamError } from "../errorHandler";

interface ITeamUserAndDocument {
  teamId: string;
  userId: string;
  docId?: string;
  checkOwner?: boolean;
  options?: {};
}

interface ITeamWithDomain {
  teamId: string;
  userId: string;
  domain?: string;
  teamOptions?: {};
  options?: {};
}

interface IDocumentWithLink {
  docId: string;
  userId: string;
  options?: {};
}

export async function getTeamWithUsersAndDocument({
  teamId,
  userId,
  docId,
  checkOwner,
  options,
}: ITeamUserAndDocument) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      users: {
        select: {
          userId: true,
        },
      },
      documents: {
        ...options,
      },
    },
  });

  // check if the team exists
  if (!team) {
    throw new TeamError("Team doesn't exists");
  }

  // check if the user is part the team
  const teamHasUser = team?.users.some((user) => user.userId === userId);
  if (!teamHasUser) {
    throw new TeamError("You are not a member of the team");
  }

  // check if the document exists in the team
  let document:
    | (Document & {
        views?: View[];
        versions?: DocumentVersion[];
        links?: Link[];
      })
    | undefined;
  if (docId) {
    document = team.documents.find((doc) => doc.id === docId);
    if (!document) {
      throw new TeamError("Document doesn't exists in the team");
    }
  }
  if (document && document?.links) {
    document?.links?.forEach((res: Link) => {
      if (res?.password != null) {
        let decryptedPassword: string = decryptEncrpytedPassword(res?.password);
        res["password"] = decryptedPassword;
      }
    });
  }
  // Check that the user is owner of the document, otherwise return 401
  // if (checkOwner) {
  //   const isUserOwnerOfDocument = document?.ownerId === userId;
  //   if (!isUserOwnerOfDocument) {
  //     throw new TeamError("Unauthorized access to the document");
  //   }
  // }

  return { team, document };
}

export async function getTeamWithDomain({
  teamId,
  userId,
  domain: domainSlug,
  teamOptions,
  options,
}: ITeamWithDomain) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      users: {
        select: {
          userId: true,
        },
      },
      domains: {
        ...options,
      },
    },
  });

  // check if the team exists
  if (!team) {
    throw new TeamError("Team doesn't exists");
  }

  // check if the user is part the team
  const teamHasUser = team?.users.some((user) => user.userId === userId);
  if (!teamHasUser) {
    throw new TeamError("You are not a member of the team");
  }

  // check if the team has a paid plan
  const teamHasPaidPlan = team?.plan !== "free";
  if (!teamHasPaidPlan) {
    throw new TeamError("Team doesn't have a paid plan");
  }

  // check if the domain exists in the team
  let domain: Domain | undefined;
  if (domainSlug) {
    domain = team.domains.find((_domain) => _domain.slug === domainSlug);
    if (!domain) {
      throw new TeamError("Domain doesn't exists in the team");
    }
  }

  return { team, domain };
}

export async function getDocumentWithTeamAndUser({
  docId,
  userId,
  options,
}: IDocumentWithLink) {
  const document = (await prisma.document.findUnique({
    where: {
      id: docId,
    },
    include: {
      ...options,
    },
  })) as Document & { team: { users: { userId: string }[] } };

  if (!document) {
    throw new DocumentError("Document doesn't exists");
  }

  const teamHasUser = document.team?.users.some(
    (user) => user.userId === userId,
  );
  if (!teamHasUser) {
    throw new TeamError("You are not a member of the team");
  }

  return { document };
}
