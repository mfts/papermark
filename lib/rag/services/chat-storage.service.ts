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

export class ChatStorageService {
    /**
     * Create a new chat session
     */
    async createSession(data: ChatSessionData): Promise<string> {
        return RAGError.withErrorHandling(
            async () => {
                const session = await prisma.rAGChatSession.create({
                    data: {
                        dataroomId: data.dataroomId,
                        linkId: data.linkId,
                        viewerId: data.viewerId,
                        title: data.title || this.generateSessionTitle(),
                    },
                });

                // Session created successfully
                return session.id;
            },
            'chatStorage',
            { operation: 'createSession', dataroomId: data.dataroomId, linkId: data.linkId, viewerId: data.viewerId }
        );
    }

    /**
     * Add a message to a chat session
     */
    async addMessage(data: ChatMessageData): Promise<string> {
        return RAGError.withErrorHandling(
            async () => {
                const message = await prisma.rAGChatMessage.create({
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
                });

                await prisma.rAGChatSession.update({
                    where: { id: data.sessionId },
                    data: { updatedAt: new Date() },
                });

                return message.id;
            },
            'chatStorage',
            { operation: 'addMessage', sessionId: data.sessionId, role: data.role }
        );
    }



    async getMessages(
        options: {
            page?: number;
            limit?: number;
            dataroomId: string;
            linkId: string;
            viewerId: string;
        }
    ) {
        const { page = 1, limit = 20, dataroomId, linkId, viewerId } = options;
        const skip = (page - 1) * limit;

        return RAGError.withErrorHandling(
            async () => {
                const sessionWhere = {
                    dataroomId,
                    linkId,
                    viewerId
                };

                const [messages, total] = await Promise.all([
                    prisma.rAGChatMessage.findMany({
                        where: {
                            session: sessionWhere,
                        },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: limit,
                        include: {
                            session: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                            metadata: true,
                        },
                    }),
                    prisma.rAGChatMessage.count({
                        where: {
                            session: sessionWhere,
                        },
                    }),
                ]);

                // Transform messages to include session info
                const transformedMessages = messages.map((message) => ({
                    id: message.id,
                    role: message.role as 'user' | 'assistant',
                    content: message.content,
                    createdAt: message.createdAt.toISOString(),
                    sessionTitle: message.session.title || "Untitled Chat",
                    sessionId: message.session.id,
                    metadata: message.metadata ? {
                        id: message.metadata.id,
                        queryType: message.metadata.queryType || undefined,
                        intent: message.metadata.intent || undefined,
                        complexityLevel: message.metadata.complexityLevel || undefined,
                        searchStrategy: message.metadata.searchStrategy || undefined,
                        strategyConfidence: message.metadata.strategyConfidence || undefined,
                        queryAnalysisTime: message.metadata.queryAnalysisTime || undefined,
                        searchTime: message.metadata.searchTime || undefined,
                        responseTime: message.metadata.responseTime || undefined,
                        totalTime: message.metadata.totalTime || undefined,
                        inputTokens: message.metadata.inputTokens || undefined,
                        outputTokens: message.metadata.outputTokens || undefined,
                        totalTokens: message.metadata.totalTokens || undefined,
                        chunkIds: message.metadata.chunkIds || undefined,
                        documentIds: message.metadata.documentIds || undefined,
                        pageRanges: message.metadata.pageRanges || undefined,
                        compressionStrategy: message.metadata.compressionStrategy || undefined,
                        originalContextSize: message.metadata.originalContextSize || undefined,
                        compressedContextSize: message.metadata.compressedContextSize || undefined,
                        errorType: message.metadata.errorType || undefined,
                        errorMessage: message.metadata.errorMessage || undefined,
                        isRetryable: message.metadata.isRetryable || undefined,
                    } : undefined,
                }));

                return {
                    messages: transformedMessages,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: page * limit < total,
                        hasPrev: page > 1,
                    },
                };
            },
            'chatStorage',
            { operation: 'getMessages', dataroomId, linkId, viewerId }
        );
    }


    private generateSessionTitle(): string {
        const now = new Date();
        return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }
}

export const chatStorageService = new ChatStorageService();
