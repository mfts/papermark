import prisma from "@/lib/prisma";

export const isOrganizationEmail = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    },
    select: {
      isPublicEmail: true
    }
  });
  if (!user) {
    return false;
  }

  return !!user?.isPublicEmail;
};

export const getEmailDomain = (email: string): string | null => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};
