import { waitUntil } from "@vercel/functions";

import prisma from "@/lib/prisma";
import { validateContent } from "@/lib/utils/sanitize-html";

export const messageService = {
  // Add a message to a conversation
  async addMessage({
    conversationId,
    content,
    viewId,
    viewerId,
    userId,
  }: {
    conversationId: string;
    content: string;
    viewId?: string;
    viewerId?: string;
    userId?: string;
  }) {
    // Only one of viewerId or userId should be provided
    if ((!viewerId && !userId) || (viewerId && userId)) {
      throw new Error(
        "Either viewerId or userId must be provided, but not both",
      );
    }

    const sanitizedContent = validateContent(content);

    // Add the message
    const message = await prisma.message.create({
      data: {
        content: sanitizedContent,
        conversationId,
        viewerId,
        userId,
        viewId,
        isRead: false,
      },
      include: {
        conversation: {
          include: {
            participants: true,
            views: true,
          },
        },
        user: true,
        viewer: true,
      },
    });

    // Check if the current viewer/user is already a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (participant) =>
        participant.viewerId === viewerId || participant.userId === userId,
    );

    const conversationPromises = [
      // Update the conversation's updatedAt, lastMessageAt timestamp
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() },
      }),

      // Create the conversation view if it doesn't exist for viewerId
      viewerId &&
        prisma.conversationView.upsert({
          where: {
            conversationId_viewId: {
              conversationId,
              viewId: viewId!, // viewId is not null because of the viewerId check above
            },
          },
          create: {
            conversationId,
            viewId: viewId!, // viewId is not null because of the viewerId check above
          },
          update: {}, // No update needed
        }),

      // Add the new participant to the conversation if they are not already a participant
      !isParticipant &&
        (viewerId
          ? prisma.conversationParticipant.create({
              data: { conversationId, viewerId },
            })
          : prisma.conversationParticipant.create({
              data: { conversationId, userId },
            })),
    ];

    waitUntil(Promise.all(conversationPromises));

    return message;
  },

  // Mark a message as read
  async markMessageAsRead(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  },

  // Get unread messages for a participant
  async getUnreadMessages(viewerId?: string, userId?: string) {
    if (!viewerId && !userId) {
      return [];
    }

    // Query based on participant type
    if (userId) {
      return prisma.message.findMany({
        where: {
          isRead: false,
          conversation: {
            participants: {
              some: {
                userId,
              },
            },
          },
          // Only messages from viewers (not from this user)
          viewerId: { not: null },
          userId: null,
        },
        include: {
          conversation: true,
          viewer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      return prisma.message.findMany({
        where: {
          isRead: false,
          conversation: {
            participants: {
              some: {
                viewerId,
              },
            },
          },
          // Only messages from team members or other viewers (not from this viewer)
          viewerId: { not: viewerId },
        },
        include: {
          conversation: true,
          user: true,
          viewer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  },
};
