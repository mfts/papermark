import prisma from "@/lib/prisma";

interface CreateChatOptions {
  teamId: string;
  documentId?: string;
  dataroomId?: string;
  linkId?: string;
  viewId?: string;
  userId?: string;
  viewerId?: string;
  vectorStoreId?: string;
  title?: string;
}

/**
 * Create a new chat session
 * @param options - Chat creation options
 * @returns The created chat
 */
export async function createChat(options: CreateChatOptions) {
  const {
    teamId,
    documentId,
    dataroomId,
    linkId,
    viewId,
    userId,
    viewerId,
    vectorStoreId,
    title,
  } = options;

  try {
    const chat = await prisma.chat.create({
      data: {
        teamId,
        documentId,
        dataroomId,
        linkId,
        viewId,
        userId,
        viewerId,
        vectorStoreId,
        title,
      },
      include: {
        messages: true,
      },
    });

    return chat;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw new Error("Failed to create chat");
  }
}

