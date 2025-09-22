import prisma from "@/lib/prisma";
import { RAGError } from "../errors/rag-errors";

export interface ChatMessageMetadata {
    queryType?: string;
    intent?: string;
    complexityLevel?: string;
    complexityScore?: number;
    searchStrategy?: string;
    strategyConfidence?: number;
    strategyReasoning?: string;
    queryAnalysisTime?: number;
    searchTime?: number;
    rerankTime?: number;
    responseTime?: number;
    totalTime?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    contextTokens?: number;
    queryTokens?: number;
    chunkIds?: string[];
    documentIds?: string[];
    pageRanges?: string[];
    totalSearchResults?: number;
    allocatedChunks?: number;
    avgRelevanceScore?: number;
    compressionStrategy?: string;
    originalContextSize?: number;
    compressedContextSize?: number;
    contextEfficiency?: number;
    wasReranked?: boolean;
    rerankThreshold?: number;
    rerankInputCount?: number;
    rerankOutputCount?: number;
    errorType?: string;
    errorMessage?: string;
    isRetryable?: boolean;
    modelUsed?: string;
    temperature?: number;
    toolsEnabled?: boolean;
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


export class ChatStorageService {
    private readonly commonSelects = {
        sessionId: { id: true },
        sessionWithAccess: {
            id: true,
            dataroomId: true,
            linkId: true,
            viewerId: true
        },
        messageBasic: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            metadata: true
        }
    } as const;

    private readonly commonOrderBy = {
        createdAtDesc: { createdAt: 'desc' as const },
        updatedAtDesc: { updatedAt: 'desc' as const }
    } as const;

    private extractCommonParams(options: {
        dataroomId: string;
        linkId: string;
        viewerId: string;
        limit?: number;
        cursor?: string;
    }) {
        const { dataroomId, linkId, viewerId, limit = 20, cursor } = options;
        return { dataroomId, linkId, viewerId, limit, cursor };
    }

    async getOrCreateSession(data: ChatSessionData, sessionId?: string): Promise<string> {
        return RAGError.withErrorHandling(
            async () => {
                if (sessionId) {
                    const existingSession = await prisma.rAGChatSession.findUnique({
                        where: { id: sessionId },
                        select: this.commonSelects.sessionWithAccess,
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
                    select: this.commonSelects.sessionId,
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
                        select: this.commonSelects.sessionId,
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
        limit?: number;
        cursor?: string;
    }) {
        const { sessionId, ...commonParams } = options;
        const { dataroomId, linkId, viewerId, limit, cursor } = this.extractCommonParams(commonParams);

        return RAGError.withErrorHandling(
            async () => {
                const session = await prisma.rAGChatSession.findFirst({
                    where: { id: sessionId, dataroomId, linkId, viewerId },
                    select: this.commonSelects.sessionId,
                });

                if (!session) {
                    throw new Error('Session not found or access denied');
                }

                const whereClause: any = { sessionId };
                if (cursor) {
                    const cursorMessage = await prisma.rAGChatMessage.findUnique({
                        where: { id: cursor },
                        select: { createdAt: true },
                    });

                    if (cursorMessage) {
                        whereClause.createdAt = { lt: cursorMessage.createdAt };
                    }
                }

                const messages = await prisma.rAGChatMessage.findMany({
                    where: whereClause,
                    orderBy: this.commonOrderBy.createdAtDesc,
                    take: limit,
                    select: this.commonSelects.messageBasic,
                });

                return {
                    sessionId,
                    messages: messages.reverse().map((message) => ({
                        id: message.id,
                        role: message.role as 'user' | 'assistant',
                        content: message.content,
                        createdAt: message.createdAt.toISOString(),
                        metadata: message.metadata as ChatMessageMetadata | undefined,
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
        limit?: number;
        cursor?: string;
    }) {
        const { dataroomId, linkId, viewerId, limit, cursor } = this.extractCommonParams(options);

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

                const sessions = await prisma.rAGChatSession.findMany({
                    where,
                    orderBy: this.commonOrderBy.updatedAtDesc,
                    take: limit,
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                        updatedAt: true,
                        messages: {
                            orderBy: this.commonOrderBy.createdAtDesc,
                            take: 1,
                            select: {
                                content: true,
                                role: true,
                                createdAt: true,
                            }
                        }
                    },
                });

                const transformedSessions = sessions.map((session) => ({
                    id: session.id,
                    title: session.title,
                    createdAt: session.createdAt.toISOString(),
                    updatedAt: session.updatedAt.toISOString(),
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
