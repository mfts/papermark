import { XSS_PATTERNS, COMPLEXITY_REGEX_PATTERNS } from './constants/patterns';
import { RAGError } from './errors';

const MAX_QUERY_LENGTH = 1000;
const MIN_QUERY_LENGTH = 10;
const COMPLEXITY_THRESHOLD = 2;
const LENGTH_COMPLEXITY_THRESHOLD = 100;

/**
 * Sanitize and validate query input
 */
export function sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
        throw RAGError.create('validation', 'Query must be a non-empty string', { field: 'query' });
    }

    if (query.trim().length === 0) {
        throw RAGError.create('validation', 'Query cannot be empty or whitespace only', { field: 'query' });
    }

    // Remove excessive whitespace and normalize
    let sanitized = query.trim().replace(/\s+/g, ' ');

    // Limit length to prevent abuse
    if (sanitized.length > MAX_QUERY_LENGTH) {
        sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
    }

    // Apply XSS prevention patterns
    sanitized = sanitized
        .replace(XSS_PATTERNS.scriptTags, '')
        .replace(XSS_PATTERNS.eventHandlers, '')
        .replace(XSS_PATTERNS.eventHandlersAlt, '')
        .replace(XSS_PATTERNS.protocols, '')
        .replace(XSS_PATTERNS.dangerousElements, '')
        .replace(XSS_PATTERNS.htmlComments, '')
        .replace(XSS_PATTERNS.nullBytes, '');

    return sanitized;
}

/**
 * Detect query complexity
 */
export function detectQueryComplexity(query: string): boolean {
    if (!query || query.length < MIN_QUERY_LENGTH) return false;

    const matchCount = Object.values(COMPLEXITY_REGEX_PATTERNS).reduce((count, pattern) => {
        return count + (pattern.test(query) ? 1 : 0);
    }, 0);

    return matchCount >= COMPLEXITY_THRESHOLD || query.length > LENGTH_COMPLEXITY_THRESHOLD;
}
