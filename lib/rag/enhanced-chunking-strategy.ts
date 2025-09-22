import {
    calculateTokenCount,
    generateLightweightHash,
    cleanTextForChunking,
    createPageRanges,
    hasMeaningfulContent,
    detectContextualHeaders,
    findActualContentStart,
    findActualContentEnd
} from './utils/chunk-utils';
import { TokenCountCache } from './utils/lruCache';
import { RAGError } from './errors/rag-errors';

interface ChunkingConfig {
    chunkSizeTokens: number;
    chunkOverlapTokens: number;
    minChunkTokens: number;
    maxChunkTokens: number;
}
export interface EnhancedChunk {
    id: string;
    content: string;
    metadata: {
        contentType: string;
        chunkIndex: number;
        documentId: string;
        documentName: string;
        dataroomId: string;
        teamId: string;
        pageRanges?: string[];
        tokenCount: number;
        sectionHeader?: string;
        headerHierarchy?: string[];
        isSmallChunk?: boolean;
        startLine?: number;
        endLine?: number;
    };
    chunkHash: string;
}

export class EnhancedDocumentChunker {
    private config: ChunkingConfig;
    private tokenCountCache = new TokenCountCache();
    private originalPages: string[] = [];
    private totalPages: number = 0;

    constructor(config: Partial<ChunkingConfig> = {}) {
        this.config = {
            chunkSizeTokens: 800,
            chunkOverlapTokens: 0,
            minChunkTokens: 100,
            maxChunkTokens: 1200,
            ...config
        };
    }

    private async getCachedTokenCount(text: string): Promise<number> {
        const hash = generateLightweightHash(text);
        const cached = await this.tokenCountCache.get(hash);
        if (cached !== undefined) {
            return cached;
        }

        const count = calculateTokenCount(text);
        await this.tokenCountCache.set(hash, count);
        return count;
    }

    private extractPageNumbersWithContext(cleanedContent: string, originalPages: string[], totalPages: number, originalText: string): { pageRanges: string[] } {
        try {
            if (!cleanedContent || originalPages.length === 0) {
                return { pageRanges: ['1'] };
            }

            const cleanContent = cleanedContent.trim().replace(/\s+/g, ' ').toLowerCase();

            // Find which pages this chunk content appears in
            const pageNumbers: number[] = [];
            const contentWords = cleanContent.split(' ').filter(word => word.length > 3);
            const pageScores: Array<{ pageIndex: number; score: number; uniqueWords: number }> = [];

            for (let i = 0; i < originalPages.length; i++) {
                const pageContent = originalPages[i].trim().replace(/\s+/g, ' ').toLowerCase();
                let matchCount = 0;
                const matchedWords: string[] = [];

                for (const word of contentWords) {
                    if (pageContent.includes(word)) {
                        matchCount++;
                        matchedWords.push(word);
                    }
                }

                const matchPercentage = matchCount / contentWords.length;
                const uniqueWords = new Set(matchedWords).size;

                pageScores.push({
                    pageIndex: i + 1,
                    score: matchPercentage,
                    uniqueWords
                });
            }

            pageScores.sort((a, b) => b.score - a.score);
            const bestMatch = pageScores[0];

            if (bestMatch.score > 0.25 && bestMatch.uniqueWords >= 3) {
                pageNumbers.push(bestMatch.pageIndex);
            } else if (bestMatch.score > 0.15 && bestMatch.uniqueWords >= 2) {
                pageNumbers.push(bestMatch.pageIndex);
            }

            if (pageNumbers.length === 0) {
                return { pageRanges: ['1'] };
            }

            const pageRanges = createPageRanges(pageNumbers);
            return { pageRanges };
        } catch (error) {
            return { pageRanges: ['1'] };
        }
    }

    private detectHeaders(text: string) {
        const headers: Array<{
            line: number;
            level: number;
            text: string;
            type: string;
            fullLine: string;
            id?: string;
        }> = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];


            const markdownMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (markdownMatch) {
                headers.push({
                    line: i,
                    level: markdownMatch[1].length,
                    text: markdownMatch[2].trim(),
                    type: 'markdown',
                    fullLine: line
                });
                continue;
            }

            const htmlWithIdMatch = line.match(/<h([1-6])[^>]*id="([^"]*)"[^>]*>(.+?)<\/h[1-6]>/i);
            if (htmlWithIdMatch) {
                headers.push({
                    line: i,
                    level: parseInt(htmlWithIdMatch[1]),
                    text: htmlWithIdMatch[3].trim(),
                    id: htmlWithIdMatch[2],
                    type: 'html',
                    fullLine: line
                });
                continue;
            }

            const htmlMatch = line.match(/<h([1-6])[^>]*>(.+?)<\/h[1-6]>/i);
            if (htmlMatch) {
                headers.push({
                    line: i,
                    level: parseInt(htmlMatch[1]),
                    text: htmlMatch[2].trim(),
                    type: 'html',
                    fullLine: line
                });
                continue;
            }

            if (i < lines.length - 1) {
                const nextLine = lines[i + 1];
                if (nextLine.match(/^={3,}$/)) {
                    headers.push({
                        line: i,
                        level: 1,
                        text: line.trim(),
                        type: 'setext',
                        fullLine: line
                    });
                    i++;
                    continue;
                }
                if (nextLine.match(/^-{3,}$/)) {
                    headers.push({
                        line: i,
                        level: 2,
                        text: line.trim(),
                        type: 'setext',
                        fullLine: line
                    });
                    i++;
                    continue;
                }
            }
        }

        return headers;
    }

    private buildHeaderHierarchy(headers: any[]): string[] {
        const hierarchy: string[] = [];
        const stack: any[] = [];

        for (const header of headers) {

            while (stack.length > 0 && stack[stack.length - 1].level >= header.level) {
                stack.pop();
            }


            while (hierarchy.length < header.level) {
                hierarchy.push('');
            }
            hierarchy[header.level - 1] = header.text;

            stack.push(header);
        }

        return hierarchy;
    }


    private analyzeContentComplexity(text: string) {
        const factors = {
            technicalTerms: (text.match(/\b[A-Z]{2,}(?:\.[A-Z]{2,})*\b/g) || []).length,
            tables: (text.match(/\|.*\|/g) || []).length,
            lists: (text.match(/^[\s]*[-*+]\s+/gm) || []).length,
            longSentences: text.split(/[.!?]+/).filter(s => s.trim().length > 120).length,
            specialCharacters: (text.match(/[{}[\]()<>@#$%^&*+=|\\~`]/g) || []).length,
            numbers: (text.match(/\b\d+[\d,]*\b/g) || []).length
        };

        let complexityScore = 0;
        if (factors.technicalTerms > 20) complexityScore += 4;
        if (factors.tables > 5) complexityScore += 3;
        if (factors.lists > 8) complexityScore += 2;
        if (factors.longSentences > 15) complexityScore += 2;
        if (factors.specialCharacters > 80) complexityScore += 1;
        if (factors.numbers > 100) complexityScore += 2;

        let complexity: 'low' | 'medium' | 'high';
        if (complexityScore >= 8) complexity = 'high';
        else if (complexityScore >= 4) complexity = 'medium';
        else complexity = 'low';

        return { complexity, factors };
    }

    private createSemanticSegments(text: string, headers: any[]) {
        const segments: any[] = [];
        const lines = text.split('\n');
        const sortedHeaders = headers.sort((a, b) => a.line - b.line);

        let currentSegment: {
            content: string[];
            headerText: string;
            headerHierarchy: string[];
            startLine: number;
            actualStartLine: number;
            actualEndLine: number;
        } = {
            content: [],
            headerText: 'Introduction',
            headerHierarchy: [],
            startLine: 0,
            actualStartLine: 0,
            actualEndLine: 0
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const header = sortedHeaders.find(h => h.line === i);

            if (header) {

                if (currentSegment.content.length > 0) {
                    const contentText = currentSegment.content.join('\n');
                    const actualStart = findActualContentStart(contentText, currentSegment.startLine, lines);
                    const actualEnd = findActualContentEnd(contentText, currentSegment.startLine, lines);


                    if (hasMeaningfulContent(contentText)) {
                        segments.push({
                            ...currentSegment,
                            content: contentText,
                            endLine: i - 1,
                            actualStartLine: actualStart,
                            actualEndLine: actualEnd
                        });
                    }
                }


                const hierarchy = this.buildHeaderHierarchy(
                    sortedHeaders.filter(h => h.line <= i)
                );

                const contextualHeader = detectContextualHeaders(text, i, hierarchy[hierarchy.length - 2]);

                currentSegment = {
                    content: [line],
                    headerText: contextualHeader,
                    headerHierarchy: hierarchy,
                    startLine: i,
                    actualStartLine: i,
                    actualEndLine: i
                };
            } else {
                currentSegment.content.push(line);
            }
        }


        if (currentSegment.content.length > 0) {
            const contentText = currentSegment.content.join('\n');
            const actualStart = findActualContentStart(contentText, currentSegment.startLine, lines);
            const actualEnd = findActualContentEnd(contentText, currentSegment.startLine, lines);

            if (hasMeaningfulContent(contentText)) {
                segments.push({
                    ...currentSegment,
                    content: contentText,
                    endLine: lines.length - 1,
                    actualStartLine: actualStart,
                    actualEndLine: actualEnd
                });
            }
        }

        return segments;
    }


    private async splitContentProperly(content: string, maxTokens: number, overlapTokens: number = 0, documentType: string = 'financial'): Promise<string[]> {
        const chunks: string[] = [];
        const paragraphs = content.split(/\n\s*\n/);
        let currentChunk: string[] = [];
        let currentTokens = 0;


        let effectiveMaxTokens = maxTokens;
        if (documentType === 'financial') {
            if (content.includes('|') && content.includes('crore')) {
                effectiveMaxTokens = Math.min(maxTokens * 1.5, 2000);
            } else if (content.includes('Notes:') || content.includes('Refer to')) {
                effectiveMaxTokens = Math.max(maxTokens * 0.7, 300);
            }
        }

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const paragraphTokens = await this.getCachedTokenCount(paragraph);


            if (currentTokens + paragraphTokens > effectiveMaxTokens && currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n\n'));

                currentChunk = [paragraph];
                currentTokens = paragraphTokens;
            } else {
                currentChunk.push(paragraph);
                currentTokens += paragraphTokens;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n\n'));
        }

        return chunks;
    }

    private deduplicateChunks(chunks: EnhancedChunk[]): EnhancedChunk[] {
        const seenHashes = new Set<string>();
        const uniqueChunks: EnhancedChunk[] = [];

        for (const chunk of chunks) {
            if (!seenHashes.has(chunk.chunkHash)) {
                seenHashes.add(chunk.chunkHash);
                uniqueChunks.push(chunk);
            }
        }

        return uniqueChunks;
    }

    private async mergeSmallChunks(chunks: EnhancedChunk[], minTokens: number = 100): Promise<EnhancedChunk[]> {
        const mergedChunks: EnhancedChunk[] = [];
        let i = 0;

        while (i < chunks.length) {
            const currentChunk = chunks[i];

            if (currentChunk.metadata.tokenCount < minTokens && i + 1 < chunks.length) {
                const nextChunk = chunks[i + 1];
                const mergedContent = currentChunk.content + '\n\n' + nextChunk.content;
                const mergedTokens = await this.getCachedTokenCount(mergedContent);

                if (mergedTokens <= this.config.maxChunkTokens) {
                    const mergedChunk: EnhancedChunk = {
                        ...nextChunk,
                        content: mergedContent,
                        metadata: {
                            ...nextChunk.metadata,
                            tokenCount: mergedTokens,
                            sectionHeader: `${currentChunk.metadata.sectionHeader} + ${nextChunk.metadata.sectionHeader}`,
                            isSmallChunk: false
                        },
                        chunkHash: generateLightweightHash(mergedContent + nextChunk.id)
                    };

                    mergedChunks.push(mergedChunk);
                    i += 2; // Skip both chunks
                    continue;
                }
            }

            mergedChunks.push(currentChunk);
            i++;
        }

        return mergedChunks;
    }

    private async handleEmptyChunks(chunks: EnhancedChunk[]): Promise<EnhancedChunk[]> {
        const processedChunks: EnhancedChunk[] = [];
        let i = 0;

        while (i < chunks.length) {
            const currentChunk = chunks[i];

            if (currentChunk.metadata.tokenCount < 50 &&
                !hasMeaningfulContent(currentChunk.content)) {

                if (i + 1 < chunks.length) {
                    const nextChunk = chunks[i + 1];
                    const mergedContent = currentChunk.content + '\n\n' + nextChunk.content;
                    const mergedTokens = await this.getCachedTokenCount(mergedContent);

                    processedChunks.push({
                        ...nextChunk,
                        content: mergedContent,
                        metadata: {
                            ...nextChunk.metadata,
                            tokenCount: mergedTokens,
                            sectionHeader: `${currentChunk.metadata.sectionHeader} + ${nextChunk.metadata.sectionHeader}`,
                            isSmallChunk: false
                        },
                        chunkHash: generateLightweightHash(mergedContent + nextChunk.id)
                    });

                    i += 2; // Skip both chunks
                    continue;
                }
                else if (processedChunks.length > 0) {
                    const prevChunk = processedChunks[processedChunks.length - 1];
                    const mergedContent = prevChunk.content + '\n\n' + currentChunk.content;
                    const mergedTokens = await this.getCachedTokenCount(mergedContent);

                    processedChunks[processedChunks.length - 1] = {
                        ...prevChunk,
                        content: mergedContent,
                        metadata: {
                            ...prevChunk.metadata,
                            tokenCount: mergedTokens,
                            sectionHeader: `${prevChunk.metadata.sectionHeader} + ${currentChunk.metadata.sectionHeader}`,
                            isSmallChunk: false
                        },
                        chunkHash: generateLightweightHash(mergedContent + prevChunk.id)
                    };

                    i++;
                    continue;
                }
            }

            processedChunks.push(currentChunk);
            i++;
        }

        return processedChunks;
    }

    private async postProcessChunks(chunks: EnhancedChunk[]): Promise<EnhancedChunk[]> {

        const deduplicatedChunks = this.deduplicateChunks(chunks);

        const mergedChunks = await this.mergeSmallChunks(deduplicatedChunks, this.config.minChunkTokens);

        const finalChunks = await this.handleEmptyChunks(mergedChunks);

        return finalChunks;
    }

    public async createEnhancedChunks(
        text: string,
        documentId: string,
        name: string,
        dataroomId: string,
        teamId: string,
        contentType: string = "document",
    ): Promise<EnhancedChunk[]> {
        if (!text || typeof text !== 'string') {
            throw RAGError.create('chunking', 'Text content is required and must be a string');
        }

        try {
            this.tokenCountCache.clear();

            const cleanedText = cleanTextForChunking(text);

            this.originalPages = text.split(/---PAGE_BREAK---/);
            this.totalPages = this.originalPages.length;

            const headers = this.detectHeaders(cleanedText);

            const complexityAnalysis = this.analyzeContentComplexity(cleanedText);

            const config = {
                chunkSizeTokens: 800,
                chunkOverlapTokens: 0,
                minChunkTokens: 100,
                maxChunkTokens: 1200
            };

            if (complexityAnalysis.complexity === 'high') {
                config.chunkSizeTokens = Math.min(config.chunkSizeTokens, 600);
            } else if (complexityAnalysis.complexity === 'low') {
                config.chunkSizeTokens = Math.max(config.chunkSizeTokens, 1000);
            }
            const semanticSegments = this.createSemanticSegments(cleanedText, headers);
            const allChunks: EnhancedChunk[] = [];
            let globalChunkIndex = 0;

            for (const segment of semanticSegments) {
                const segmentTokens = await this.getCachedTokenCount(segment.content);

                if (segmentTokens >= config.minChunkTokens && segmentTokens <= config.maxChunkTokens) {
                    const pageRangeResult = this.extractPageNumbersWithContext(segment.content, this.originalPages, this.totalPages, text);
                    allChunks.push({
                        id: `${documentId}_chunk_${globalChunkIndex}`,
                        content: segment.content,
                        metadata: {
                            chunkIndex: globalChunkIndex,
                            documentId,
                            documentName: name,
                            dataroomId,
                            teamId,
                            contentType,
                            pageRanges: pageRangeResult.pageRanges,
                            tokenCount: segmentTokens,
                            sectionHeader: segment.headerText,
                            headerHierarchy: segment.headerHierarchy,
                            isSmallChunk: false,
                            startLine: segment.startLine,
                            endLine: segment.endLine
                        },
                        chunkHash: generateLightweightHash(segment.content + documentId + globalChunkIndex)
                    });
                    globalChunkIndex++;
                } else if (segmentTokens > config.maxChunkTokens) {
                    const subChunks = await this.splitContentProperly(segment.content, config.chunkSizeTokens, 0, contentType);

                    for (let i = 0; i < subChunks.length; i++) {
                        const subChunkText = subChunks[i];
                        const subChunkTokens = await this.getCachedTokenCount(subChunkText);

                        if (subChunkTokens >= config.minChunkTokens) {
                            const pageRangeResult = this.extractPageNumbersWithContext(subChunkText, this.originalPages, this.totalPages, text);
                            allChunks.push({
                                id: `${documentId}_chunk_${globalChunkIndex}`,
                                content: subChunkText,
                                metadata: {
                                    chunkIndex: globalChunkIndex,
                                    documentId,
                                    documentName: name,
                                    dataroomId,
                                    teamId,
                                    contentType,
                                    pageRanges: pageRangeResult.pageRanges,
                                    tokenCount: subChunkTokens,
                                    sectionHeader: segment.headerText,
                                    headerHierarchy: segment.headerHierarchy,
                                    isSmallChunk: false,
                                    startLine: segment.actualStartLine || segment.startLine,
                                    endLine: segment.actualEndLine || segment.endLine
                                },
                                chunkHash: generateLightweightHash(subChunkText + documentId + globalChunkIndex)
                            });
                            globalChunkIndex++;
                        }
                    }
                } else {
                    const pageRangeResult = this.extractPageNumbersWithContext(segment.content, this.originalPages, this.totalPages, text);
                    allChunks.push({
                        id: `${documentId}_chunk_${globalChunkIndex}`,
                        content: segment.content,
                        metadata: {
                            chunkIndex: globalChunkIndex,
                            documentId,
                            documentName: name,
                            dataroomId,
                            teamId,
                            contentType,
                            pageRanges: pageRangeResult.pageRanges,
                            tokenCount: segmentTokens,
                            sectionHeader: segment.headerText,
                            headerHierarchy: segment.headerHierarchy,
                            isSmallChunk: true,
                            startLine: segment.startLine,
                            endLine: segment.endLine
                        },
                        chunkHash: generateLightweightHash(segment.content + documentId + globalChunkIndex)
                    });
                    globalChunkIndex++;
                }
            }

            const processedChunks = await this.postProcessChunks(allChunks);

            return processedChunks;

        } catch (error) {
            throw RAGError.create('chunking', `Failed to create enhanced chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
