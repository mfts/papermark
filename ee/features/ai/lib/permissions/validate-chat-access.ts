import prisma from "@/lib/prisma";

interface ValidateChatAccessOptions {
  chatId: string;
  userId?: string;
  viewerId?: string;
}

/**
 * Validate if a user or viewer has access to a chat
 * @param options - Chat ID and user/viewer ID
 * @returns Boolean indicating if access is granted
 */
export async function validateChatAccess({
  chatId,
  userId,
  viewerId,
}: ValidateChatAccessOptions): Promise<boolean> {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        teamId: true,
        userId: true,
        viewerId: true,
      },
    });

    if (!chat) {
      return false;
    }

    // Internal user access
    if (userId) {
      // Check if user is member of the team
      const userTeam = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: chat.teamId,
          },
        },
      });

      if (!userTeam) {
        return false;
      }

      // Additional check: if chat has a specific userId, it must match
      if (chat.userId && chat.userId !== userId) {
        return false;
      }

      return true;
    }

    // External viewer access
    if (viewerId) {
      // Check if viewer is associated with this chat
      if (chat.viewerId !== viewerId) {
        return false;
      }

      // Verify viewer exists and is associated with the team
      const viewer = await prisma.viewer.findUnique({
        where: { id: viewerId },
      });

      if (!viewer || viewer.teamId !== chat.teamId) {
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating chat access:", error);
    return false;
  }
}
