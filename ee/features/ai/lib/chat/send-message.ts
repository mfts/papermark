import { OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

import prisma from "@/lib/prisma";

interface SendMessageOptions {
  chatId: string;
  content: string;
  vectorStoreId: string;
  /** Permission-scoped dataroom document IDs; undefined means unrestricted */
  filteredDataroomDocumentIds?: string[];
  /** Filter file_search results to a specific document by its ID */
  filterDocumentId?: string;
  /** User-selected dataroom document IDs to filter file_search results */
  userSelectedDataroomDocumentIds?: string[];
  /** Dataroom ID for citation-to-document mapping */
  dataroomId?: string;
  /** Link ID used to generate canonical viewer URLs */
  linkId?: string;
}

interface CitationCandidate {
  fileId?: string;
  filename?: string;
  page?: number;
}

interface ResolvedReference {
  dataroomDocumentId: string;
  documentName: string;
  url: string;
  page?: number;
  folderPath?: string;
}

export const CHAT_METADATA_PREFIX = "\n\n<!-- CHAT_METADATA:";
export const CHAT_METADATA_SUFFIX = " -->";

export interface ChatStreamSource {
  id: string;
  name: string;
  url: string;
  dataroomDocumentId?: string;
  page?: number;
  folderPath?: string;
}

export interface ChatStreamMetadata {
  sources: ChatStreamSource[];
  suggestedQuestions: string[];
}

function validatePageValue(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value);
  return rounded < 0 ? undefined : rounded;
}

function normalizePageNumber(value: unknown): number | undefined {
  const validated = validatePageValue(value);
  if (validated === undefined) return undefined;
  // Treat 0 as first page for 1-based page_number / page fields.
  return validated === 0 ? 1 : validated;
}

function extractPageNumberFromRecord(
  record: Record<string, unknown>,
): number | undefined {
  const directPage = normalizePageNumber(
    record.page_number ?? record.page ?? record.pageNumber,
  );
  if (directPage !== undefined) {
    return directPage;
  }

  // Some payloads expose 0-based page index.
  const pageIndex = validatePageValue(record.page_index ?? record.pageIndex);
  if (pageIndex !== undefined) {
    return pageIndex + 1;
  }

  const location =
    typeof record.location === "object" && record.location
      ? (record.location as Record<string, unknown>)
      : null;
  if (location) {
    const locationPage = normalizePageNumber(
      location.page_number ?? location.page ?? location.pageNumber,
    );
    if (locationPage !== undefined) {
      return locationPage;
    }

    const locationPageIndex = validatePageValue(
      location.page_index ?? location.pageIndex,
    );
    if (locationPageIndex !== undefined) {
      return locationPageIndex + 1;
    }
  }

  return undefined;
}

function extractFileCitations(response: unknown): CitationCandidate[] {
  const citations: CitationCandidate[] = [];
  const visited = new Set<object>();

  const addCitation = (candidate: CitationCandidate) => {
    if (!candidate.fileId && !candidate.filename) return;
    citations.push(candidate);
  };

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;

    if (visited.has(node as object)) {
      return;
    }
    visited.add(node as object);

    const record = node as Record<string, unknown>;

    // OpenAI often provides annotations with type=file_citation.
    if (record.type === "file_citation") {
      addCitation({
        fileId:
          (record.file_id as string | undefined) ||
          (record.fileId as string | undefined),
        filename:
          (record.filename as string | undefined) ||
          (record.file_name as string | undefined),
        page: extractPageNumberFromRecord(record),
      });
    }

    // Sometimes payloads are nested under file_citation key.
    if (record.file_citation && typeof record.file_citation === "object") {
      const nested = record.file_citation as Record<string, unknown>;
      addCitation({
        fileId:
          (nested.file_id as string | undefined) ||
          (nested.fileId as string | undefined),
        filename:
          (nested.filename as string | undefined) ||
          (nested.file_name as string | undefined),
        page: extractPageNumberFromRecord(nested),
      });
      visit(record.file_citation);
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          visit(item);
        }
      } else {
        visit(value);
      }
    }
  };

  visit(response);

  return citations;
}

function stripTrailingReferencesSection(text: string): string {
  return text
    .replace(
      /\n{2,}(?:#{1,6}\s*)?References\s*\n(?:\s*\n)?(?:[-*]\s.*(?:\n|$))+$/i,
      "",
    )
    .trimEnd();
}

function escapeMarkdownLinkText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

async function resolveReferencesFromCitations({
  dataroomId,
  linkId,
  citations,
  allowedDocumentIds,
}: {
  dataroomId?: string;
  linkId?: string;
  citations: CitationCandidate[];
  /** Permission-scoped dataroom document IDs; when set, only these documents are considered */
  allowedDocumentIds?: string[];
}): Promise<ResolvedReference[]> {
  if (!dataroomId || !linkId || citations.length === 0) {
    return [];
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { domainId: true, domainSlug: true, slug: true },
  });

  const isCustomDomain = Boolean(link?.domainId && link.domainSlug && link.slug);
  const viewerBasePath = isCustomDomain
    ? `/${link!.slug}`
    : `/view/${linkId}`;

  const citedFileIds = Array.from(
    new Set(
      citations
        .map((citation) => citation.fileId)
        .filter((fileId): fileId is string => Boolean(fileId)),
    ),
  );

  const fileIdToDocument = new Map<
    string,
    { dataroomDocumentId: string; documentName: string; folderPath?: string }
  >();

  if (citedFileIds.length > 0) {
    const dataroomDocuments = await prisma.dataroomDocument.findMany({
      where: {
        dataroomId,
        ...(allowedDocumentIds && { id: { in: allowedDocumentIds } }),
        document: {
          versions: {
            some: {
              isPrimary: true,
              fileId: { in: citedFileIds },
            },
          },
        },
      },
      select: {
        id: true,
        folder: {
          select: {
            name: true,
            path: true,
          },
        },
        document: {
          select: {
            name: true,
            versions: {
              where: { isPrimary: true },
              take: 1,
              select: {
                fileId: true,
              },
            },
          },
        },
      },
    });

    for (const dataroomDocument of dataroomDocuments) {
      const primaryFileId = dataroomDocument.document.versions[0]?.fileId;
      if (!primaryFileId) continue;
      fileIdToDocument.set(primaryFileId, {
        dataroomDocumentId: dataroomDocument.id,
        documentName: dataroomDocument.document.name,
        folderPath: dataroomDocument.folder?.path,
      });
    }
  }

  const citedFilenames = Array.from(
    new Set(
      citations
        .map((citation) => citation.filename)
        .filter((filename): filename is string => Boolean(filename)),
    ),
  );

  const uniqueFilenameToDocument = new Map<
    string,
    { dataroomDocumentId: string; documentName: string; folderPath?: string }
  >();

  if (citedFilenames.length > 0) {
    const namedDataroomDocuments = await prisma.dataroomDocument.findMany({
      where: {
        dataroomId,
        ...(allowedDocumentIds && { id: { in: allowedDocumentIds } }),
        document: {
          name: { in: citedFilenames },
        },
      },
      select: {
        id: true,
        folder: {
          select: {
            name: true,
            path: true,
          },
        },
        document: {
          select: {
            name: true,
          },
        },
      },
    });

    const groupedByName = new Map<
      string,
      { dataroomDocumentId: string; documentName: string; folderPath?: string }[]
    >();
    for (const item of namedDataroomDocuments) {
      const current = groupedByName.get(item.document.name) ?? [];
      current.push({
        dataroomDocumentId: item.id,
        documentName: item.document.name,
        folderPath: item.folder?.path,
      });
      groupedByName.set(item.document.name, current);
    }

    for (const [filename, docs] of groupedByName.entries()) {
      if (docs.length === 1) {
        uniqueFilenameToDocument.set(filename, docs[0]);
      }
    }
  }

  const references: ResolvedReference[] = [];
  const seen = new Set<string>();

  for (const citation of citations) {
    const mappedByFileId = citation.fileId
      ? fileIdToDocument.get(citation.fileId)
      : undefined;
    const mappedByFilename = citation.filename
      ? uniqueFilenameToDocument.get(citation.filename)
      : undefined;

    const mapped = mappedByFileId ?? mappedByFilename;
    if (!mapped) continue;

    const dedupeKey = `${mapped.dataroomDocumentId}:${citation.page ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    references.push({
      dataroomDocumentId: mapped.dataroomDocumentId,
      documentName: mapped.documentName,
      url: `${viewerBasePath}/d/${mapped.dataroomDocumentId}${
        citation.page ? `?p=${citation.page}` : ""
      }`,
      page: citation.page,
      folderPath: mapped.folderPath,
    });
  }

  return references;
}

function buildReferencesSection(references: ResolvedReference[]): string {
  const lines = ["", "", "References", ""];

  if (references.length === 0) {
    lines.push("- None");
    return lines.join("\n");
  }

  for (const reference of references) {
    const documentLabel = escapeMarkdownLinkText(reference.documentName);
    const pageSuffix = reference.page ? ` - p. ${reference.page}` : "";
    lines.push(`- [${documentLabel}](${reference.url})${pageSuffix}`);
  }

  return lines.join("\n");
}

async function generateSuggestedQuestions(
  userQuestion: string,
  assistantResponse: string,
): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      maxOutputTokens: 200,
      messages: [
        {
          role: "system",
          content:
            "Generate exactly 3 concise follow-up questions a user might ask based on this conversation. Output only the questions, one per line. No numbering, no bullets, no prefixes.",
        },
        {
          role: "user",
          content: `User asked: "${userQuestion}"\n\nAssistant answered: "${assistantResponse.slice(0, 500)}"`,
        },
      ],
    });

    return text
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && q.endsWith("?"))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function buildStreamMetadataTail(
  references: ResolvedReference[],
  suggestedQuestions: string[],
): string {
  const metadata: ChatStreamMetadata = {
    sources: references.map((ref, idx) => ({
      id: `D-${idx + 1}`,
      name: ref.documentName,
      url: ref.url,
      dataroomDocumentId: ref.dataroomDocumentId,
      page: ref.page,
      folderPath: ref.folderPath,
    })),
    suggestedQuestions,
  };
  return `${CHAT_METADATA_PREFIX}${JSON.stringify(metadata)}${CHAT_METADATA_SUFFIX}`;
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
  dataroomId,
  linkId,
}: SendMessageOptions) {
  // Get conversation history from database
  const history = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const hasPriorAssistantReply = history.some((m) => m.role === "assistant");
  const reasoningEffort = "minimal";
  const maxOutputTokens = hasPriorAssistantReply ? 420 : 220;

  // Save user message
  await prisma.chatMessage.create({
    data: { chatId, role: "user", content },
  });

  let resolveReferencesForStream: (value: string) => void = () => {};
  const referencesForStream = new Promise<string>((resolve) => {
    resolveReferencesForStream = resolve;
  });

  // Build messages for AI SDK
  const messages = [
    {
      role: "system" as const,
      content: `You are a helpful AI assistant answering questions about documents.
Use the file_search tool to find relevant information from the documents.
Always cite sources with document names and page numbers when providing information.
Do not include a "References" section in your answer. References are appended automatically by the system.
Keep answers concise, direct, and non-repetitive.
Start with the direct answer in the first sentence.
Default format: 1 short paragraph or up to 2 bullets.
Avoid long document lists unless the user explicitly asks for a full list.
Only mention documents that are directly needed for the user's question.
${
  !hasPriorAssistantReply
    ? `This is the first assistant reply in the conversation.
Prioritize speed:
- Start with a direct answer in 1-2 sentences.
- Add at most 2 short bullets only if needed.
- Keep it under 80 words before references.
If deeper analysis might help, add one short sentence offering a deeper follow-up.`
    : ""
}
If you cannot find the answer in the documents, say so clearly.`,
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content:
        m.role === "assistant"
          ? stripTrailingReferencesSection(m.content)
          : m.content,
    })),
    { role: "user" as const, content },
  ];

  // Build file_search tool options with optional document filter
  const fileSearchOptions: Parameters<typeof openai.tools.fileSearch>[0] = {
    vectorStoreIds: [vectorStoreId],
  };

  const NO_ACCESS_SENTINEL = "__no_access__";
  let effectiveDataroomDocumentIds: string[] | undefined;

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
    if (filteredDataroomDocumentIds !== undefined) {
      // Only include user-selected IDs that are also in the permission-filtered list
      effectiveIds = userSelectedDataroomDocumentIds.filter((id) =>
        filteredDataroomDocumentIds.includes(id),
      );
      // Security: If intersection is empty (user sent unauthorized IDs),
      // fall back to the permission-based filter
      if (effectiveIds.length === 0) {
        effectiveIds = filteredDataroomDocumentIds;
      }
    }
    effectiveDataroomDocumentIds = effectiveIds;
  } else if (filteredDataroomDocumentIds !== undefined) {
    // Permission-restricted dataroom chat scope
    effectiveDataroomDocumentIds = filteredDataroomDocumentIds;
  }

  if (!filterDocumentId && effectiveDataroomDocumentIds !== undefined) {
    if (effectiveDataroomDocumentIds.length > 0) {
      fileSearchOptions.filters = {
        type: "in",
        key: "dataroomDocumentId",
        value: effectiveDataroomDocumentIds,
      };
    } else {
      // Keep retrieval restricted when the viewer has no accessible documents
      // by applying a guaranteed-empty metadata filter.
      fileSearchOptions.filters = {
        type: "eq",
        key: "dataroomDocumentId",
        value: NO_ACCESS_SENTINEL,
      };
    }
  }

  const latestMessage = history.at(0);
  const previousResponseId =
    (latestMessage?.metadata as { responseId?: string } | null)?.responseId ??
    null;

  // Use AI SDK streamText with file_search tool
  const result = streamText({
    model: openai.responses("gpt-4o-mini"),
    maxOutputTokens,
    messages,
    tools: {
      file_search: openai.tools.fileSearch(fileSearchOptions),
    },
    providerOptions: {
      openai: {
        previousResponseId,
      } as OpenAIResponsesProviderOptions,
    },
    onFinish: async ({ text, usage, response }) => {
      try {
        const shouldAppendReferences = Boolean(dataroomId && linkId);
        const citations = extractFileCitations(response);

        const [resolvedReferences, suggestedQuestions] = await Promise.all([
          resolveReferencesFromCitations({
            dataroomId,
            linkId,
            citations,
            allowedDocumentIds: filteredDataroomDocumentIds,
          }),
          generateSuggestedQuestions(content, text),
        ]);

        const maxReferences = hasPriorAssistantReply ? 6 : 3;
        const limitedReferences = resolvedReferences.slice(0, maxReferences);

        const referencesSection = shouldAppendReferences
          ? buildReferencesSection(limitedReferences)
          : "";

        const strippedText = stripTrailingReferencesSection(text).trim();
        const rawTrimmedText = text.trim();
        const hasRawText = rawTrimmedText.length > 0;
        const resolvedText =
          strippedText ||
          rawTrimmedText ||
          "I couldn't find that in the indexed documents.";

        const metadataTail = buildStreamMetadataTail(
          shouldAppendReferences ? limitedReferences : [],
          suggestedQuestions,
        );

        const streamTail = hasRawText
          ? metadataTail
          : `${resolvedText}${metadataTail}`;

        resolveReferencesForStream(streamTail);

        const finalContent = shouldAppendReferences
          ? `${resolvedText}${referencesSection}`
          : resolvedText;

        await Promise.all([
          prisma.chatMessage.create({
            data: {
              chatId,
              role: "assistant",
              content: finalContent,
              metadata: {
                usage: usage as any,
                vectorStoreId,
                responseId: response.id,
                modelId: response.modelId,
                filters: fileSearchOptions.filters as any,
                ...(shouldAppendReferences && {
                  citations: citations as any,
                  references: limitedReferences as any,
                }),
                suggestedQuestions,
                reasoningEffort,
              },
            },
          }),
          prisma.chat.update({
            where: { id: chatId },
            data: { lastMessageAt: new Date() },
          }),
        ]);
      } catch (error) {
        resolveReferencesForStream("");
        console.error("Error finalizing AI response references:", error);

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
                referenceError:
                  error instanceof Error ? error.message : "Unknown error",
              },
            },
          }),
          prisma.chat.update({
            where: { id: chatId },
            data: { lastMessageAt: new Date() },
          }),
        ]);
      }
    },
  });

  return {
    result,
    referencesForStream,
  };
}
