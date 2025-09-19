import prisma from '../prisma';
import { ParsingStatus } from '@prisma/client';
import { LRUCache as NodeLRUCache } from 'lru-cache';
import { RAGError } from './errors/rag-errors';

export interface AccessibleDocument {
    documentId: string;
    documentName: string;
    isIndexed: boolean;
    type: string;
    numPages?: number;
}

// Lazy cache initialization to avoid constructor issues
let dataroomDocumentsCache: NodeLRUCache<string, AccessibleDocument[]> | null = null;
let viewerPermissionsCache: NodeLRUCache<string, Set<string>> | null = null;

function getDataroomDocumentsCache(): NodeLRUCache<string, AccessibleDocument[]> {
    if (!dataroomDocumentsCache) {
        dataroomDocumentsCache = new NodeLRUCache<string, AccessibleDocument[]>({
            max: 200,
            ttl: 15 * 60 * 1000, // 5 minutes
            updateAgeOnGet: true,
            updateAgeOnHas: true,
        });
    }
    return dataroomDocumentsCache;
}

function getViewerPermissionsCache(): NodeLRUCache<string, Set<string>> {
    if (!viewerPermissionsCache) {
        viewerPermissionsCache = new NodeLRUCache<string, Set<string>>({
            max: 100,
            ttl: 15 * 60 * 1000, // 2 minutes
            updateAgeOnGet: true,
            updateAgeOnHas: true,
        });
    }
    return viewerPermissionsCache;
}

export async function getAccessibleDocumentsForRAG(
    dataroomId: string,
    viewerId: string,
): Promise<AccessibleDocument[]> {
    try {
        const cacheKey = `${dataroomId}:${viewerId}`;
        const cached = getDataroomDocumentsCache().get(cacheKey);
        if (cached) {
            console.log('get from cache');
            return cached;
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
            return [];
        }

        const viewerPermissions = await getViewerPermissions(viewer);

        const permissionSet = viewerPermissions instanceof Set ? viewerPermissions : new Set(viewerPermissions)
        const accessibleDocuments = dataroomDocuments.filter((dataroomDoc) => {
            const hasExplicitPermission = permissionSet.has('*') || permissionSet.has(dataroomDoc.documentId);
            const hasDefaultAccess = viewer.groups.length === 0;

            const hasPermission = hasExplicitPermission || hasDefaultAccess;
            return hasPermission;
        });

        const result: AccessibleDocument[] = accessibleDocuments.map((doc) => ({
            documentId: doc.documentId,
            documentName: doc.document.name,
            isIndexed: doc.document.ragIndexingStatus === ParsingStatus.COMPLETED,
            type: doc.document.type || 'pdf',
            numPages: doc.document.numPages || undefined,
        }));

        getDataroomDocumentsCache().set(cacheKey, result);
        return result;
    } catch (error) {
        throw RAGError.create('documentAccess', 'Failed to get accessible documents', { dataroomId, viewerId });
    }
}


async function getViewerPermissions(viewer: any): Promise<Set<string>> {
    console.log('getViewerPermissions', viewer)
    const viewerKey = viewer.id;

    const cached = getViewerPermissionsCache().get(viewerKey);
    if (cached) {
        if (Array.isArray(cached)) {
            return new Set(cached);
        } else if (cached instanceof Set) {
            return cached;
        }
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

    getViewerPermissionsCache().set(viewerKey, accessibleDocumentIds);
    return accessibleDocumentIds;
}
