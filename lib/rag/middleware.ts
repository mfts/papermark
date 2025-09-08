import { NextRequest } from 'next/server';
import { UIMessage } from 'ai';
import { getAccessibleDocumentsForRAG, AccessibleDocument } from './document-permissions';
import { z } from 'zod';
import { RAGError } from './errors';

const RequestBodySchema = z.object({
    messages: z.array(z.any()).min(1, 'Messages array cannot be empty'),
    dataroomId: z.string().min(1, 'Dataroom ID is required'),
    viewerId: z.string().min(1, 'Viewer ID is required'),
    linkId: z.string().min(1, 'Link ID is required'),
});

const PERFORMANCE_CONSTANTS = {
    MAX_DOCUMENTS_PER_REQUEST: 100,
    MAX_FOLDERS_PER_REQUEST: 25
} as const;

const ScopeSchema = z.object({
    docs: z.array(z.string()).optional().default([]),
    folders: z.array(z.string()).optional().default([]),
    folderDocs: z.array(z.string()).optional().default([]),
});



interface TextMessagePart {
    type: 'text';
    text: string;
}

export class RAGMiddleware {
    /**
  * Validate and parse the RAG request
  */
    async validateRequest(req: NextRequest): Promise<{
        messages: UIMessage[];
        dataroomId: string;
        viewerId: string;
        linkId: string;
        query: string;
        selectedDocIds: string[];
        selectedFolderIds: string[];
        folderDocIds: string[];
    }> {
        return RAGError.withErrorHandling(
            async () => {
                const body = await req.json();

                // Step 1: Single comprehensive validation with Zod
                const validatedBody = RequestBodySchema.parse(body);
                const { messages, dataroomId, viewerId, linkId } = validatedBody;

                // Step 2: Fast validation of message structure and query extraction
                const lastMessage = messages[messages.length - 1];
                if (!lastMessage?.role || lastMessage.role !== 'user') {
                    throw RAGError.create('validation', 'Last message must be from user', { field: 'messages' });
                }

                // Step 3: Efficient query extraction with validation
                const textParts = lastMessage.parts?.filter((part: any): part is TextMessagePart =>
                    part.type === 'text' && typeof part.text === 'string'
                ) || [];

                const query = textParts.map((part: TextMessagePart) => part.text).join(' ').trim();
                if (!query || query.length < 1) {
                    throw RAGError.create('validation', 'Query cannot be empty', { field: 'query' });
                }

                // Step 4: Optimized scope parsing with validation
                const metadata = typeof lastMessage.metadata === 'string'
                    ? JSON.parse(lastMessage.metadata)
                    : lastMessage.metadata || {};

                const scope = ScopeSchema.parse(metadata.scope || {});
                const { docs: selectedDocIds, folders: selectedFolderIds, folderDocs: folderDocIds } = scope;

                const totalRequestedDocs = selectedDocIds.length + folderDocIds.length;

                const invalidDocIds = [...selectedDocIds, ...folderDocIds].filter(id =>
                    !id || typeof id !== 'string' || id.trim().length === 0
                );
                if (invalidDocIds.length > 0) {
                    throw RAGError.create('validation', 'Invalid document IDs provided', {
                        field: 'scope',
                        invalidIds: invalidDocIds
                    });
                }

                if (totalRequestedDocs > PERFORMANCE_CONSTANTS.MAX_DOCUMENTS_PER_REQUEST) {
                    throw RAGError.create('validation', `Requested document scope too large (max ${PERFORMANCE_CONSTANTS.MAX_DOCUMENTS_PER_REQUEST} docs)`, {
                        field: 'scope',
                        requestedCount: totalRequestedDocs,
                        maxAllowed: PERFORMANCE_CONSTANTS.MAX_DOCUMENTS_PER_REQUEST
                    });
                }
                if (selectedFolderIds.length > PERFORMANCE_CONSTANTS.MAX_FOLDERS_PER_REQUEST) {
                    throw RAGError.create('validation', `Too many folders requested (max ${PERFORMANCE_CONSTANTS.MAX_FOLDERS_PER_REQUEST})`, {
                        field: 'scope',
                        requestedFolders: selectedFolderIds.length,
                        maxAllowed: PERFORMANCE_CONSTANTS.MAX_FOLDERS_PER_REQUEST
                    });
                }

                return {
                    messages,
                    dataroomId,
                    viewerId,
                    linkId,
                    query,
                    selectedDocIds,
                    selectedFolderIds,
                    folderDocIds
                };
            },
            'requestValidation',
            { service: 'Middleware', operation: 'validateRequest' }
        );
    }

    async getAccessibleIndexedDocuments(
        dataroomId: string,
        viewerId: string,
        scope: { selectedDocIds: string[]; selectedFolderIds: string[]; folderDocIds: string[] }
    ): Promise<{ indexedDocuments: AccessibleDocument[]; accessError?: string }> {
        return RAGError.withErrorHandling(
            async () => {
                const accessibleDocuments = await getAccessibleDocumentsForRAG(dataroomId, viewerId);
                if (!Array.isArray(accessibleDocuments)) {
                    throw RAGError.create('documentAccess', 'Invalid document data structure returned', {
                        dataroomId,
                        viewerId,
                        actualType: typeof accessibleDocuments
                    });
                }

                if (accessibleDocuments.length === 0) {
                    return {
                        indexedDocuments: [],
                        accessError: "No documents are available in this dataroom."
                    };
                }

                const indexedDocuments = accessibleDocuments.filter(doc =>
                    doc && typeof doc === 'object' && doc.isIndexed === true
                );

                if (indexedDocuments.length === 0) {
                    return {
                        indexedDocuments: [],
                        accessError: "No documents are indexed for AI search. Please contact the dataroom owner."
                    };
                }

                const totalRequested = scope.selectedDocIds.length + scope.folderDocIds.length;

                if (totalRequested === 0) {
                    return { indexedDocuments };
                }

                const requestedDocIds = new Set([
                    ...scope.selectedDocIds,
                    ...scope.folderDocIds
                ]);

                const accessibleDocIdsSet = new Set(
                    indexedDocuments
                        .filter(doc => doc.documentId && typeof doc.documentId === 'string')
                        .map(doc => doc.documentId)
                );

                const unauthorizedDocs = Array.from(requestedDocIds).filter(id => !accessibleDocIdsSet.has(id));

                if (unauthorizedDocs.length > 0) {
                    return {
                        indexedDocuments: [],
                        accessError: `You don't have permission to access ${unauthorizedDocs.length} requested document(s).`
                    };
                }

                const filteredDocuments = indexedDocuments.filter(doc => requestedDocIds.has(doc.documentId));

                if (filteredDocuments.length === 0) {
                    return {
                        indexedDocuments: [],
                        accessError: "No documents match your requested scope. Please check your document selection."
                    };
                }

                return { indexedDocuments: filteredDocuments };
            },
            'documentAccess',
            { service: 'Middleware', operation: 'getAccessibleIndexedDocuments', dataroomId, viewerId }
        );
    }
}

export const ragMiddleware = new RAGMiddleware();



