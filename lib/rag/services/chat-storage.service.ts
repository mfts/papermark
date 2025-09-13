import prisma from "@/lib/prisma";
import { RAGError } from "../errors/rag-errors";

export interface ChatMessageMetadata {
    id?: string;
    queryType?: string;
    intent?: string;
    complexityLevel?: string;
    searchStrategy?: string;
    strategyConfidence?: number;
    queryAnalysisTime?: number;
    searchTime?: number;
    responseTime?: number;
    totalTime?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    chunkIds?: string[];
    documentIds?: string[];
    pageRanges?: string[];
    compressionStrategy?: string;
    originalContextSize?: number;
    compressedContextSize?: number;
    errorType?: string;
    errorMessage?: string;
    isRetryable?: boolean;
}

export interface ChatSessionData {
    dataroomId: string;
    linkId: string;
    viewerId: string;
    title?: string;
}

export interface ChatMessageData {
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    metadata?: ChatMessageMetadata;
}

const transformMetadata = (metadata: any) => {
    if (!metadata) return undefined;

    return {
        id: metadata.id,
        queryType: metadata.queryType || undefined,
        intent: metadata.intent || undefined,
        complexityLevel: metadata.complexityLevel || undefined,
        searchStrategy: metadata.searchStrategy || undefined,
        strategyConfidence: metadata.strategyConfidence || undefined,
        queryAnalysisTime: metadata.queryAnalysisTime || undefined,
        searchTime: metadata.searchTime || undefined,
        responseTime: metadata.responseTime || undefined,
        totalTime: metadata.totalTime || undefined,
        inputTokens: metadata.inputTokens || undefined,
        outputTokens: metadata.outputTokens || undefined,
        totalTokens: metadata.totalTokens || undefined,
        chunkIds: metadata.chunkIds || undefined,
        documentIds: metadata.documentIds || undefined,
        pageRanges: metadata.pageRanges || undefined,
        compressionStrategy: metadata.compressionStrategy || undefined,
        originalContextSize: metadata.originalContextSize || undefined,
        compressedContextSize: metadata.compressedContextSize || undefined,
        errorType: metadata.errorType || undefined,
        errorMessage: metadata.errorMessage || undefined,
        isRetryable: metadata.isRetryable || undefined,
    };
};

export class ChatStorageService {
    async getOrCreateSession(data: ChatSessionData, sessionId?: string): Promise<string> {
        return RAGError.withErrorHandling(
            async () => {
                if (sessionId) {
                    const existingSession = await prisma.rAGChatSession.findUnique({
                        where: {
                            id: sessionId,
                        },
                        select: {
                            id: true,
                            dataroomId: true,
                            linkId: true,
                            viewerId: true,
                        },
                    });
                    if (existingSession &&
                        existingSession.dataroomId === data.dataroomId &&
                        existingSession.linkId === data.linkId &&
                        existingSession.viewerId === data.viewerId) {
                        return existingSession.id;
                    }
                }

                const session = await prisma.rAGChatSession.create({
                    data: {
                        dataroomId: data.dataroomId,
                        linkId: data.linkId,
                        viewerId: data.viewerId,
                        title: data.title || this.generateSessionTitle(),
                    },
                    select: { id: true },
                });

                return session.id;
            },
            'chatStorage',
            { operation: 'getOrCreateSession', dataroomId: data.dataroomId, linkId: data.linkId, viewerId: data.viewerId }
        );
    }

    async addMessage(data: ChatMessageData): Promise<string> {
        return RAGError.withErrorHandling(
            async () => {
                const result = await prisma.$transaction(async (tx) => {
                    const message = await tx.rAGChatMessage.create({
                        data: {
                            sessionId: data.sessionId,
                            role: data.role,
                            content: data.content,
                            metadata: data.metadata ? {
                                create: {
                                    ...data.metadata,
                                }
                            } : undefined,
                        },
                        select: { id: true },
                    });

                    await tx.rAGChatSession.update({
                        where: { id: data.sessionId },
                        data: { updatedAt: new Date() },
                    });

                    return message.id;
                });

                return result;
            },
            'chatStorage',
            { operation: 'addMessage', sessionId: data.sessionId, role: data.role }
        );
    }


    async getSessionMessages(options: {
        sessionId: string;
        dataroomId: string;
        linkId: string;
        viewerId: string;
    }) {
        const { sessionId, dataroomId, linkId, viewerId } = options;

        return RAGError.withErrorHandling(
            async () => {
                const session = await prisma.rAGChatSession.findFirst({
                    where: {
                        id: sessionId,
                        dataroomId,
                        linkId,
                        viewerId,
                    },
                    select: { id: true },
                });

                if (!session) {
                    throw new Error('Session not found or access denied');
                }

                const messages = await prisma.rAGChatMessage.findMany({
                    where: { sessionId },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        metadata: true,
                    },
                });

                return {
                    sessionId,
                    messages: messages.map((message) => ({
                        id: message.id,
                        role: message.role as 'user' | 'assistant',
                        content: message.content,
                        createdAt: message.createdAt.toISOString(),
                        metadata: transformMetadata(message.metadata),
                    })),
                };
            },
            'chatStorage',
            { operation: 'getSessionMessages', sessionId, dataroomId, linkId, viewerId }
        );
    }

    async getSessionsPaginated(options: {
        dataroomId: string;
        linkId: string;
        viewerId: string;
        page?: number;
        limit?: number;
        cursor?: string;
    }) {
        const { dataroomId, linkId, viewerId, page = 1, limit = 20, cursor } = options;

        return RAGError.withErrorHandling(
            async () => {
                const baseWhere = { dataroomId, linkId, viewerId };
                const where = {
                    ...baseWhere,
                    ...(cursor && {
                        updatedAt: {
                            lt: new Date(cursor)
                        }
                    })
                };

                const [sessions, total] = await Promise.all([
                    prisma.rAGChatSession.findMany({
                        where,
                        orderBy: { updatedAt: 'desc' },
                        take: limit,
                        select: {
                            id: true,
                            title: true,
                            createdAt: true,
                            updatedAt: true,
                            _count: {
                                select: {
                                    messages: true
                                }
                            },
                            messages: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                select: {
                                    content: true,
                                    role: true,
                                    createdAt: true,
                                }
                            }
                        },
                    }),
                    prisma.rAGChatSession.count({ where: baseWhere }),
                ]);

                const transformedSessions = sessions.map((session) => ({
                    id: session.id,
                    title: session.title,
                    createdAt: session.createdAt.toISOString(),
                    updatedAt: session.updatedAt.toISOString(),
                    messageCount: session._count.messages,
                    lastMessage: session.messages[0] ? {
                        content: session.messages[0].content,
                        role: session.messages[0].role,
                        createdAt: session.messages[0].createdAt.toISOString(),
                    } : null,
                }));

                const nextCursor = sessions.length === limit && sessions.length > 0
                    ? sessions[sessions.length - 1].updatedAt.toISOString()
                    : null;

                return {
                    sessions: transformedSessions,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: nextCursor !== null,
                        nextCursor,
                    },
                };
            },
            'chatStorage',
            { operation: 'getSessionsPaginated', dataroomId, linkId, viewerId }
        );
    }

    private generateSessionTitle(): string {
        const now = new Date();
        return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }
}

export const chatStorageService = new ChatStorageService();
