import { createHash } from 'crypto';

export function generateGradingCacheKey(query: string, documentId: string, content: string): string {
    const combined = `${query.toLowerCase().trim()}:${documentId}:${content.substring(0, 100)}`;
    return createHash('sha256').update(combined).digest('hex');
}


export function generateBatchCacheKey(operation: string, query: string, batchIndex: number): string {
    return `batch:${operation}:${query}:${batchIndex}`;
}

export function generateDocumentNamesCacheKey(documentIds: string[]): string {
    return [...documentIds].sort().join(',');
}
