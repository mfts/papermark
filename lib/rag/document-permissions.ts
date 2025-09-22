import prisma from '../prisma';
import { ParsingStatus } from '@prisma/client';
import { RAGError } from './errors/rag-errors';
import { redis } from '../redis';

export interface AccessibleDocument {
    documentId: string;
    documentName: string;
    isIndexed: boolean;
    type: string;
    numPages?: number;
}

const CACHE_TTL = {
    DATAROOM_DOCUMENTS: 30 * 60, // 30 minutes
    VIEWER_PERMISSIONS: 15 * 60, // 15 minutes
} as const;

const CACHE_KEYS = {
    DATAROOM_DOCUMENTS: (dataroomId: string, viewerId: string) => `rag:dataroom_docs:${dataroomId}:${viewerId}`,
    VIEWER_PERMISSIONS: (viewerId: string) => `rag:viewer_permissions:${viewerId}`,
} as const;

export async function getAccessibleDocumentsForRAG(
    dataroomId: string,
    viewerId: string,
): Promise<AccessibleDocument[]> {
    try {
        const cacheKey = CACHE_KEYS.DATAROOM_DOCUMENTS(dataroomId, viewerId);
        try {
            const cached = await redis.get<AccessibleDocument[]>(cacheKey);
            if (cached) {
                return cached;
            }
        } catch (cacheError) {
            console.warn('Redis cache read failed, proceeding with database query:', cacheError);
        }

        const [viewer, dataroomDocuments] = await Promise.all([
            prisma.viewer.findUnique({
                where: { id: viewerId },
                select: {
                    id: true,
                    email: true,
                    groups: {
                        select: {
                            groupId: true,
                            group: {
                                select: {
                                    id: true,
                                    name: true,
                                    allowAll: true,
                                    accessControls: {
                                        where: {
                                            itemType: 'DATAROOM_DOCUMENT',
                                            canView: true
                                        },
                                        select: {
                                            id: true,
                                            itemId: true,
                                            itemType: true,
                                            canView: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.dataroomDocument.findMany({
                where: {
                    dataroomId,
                    document: {
                        ragIndexingStatus: {
                            in: [ParsingStatus.COMPLETED]
                        }
                    }
                },
                select: {
                    documentId: true,
                    document: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            ragIndexingStatus: true,
                            numPages: true,
                        }
                    },
                },
            })
        ]);

        if (!viewer) {
            console.log('❌ Viewer not found');
            throw RAGError.create('documentAccess', 'Viewer not found', {
                dataroomId,
                viewerId
            });
        }

        const viewerPermissions = await getViewerPermissions(viewer);

        const permissionSet = viewerPermissions instanceof Set ? viewerPermissions : new Set(viewerPermissions)
        const accessibleDocuments = dataroomDocuments.filter((dataroomDoc) => {
            const hasExplicitPermission = permissionSet.has('*') || permissionSet.has(dataroomDoc.documentId);
            const hasDefaultAccess = viewer.groups.length === 0;

            const hasPermission = hasExplicitPermission || hasDefaultAccess;
            return hasPermission;
        });

        const result: AccessibleDocument[] = accessibleDocuments.map((dataroomDoc) => ({
            documentId: dataroomDoc.documentId,
            documentName: dataroomDoc.document.name,
            isIndexed: dataroomDoc.document.ragIndexingStatus === ParsingStatus.COMPLETED,
            type: dataroomDoc.document.type || 'pdf',
            numPages: dataroomDoc.document.numPages || undefined,
        }));
        try {
            await redis.setex(cacheKey, CACHE_TTL.DATAROOM_DOCUMENTS, JSON.stringify(result));
        } catch (cacheError) {
            console.warn('Redis cache write failed:', cacheError);
        }

        return result;
    } catch (error) {
        throw RAGError.create('documentAccess', 'Failed to get accessible documents', {
            dataroomId,
            viewerId,
            error: error instanceof Error ? error.message : String(error)
        }, error instanceof Error ? error : undefined);
    }
}


async function getViewerPermissions(viewer: any): Promise<Set<string>> {
    try {
        const viewerKey = viewer.id;
        const cacheKey = CACHE_KEYS.VIEWER_PERMISSIONS(viewerKey);

        try {
            const cached = await redis.get<string[]>(cacheKey);
            if (cached) {
                return new Set(cached);
            }
        } catch (cacheError) {
            console.warn('Redis cache read failed for viewer permissions, proceeding with database query:', cacheError);
        }

        const accessibleDocumentIds = new Set<string>();

        for (const viewerGroup of viewer.groups) {
            const group = viewerGroup.group;

            if (group.allowAll) {
                accessibleDocumentIds.add('*');
                break;
            }

            for (const control of group.accessControls) {
                if (control.itemType === 'DATAROOM_DOCUMENT' && control.canView) {
                    accessibleDocumentIds.add(control.itemId);
                }
            }
        }

        try {
            await redis.setex(cacheKey, CACHE_TTL.VIEWER_PERMISSIONS, JSON.stringify(Array.from(accessibleDocumentIds)));
        } catch (cacheError) {
            console.warn('Redis cache write failed for viewer permissions:', cacheError);
        }

        return accessibleDocumentIds;
    } catch (error) {
        throw RAGError.create('documentAccess', 'Failed to get viewer permissions', {
            viewerId: viewer.id,
            error: error instanceof Error ? error.message : String(error)
        }, error instanceof Error ? error : undefined);
    }
}