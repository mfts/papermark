import prisma from "@/lib/prisma";

export const teamExists = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });

  return team ? true : false;
};

export const teamHasUser = async (teamId: string, userId: string) => {
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
    },
  });

  return team?.users.some((user) => user.userId === userId);
};

export const teamHasDocument = async (teamId: string, docId: string) => {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      documents: {
        select: {
          id: true,
        },
      },
    },
  });

  return team?.documents.some((doc) => doc.id === docId);
};
