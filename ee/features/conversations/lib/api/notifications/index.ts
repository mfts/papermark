import prisma from "@/lib/prisma";

export const notificationService = {
  // Toggle notifications for a conversation
  async toggleNotificationsForConversation({
    conversationId,
    viewerId,
    enabled,
  }: {
    conversationId: string;
    viewerId: string;
    enabled: boolean;
  }) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_viewerId: { conversationId, viewerId },
      },
      data: { receiveNotifications: enabled },
    });
  },
};
