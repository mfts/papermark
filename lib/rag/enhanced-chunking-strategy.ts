import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
    calculateTokenCount,
    generateLightweightHash,
    cleanTextForChunking,
    generateChunkHash,
    createPageRanges
} from './utils/chunk-utils';
import { TokenCountCache } from './utils/lruCache';
import { RAGError } from './errors';

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
    };
    chunkHash: string;
}
export class EnhancedDocumentChunker {
    private config: ChunkingConfig;
    private textSplitter: RecursiveCharacterTextSplitter;
    private tokenCountCache = new TokenCountCache();
    private readonly headerRegex = /^(#{1,6})\s+(.+)$/;
    private originalPages: string[] = [];
    private totalPages: number = 0;

    constructor(config: Partial<ChunkingConfig> = {}) {
        this.config = {
            chunkSizeTokens: 800,
            chunkOverlapTokens: 150,
            minChunkTokens: 50,
            maxChunkTokens: 5000,
            ...config
        };

        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.chunkSizeTokens,
            chunkOverlap: this.config.chunkOverlapTokens,
            keepSeparator: true,
            lengthFunction: (text: string) => this.getCachedTokenCount(text),
        });
    }

    /**
     * Get cached token count to avoid repeated tokenization
     */
    private getCachedTokenCount(text: string): number {
        const hash = generateLightweightHash(text);
        const cached = this.tokenCountCache.getSync(hash);
        if (cached !== undefined) {
            return cached;
        }

        const count = calculateTokenCount(text);
        this.tokenCountCache.setSync(hash, count);
        return count;
    }

    /**
     * Preserve markdown elements that shouldn't be split
     */
    private preserveMarkdownElements(text: string): string {
        let preservedText = text;

        // 1. Preserve code blocks (```...```)
        preservedText = preservedText.replace(/```[\s\S]*?```/g, (match) => {
            return `\n<PRESERVED_CODE_BLOCK>\n${match}\n</PRESERVED_CODE_BLOCK>\n`;
        });

        // 2. Preserve inline code (`...`)
        preservedText = preservedText.replace(/`([^`]+)`/g, (match) => {
            return `<PRESERVED_INLINE_CODE>${match}</PRESERVED_INLINE_CODE>`;
        });

        // 3. Preserve tables (|...|...|)
        preservedText = preservedText.replace(/(\|.*\|[\r\n]+)+/g, (match) => {
            return `\n<PRESERVED_TABLE>\n${match}\n</PRESERVED_TABLE>\n`;
        });

        // 4. Preserve lists (- * +)
        preservedText = preservedText.replace(/(^[\s]*[-*+]\s+.*[\r\n]+)+/gm, (match) => {
            return `\n<PRESERVED_LIST>\n${match}\n</PRESERVED_LIST>\n`;
        });

        // 5. Preserve numbered lists (1. 2. 3.)
        preservedText = preservedText.replace(/(^[\s]*\d+\.\s+.*[\r\n]+)+/gm, (match) => {
            return `\n<PRESERVED_NUMBERED_LIST>\n${match}\n</PRESERVED_NUMBERED_LIST>\n`;
        });

        // 6. Preserve blockquotes (> ...)
        preservedText = preservedText.replace(/(^[\s]*>.*[\r\n]+)+/gm, (match) => {
            return `\n<PRESERVED_BLOCKQUOTE>\n${match}\n</PRESERVED_BLOCKQUOTE>\n`;
        });

        // 7. Preserve horizontal rules (---, ***, ___)
        preservedText = preservedText.replace(/^[\s]*([-*_]{3,})[\s]*$/gm, (match) => {
            return `\n<PRESERVED_HR>\n${match}\n</PRESERVED_HR>\n`;
        });

        return preservedText;
    }

    /**
     * Restore preserved markdown elements
     */
    private restoreMarkdownElements(text: string): string {
        return text
            .replace(/<PRESERVED_CODE_BLOCK>\n([\s\S]*?)\n<\/PRESERVED_CODE_BLOCK>/g, '$1')
            .replace(/<PRESERVED_INLINE_CODE>([^<]+)<\/PRESERVED_INLINE_CODE>/g, '$1')
            .replace(/<PRESERVED_TABLE>\n([\s\S]*?)\n<\/PRESERVED_TABLE>/g, '$1')
            .replace(/<PRESERVED_LIST>\n([\s\S]*?)\n<\/PRESERVED_LIST>/g, '$1')
            .replace(/<PRESERVED_NUMBERED_LIST>\n([\s\S]*?)\n<\/PRESERVED_NUMBERED_LIST>/g, '$1')
            .replace(/<PRESERVED_BLOCKQUOTE>\n([\s\S]*?)\n<\/PRESERVED_BLOCKQUOTE>/g, '$1')
            .replace(/<PRESERVED_HR>\n([\s\S]*?)\n<\/PRESERVED_HR>/g, '$1');
    }

    /**
     * Analyze content complexity without using embeddings
     */
    private analyzeContentComplexity(text: string): {
        complexity: 'low' | 'medium' | 'high';
        factors: {
            technicalTerms: number;
            codeBlocks: number;
            tables: number;
            lists: number;
            longSentences: number;
            specialCharacters: number;
        };
    } {
        const factors = {
            technicalTerms: this.countTechnicalTerms(text),
            codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
            tables: (text.match(/\|.*\|/g) || []).length,
            lists: (text.match(/^[\s]*[-*+]\s+/gm) || []).length,
            longSentences: this.countLongSentences(text),
            specialCharacters: this.countSpecialCharacters(text)
        };

        // Calculate complexity score
        let complexityScore = 0;
        if (factors.technicalTerms > 15) complexityScore += 3;
        if (factors.codeBlocks > 2) complexityScore += 2;
        if (factors.tables > 3) complexityScore += 2;
        if (factors.lists > 5) complexityScore += 1;
        if (factors.longSentences > 10) complexityScore += 2;
        if (factors.specialCharacters > 50) complexityScore += 1;

        let complexity: 'low' | 'medium' | 'high';
        if (complexityScore >= 6) complexity = 'high';
        else if (complexityScore >= 3) complexity = 'medium';
        else complexity = 'low';

        return { complexity, factors };
    }

    private countTechnicalTerms(text: string): number {
        // Common technical patterns
        const technicalPatterns = [
            /\b[A-Z]{2,}(?:\.[A-Z]{2,})*\b/g, // Acronyms like API, HTTP, etc.
            /\b\w+\.\w+\(/g, // Function calls like api.get()
            /\b\d+\.\d+\.\d+/g, // Version numbers like 1.2.3
            /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g, // CamelCase terms
            /\b\w+_\w+\b/g, // Snake_case terms
        ];

        let count = 0;
        technicalPatterns.forEach(pattern => {
            count += (text.match(pattern) || []).length;
        });

        return count;
    }

    private countLongSentences(text: string): number {
        const sentences = text.split(/[.!?]+/);
        return sentences.filter(sentence => sentence.trim().length > 100).length;
    }

    private countSpecialCharacters(text: string): number {
        return (text.match(/[{}[\]()<>@#$%^&*+=|\\~`]/g) || []).length;
    }

    /**
     * Adjust chunking strategy based on content complexity
     */
    private adjustChunkingStrategy(complexity: { complexity: 'low' | 'medium' | 'high'; factors: any }): void {
        switch (complexity.complexity) {
            case 'high':
                // Smaller chunks for complex content
                this.config.chunkSizeTokens = Math.min(this.config.chunkSizeTokens, 600);
                this.config.chunkOverlapTokens = Math.min(this.config.chunkOverlapTokens, 100);
                break;
            case 'medium':
                // Standard chunks
                this.config.chunkSizeTokens = 800;
                this.config.chunkOverlapTokens = 150;
                break;
            case 'low':
                // Larger chunks for simple content
                this.config.chunkSizeTokens = Math.min(this.config.chunkSizeTokens, 1200);
                this.config.chunkOverlapTokens = Math.min(this.config.chunkOverlapTokens, 200);
                break;
        }

        // Update text splitter with new config
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.chunkSizeTokens,
            chunkOverlap: this.config.chunkOverlapTokens,
            keepSeparator: true,
            lengthFunction: (text: string) => this.getCachedTokenCount(text),
        });
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
            // Clear cache for new document
            this.tokenCountCache.clear();

            // NEW: Preserve markdown elements before processing
            const preservedText = this.preserveMarkdownElements(text);
            const cleanedText = cleanTextForChunking(preservedText);

            // NEW: Analyze content complexity
            const complexityAnalysis = this.analyzeContentComplexity(text);

            // NEW: Adjust chunking strategy based on complexity
            this.adjustChunkingStrategy(complexityAnalysis);

            this.originalPages = text.split(/---PAGE_BREAK---/);
            this.totalPages = this.originalPages.length;

            // Rename to be honest about what it does
            const headerSegments = this.createHeaderBasedSegments(cleanedText);
            const allChunks: EnhancedChunk[] = [];
            let globalChunkIndex = 0;

            for (const segment of headerSegments) {
                const segmentChunks = await this.processHeaderSegment(
                    segment,
                    globalChunkIndex,
                    { documentId, name, dataroomId, teamId, contentType },
                    this.originalPages,
                    this.totalPages,
                    complexityAnalysis
                );

                allChunks.push(...segmentChunks);
                globalChunkIndex += segmentChunks.length;
            }

            const processedChunks = this.postProcessChunks(allChunks);
            const finalChunks = this.filterAndRenumberChunks(processedChunks);

            // NEW: Restore markdown elements in final chunks
            finalChunks.forEach(chunk => {
                chunk.content = this.restoreMarkdownElements(chunk.content);
            });

            // Log enhanced chunking results
            console.log("Enhanced markdown-aware chunking completed", {
                documentId,
                chunkCount: finalChunks.length,
                complexity: complexityAnalysis.complexity,
                factors: complexityAnalysis.factors
            });

            return finalChunks;

        } catch (error) {
            throw RAGError.create('chunking', `Enhanced chunking failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create header-based segments (renamed from createSemanticSegments)
     */
    private createHeaderBasedSegments(text: string): Array<{
        text: string;
        headerHierarchy: string[];
        sectionHeader: string;
        level: number;
    }> {
        const segments: Array<{
            text: string;
            headerHierarchy: string[];
            sectionHeader: string;
            level: number;
        }> = [];

        const lines = text.split('\n');
        const currentSegmentParts: string[] = [];
        let currentHeaderHierarchy: string[] = [];
        let currentSectionHeader = 'Introduction';
        let currentLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const headerMatch = line.match(this.headerRegex);

            if (headerMatch) {
                if (currentSegmentParts.length > 0) {
                    segments.push({
                        text: currentSegmentParts.join('\n'),
                        headerHierarchy: currentHeaderHierarchy.slice(),
                        sectionHeader: currentSectionHeader,
                        level: currentLevel
                    });
                    currentSegmentParts.length = 0;
                }

                const level = headerMatch[1].length;
                const headerText = headerMatch[2].trim();

                if (level <= currentLevel) {
                    currentHeaderHierarchy.length = level - 1;
                }
                currentHeaderHierarchy[level - 1] = headerText;

                currentSectionHeader = headerText;
                currentLevel = level;
                currentSegmentParts.push(line);
            } else {
                currentSegmentParts.push(line);
            }
        }

        if (currentSegmentParts.length > 0) {
            segments.push({
                text: currentSegmentParts.join('\n'),
                headerHierarchy: currentHeaderHierarchy.slice(),
                sectionHeader: currentSectionHeader,
                level: currentLevel
            });
        }

        return segments;
    }

    /**
     * Process header segment (renamed from processSemanticSegment)
     */
    private async processHeaderSegment(
        segment: {
            text: string;
            headerHierarchy: string[];
            sectionHeader: string;
            level: number;
        },
        startIndex: number,
        params: { documentId: string; name: string; dataroomId: string; teamId: string; contentType: string },
        originalPages: string[],
        totalPages: number,
        complexityAnalysis: any
    ): Promise<EnhancedChunk[]> {
        const segmentTokens = this.getCachedTokenCount(segment.text);
        const chunks: EnhancedChunk[] = [];

        if (segmentTokens >= this.config.minChunkTokens && segmentTokens <= this.config.maxChunkTokens) {
            chunks.push(this.createChunk(
                segment.text,
                startIndex,
                segment.sectionHeader,
                segment.headerHierarchy,
                params,
                originalPages,
                totalPages,
                false,
                complexityAnalysis
            ));
        } else if (segmentTokens > this.config.maxChunkTokens) {
            const subChunks = await this.textSplitter.splitText(segment.text);

            for (let i = 0; i < subChunks.length; i++) {
                const subChunkText = subChunks[i];
                const subChunkTokens = this.getCachedTokenCount(subChunkText);

                if (subChunkTokens >= this.config.minChunkTokens) {
                    chunks.push(this.createChunk(
                        subChunkText,
                        startIndex + i,
                        segment.sectionHeader,
                        segment.headerHierarchy,
                        params,
                        originalPages,
                        totalPages,
                        false,
                        complexityAnalysis
                    ));
                }
            }
        } else if (segmentTokens < this.config.minChunkTokens) {
            chunks.push(this.createChunk(
                segment.text,
                startIndex,
                segment.sectionHeader,
                segment.headerHierarchy,
                params,
                originalPages,
                totalPages,
                true,
                complexityAnalysis
            ));
        }

        return chunks;
    }

    private postProcessChunks(chunks: EnhancedChunk[]): EnhancedChunk[] {
        const processedChunks: EnhancedChunk[] = [];
        let currentChunk: EnhancedChunk | null = null;

        for (const chunk of chunks) {
            const isSmallChunk = chunk.metadata.tokenCount < this.config.minChunkTokens;

            if (isSmallChunk && currentChunk) {
                currentChunk.content += '\n\n' + chunk.content;
                currentChunk.metadata.tokenCount = this.getCachedTokenCount(currentChunk.content);

                const mergedContent = currentChunk.content;
                const pageInfo = this.extractPageNumbersWithContext(mergedContent, this.originalPages, this.totalPages);
                currentChunk.metadata.pageRanges = pageInfo.pageRanges;
            } else {
                if (currentChunk) {
                    processedChunks.push(currentChunk);
                }
                currentChunk = { ...chunk };
            }
        }

        if (currentChunk) {
            processedChunks.push(currentChunk);
        }

        return processedChunks;
    }

    private createChunk(
        content: string,
        chunkIndex: number,
        sectionHeader: string,
        headerHierarchy: string[],
        params: { documentId: string; name: string; dataroomId: string; teamId: string; contentType: string },
        originalPages: string[],
        totalPages: number,
        isSmallChunk: boolean = false,
        complexityAnalysis?: any
    ): EnhancedChunk {
        const tokenCount = this.getCachedTokenCount(content);
        const pageInfo = this.extractPageNumbersWithContext(content, originalPages, totalPages);

        return {
            id: `${params.documentId}_chunk_${chunkIndex}`,
            content: content,
            metadata: {
                contentType: params.contentType,
                chunkIndex,
                documentId: params.documentId,
                dataroomId: params.dataroomId,
                teamId: params.teamId,
                documentName: params.name,
                pageRanges: pageInfo.pageRanges,
                tokenCount,
                sectionHeader,
                headerHierarchy: headerHierarchy.length > 0 ? headerHierarchy : undefined,
                isSmallChunk,
                // NEW: Enhanced metadata
                // contentComplexity: complexityAnalysis?.complexity || 'medium',
                // complexityFactors: complexityAnalysis?.factors || {},
                // hasCodeBlocks: content.includes('```'),
                // hasTables: content.includes('|'),
                // hasLists: /^[\s]*[-*+]\s+/gm.test(content),
                // chunkType: this.determineChunkType(content, sectionHeader),
            },
            chunkHash: generateChunkHash(content, params.documentId, chunkIndex),
        };
    }

    // private determineChunkType(content: string, sectionHeader: string): string {
    //     if (content.includes('```')) return 'code_heavy';
    //     if (content.includes('|') && content.includes('\n')) return 'table_heavy';
    //     if (/^[\s]*[-*+]\s+/gm.test(content)) return 'list_heavy';
    //     if (sectionHeader.toLowerCase().includes('conclusion')) return 'conclusion';
    //     if (sectionHeader.toLowerCase().includes('introduction')) return 'introduction';
    //     return 'content';
    // }

    private extractPageNumbersWithContext(content: string, originalPages: string[], totalPages: number): { pageRanges: string[] } {
        try {
            if (!content || originalPages.length === 0) return { pageRanges: ['1'] };

            const cleanContent = content.trim().replace(/\s+/g, ' ').toLowerCase();

            // Find which pages this chunk content appears in
            const pageNumbers: number[] = [];
            const contentWords = cleanContent.split(' ').filter(word => word.length > 3);
            const pageScores: { pageIndex: number; score: number; uniqueWords: number }[] = [];

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

    private filterAndRenumberChunks(chunks: EnhancedChunk[]): EnhancedChunk[] {
        return chunks
            .filter(chunk =>
                chunk.content &&
                chunk.content.trim().length > 0 &&
                chunk.metadata.tokenCount >= this.config.minChunkTokens
            )
            .map((chunk, index) => {
                chunk.metadata.chunkIndex = index;
                chunk.id = `${chunk.metadata.documentId}_chunk_${index}`;
                return chunk;
            });
    }
}