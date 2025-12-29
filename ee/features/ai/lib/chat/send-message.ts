import { OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import prisma from "@/lib/prisma";

interface SendMessageOptions {
  chatId: string;
  content: string;
  vectorStoreId: string;
  filteredDataroomDocumentIds?: string[];
  /** Filter file_search results to a specific document by its ID */
  filterDocumentId?: string;
  /** User-selected dataroom document IDs to filter file_search results */
  userSelectedDataroomDocumentIds?: string[];
}

/**
 * Send a message and get streaming response
 * Uses AI SDK with OpenAI file_search tool
 */
export async function sendMessage({
  chatId,
  content,
  vectorStoreId,
  filteredDataroomDocumentIds,
  filterDocumentId,
  userSelectedDataroomDocumentIds,
}: SendMessageOptions) {
  // Get conversation history from database
  const history = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Save user message
  await prisma.chatMessage.create({
    data: { chatId, role: "user", content },
  });

  // Build messages for AI SDK
  const messages = [
    {
      role: "system" as const,
      content: `You are a helpful AI assistant answering questions about documents.
Use the file_search tool to find relevant information from the documents.
Always cite sources with document names and page numbers when providing information.
If you cannot find the answer in the documents, say so clearly.`,
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content },
  ];

  // Build file_search tool options with optional document filter
  const fileSearchOptions: Parameters<typeof openai.tools.fileSearch>[0] = {
    vectorStoreIds: [vectorStoreId],
  };

  // Add document filter when viewing a specific document in a dataroom
  if (filterDocumentId) {
    fileSearchOptions.filters = {
      type: "eq",
      key: "documentId",
      value: filterDocumentId,
    };
  } else if (
    userSelectedDataroomDocumentIds &&
    userSelectedDataroomDocumentIds.length > 0
  ) {
    // User explicitly selected documents to filter to
    // Intersect with permission-based filter if it exists
    let effectiveIds = userSelectedDataroomDocumentIds;
    if (filteredDataroomDocumentIds && filteredDataroomDocumentIds.length > 0) {
      // Only include user-selected IDs that are also in the permission-filtered list
      effectiveIds = userSelectedDataroomDocumentIds.filter((id) =>
        filteredDataroomDocumentIds.includes(id),
      );
      // Security: If intersection is empty (user sent unauthorized IDs),
      // fall back to the permission-based filter to prevent searching all documents
      if (effectiveIds.length === 0) {
        effectiveIds = filteredDataroomDocumentIds;
      }
    }
    if (effectiveIds.length > 0) {
      fileSearchOptions.filters = {
        type: "in",
        key: "dataroomDocumentId",
        value: effectiveIds,
      };
    }
  } else if (
    filteredDataroomDocumentIds &&
    filteredDataroomDocumentIds.length > 0
  ) {
    // Only apply filter if there are specific documents to filter to
    // An empty array would filter out ALL documents
    fileSearchOptions.filters = {
      type: "in",
      key: "dataroomDocumentId",
      value: filteredDataroomDocumentIds,
    };
  }

  const latestMessage = history.at(0);
  const previousResponseId =
    (latestMessage?.metadata as { responseId?: string } | null)?.responseId ??
    null;

  // Use AI SDK streamText with file_search tool
  const result = streamText({
    model: openai.responses("gpt-4o-mini"),
    messages,
    tools: {
      file_search: openai.tools.fileSearch(fileSearchOptions),
    },
    providerOptions: {
      openai: {
        previousResponseId,
      } satisfies OpenAIResponsesProviderOptions,
    },
    onFinish: async ({ text, usage, response }) => {
      await Promise.all([
        prisma.chatMessage.create({
          data: {
            chatId,
            role: "assistant",
            content: text,
            metadata: {
              usage,
              vectorStoreId,
              responseId: response.id,
              modelId: response.modelId,
              filters: fileSearchOptions.filters,
            },
          },
        }),
        prisma.chat.update({
          where: { id: chatId },
          data: { lastMessageAt: new Date() },
        }),
      ]);
    },
  });

  return result;
}
