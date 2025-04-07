import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

import {
  CreateConversationInput,
  conversationService,
} from "../lib/api/conversations";
import { messageService } from "../lib/api/messages";
import { notificationService } from "../lib/api/notifications";

// Route mapping object to handle different paths
const routeHandlers = {
  // GET /api/conversations
  "GET /": async (req: NextApiRequest, res: NextApiResponse) => {
    // Handle listing conversations
    const { dataroomId, viewerId } = req.query as {
      dataroomId?: string;
      viewerId?: string;
    };

    if (!dataroomId || !viewerId) {
      return res.status(400).json({ error: "Missing dataroomId or viewerId" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        dataroomId,
        participants: {
          some: {
            viewerId,
          },
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        dataroom: true,
        dataroomDocument: true,
        participants: {
          where: {
            viewerId,
          },
          select: {
            receiveNotifications: true,
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const conversationsWithNotifications = conversations.map(
      (conversation) => ({
        ...conversation,
        receiveNotifications: conversation.participants[0].receiveNotifications,
      }),
    );

    return res.status(200).json(conversationsWithNotifications);
  },

  // POST /api/conversations
  "POST /": async (req: NextApiRequest, res: NextApiResponse) => {
    const { dataroomId, viewId, viewerId, ...data } =
      req.body as CreateConversationInput & {
        dataroomId: string;
        viewId: string;
        viewerId?: string;
      };

    // Check if conversations are allowed
    const areAllowed = await conversationService.areConversationsAllowed(
      dataroomId,
      data.linkId,
    );

    if (!areAllowed) {
      return res.status(403).json({
        error: "Conversations are disabled for this dataroom or link",
      });
    }

    // Check if viewerId is provided
    if (!viewerId) {
      return res.status(400).json({ error: "Viewer is required" });
    }

    const team = await prisma.team.findFirst({
      where: {
        datarooms: {
          some: {
            id: dataroomId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return res.status(400).json({ error: "Team not found" });
    }

    // Create the conversation
    const conversation = await conversationService.createConversation({
      dataroomId,
      viewerId,
      viewId,
      teamId: team.id,
      data,
    });

    return res.status(201).json(conversation);
  },

  // POST /api/conversations/messages
  "POST /messages": async (req: NextApiRequest, res: NextApiResponse) => {
    const { content, viewId, viewerId, conversationId } = req.body as {
      content: string;
      viewId: string;
      viewerId?: string;
      conversationId: string;
    };

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Create the message
    const message = await messageService.addMessage({
      conversationId,
      content,
      viewId,
      viewerId,
    });

    return res.status(201).json(message);
  },

  // POST /api/conversations/notifications
  "POST /notifications": async (req: NextApiRequest, res: NextApiResponse) => {
    const { enabled, viewerId, conversationId } = req.body as {
      enabled: boolean;
      viewerId: string;
      conversationId: string;
    };

    await notificationService.toggleNotificationsForConversation({
      conversationId,
      viewerId,
      enabled,
    });

    return res.status(200).json({ success: true });
  },
};

// Main handler that will be imported by the catchall route
export async function handleRoute(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  // Construct route key from method and path
  const path = Array.isArray(query.conversations)
    ? query.conversations.join("/")
    : "";
  const routeKey = `${method} /${path}`;

  // Find matching handler
  const handler = routeHandlers[routeKey as keyof typeof routeHandlers];

  if (!handler) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  try {
    return await handler(req, res);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
