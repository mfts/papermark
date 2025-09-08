import { SearchResult, CompressionConfig, CompressedContext, Span } from '../types/rag-types';
import { RAGError } from '../errors';
import { generateLLMResponse } from '../utils/llm-utils';
import { configurationManager } from '../config';
import { PROMPT_IDS } from '../prompts';
import { calculateTokenCount } from '../utils/chunk-utils';

interface CompressionPolicy {
    compression_strategy: 'RankedCompression' | 'HybridCompression' | 'RAPTORCompression';
    reason: string;
}

interface RAPTORNode {
    title: string;
    content: string;
    relevanceScore: number;
    compressionAction: 'preserve' | 'compress' | 'remove';
    children?: RAPTORNode[];
    sourceChunkIds: string[];
}

interface RAPTORTree {
    rootNode: RAPTORNode;
    branches: RAPTORNode[];
    compressionStrategy: string;
    estimatedCompressionRatio: number;
}

interface RAPTORDocumentSummary {
    summary: string;
    keyPoints: string[];
    relevanceScore: number;
    confidence: number;
}

interface RAPTORHierarchicalSummary {
    mainTopic: string;
    categories: Array<{
        title: string;
        content: string;
        relevanceScore: number;
        sourceDocuments: string[];
    }>;
    overallSummary: string;
    keyInsights: string[];
    confidence: number;
}

interface RAPTORCompressionResult {
    compressedContent: string;
    preservedNodes: string[];
    compressedNodes: string[];
    removedNodes: string[];
    finalCompressionRatio: number;
    informationRetention: number;
}

export class ContextCompressionService {
    private config: CompressionConfig;
    private isDisposed = false;

    constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.config = {
            maxTokens: ragConfig.compression.maxTokens,
            compressionRatio: ragConfig.compression.compressionRatio,
            preserveSpans: ragConfig.compression.preserveSpans,
            method: ragConfig.compression.method
        };
    }

    private selectCompressionStrategy(
        query: string,
        searchResults: SearchResult[],
        tokenBudget: number = 10000,
        complexityAnalysis?: {
            complexityScore: number;
            wordCount: number;
        }
    ): CompressionPolicy {
        const queryLength = query.split(/\s+/).length;
        const totalContentLength = searchResults.reduce((sum, result) => sum + result.content.length, 0);
        const estimatedTokens = this.estimateTokenCount(searchResults.map(r => r.content).join(''));
        const documentCount = new Set(searchResults.map(r => r.documentId)).size;

        // Use passed complexity analysis or fallback to simple analysis
        let complexityScore = 0.5;
        let isMultiHop = false;
        let isResearchStyle = false;

        if (complexityAnalysis) {
            complexityScore = complexityAnalysis.complexityScore;
            isResearchStyle = complexityAnalysis.wordCount > 20;
        } else {
            // Fallback to simple pattern matching
            complexityScore = 0.5; // Default medium complexity
            isMultiHop = query.toLowerCase().includes('compare') || query.toLowerCase().includes('analyze');
            isResearchStyle = query.toLowerCase().includes('research') || query.toLowerCase().includes('study');
        }

        // Check if retrieved context exceeds token budget
        const exceedsTokenBudget = estimatedTokens > tokenBudget * 0.8; // 80% threshold

        // Check retrieval confidence (based on similarity scores)
        const avgSimilarity = searchResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / searchResults.length;
        const lowConfidence = avgSimilarity < 0.6;

        // Enhanced Decision Logic with content analysis
        if (exceedsTokenBudget) {
            return {
                compression_strategy: 'RAPTORCompression',
                reason: `Retrieved context (${estimatedTokens} tokens) exceeds token budget (${tokenBudget}). Using RAPTOR for document-level summarization.`
            };
        }

        if ((isMultiHop || isResearchStyle || queryLength > 30) && documentCount > 1) {
            return {
                compression_strategy: 'RAPTORCompression',
                reason: `Complex multi-document query: ${queryLength} words, ${documentCount} documents, multi-hop: ${isMultiHop}, research-style: ${isResearchStyle}. Using RAPTOR for comprehensive document-level summarization.`
            };
        }


        if (totalContentLength > 50000 && documentCount > 1) { // 50KB threshold
            return {
                compression_strategy: 'RAPTORCompression',
                reason: `Large multi-document content (${totalContentLength} chars, ${documentCount} documents). Using RAPTOR for efficient document-level compression.`
            };
        }

        if (isMultiHop || isResearchStyle || queryLength > 30) {
            return {
                compression_strategy: 'RAPTORCompression',
                reason: `Complex query detected: ${queryLength} words, multi-hop: ${isMultiHop}, research-style: ${isResearchStyle}. Using RAPTOR for comprehensive summarization.`
            };
        }

        // Prefer hybrid for multi-document moderate complexity
        if ((queryLength >= 15 || complexityScore > 0.6) && documentCount > 1) {
            return {
                compression_strategy: 'HybridCompression',
                reason: `Moderately complex multi-document query: ${queryLength} words, ${documentCount} documents, complexity score: ${complexityScore.toFixed(2)}. Using hybrid approach for balanced multi-document compression.`
            };
        }

        if (queryLength >= 15 || complexityScore > 0.6) {
            return {
                compression_strategy: 'HybridCompression',
                reason: `Moderately complex query: ${queryLength} words, complexity score: ${complexityScore.toFixed(2)}. Using hybrid approach for balanced compression.`
            };
        }

        if (lowConfidence) {
            return {
                compression_strategy: 'HybridCompression',
                reason: `Low retrieval confidence (${avgSimilarity.toFixed(2)}). Using hybrid approach to maximize coverage.`
            };
        }

        return {
            compression_strategy: 'RankedCompression',
            reason: `Simple query: ${queryLength} words, complexity score: ${complexityScore.toFixed(2)}. Using fast ranked compression.`
        };
    }





    async compressContext(
        searchResults: SearchResult[],
        query: string,
        signal?: AbortSignal,
        complexityAnalysis?: {
            complexityScore: number;
            wordCount: number;
        }
    ): Promise<CompressedContext> {
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'ContextCompressionService' });
        }

        try {
            const policy = this.selectCompressionStrategy(query, searchResults, this.config.maxTokens, complexityAnalysis);

            console.log('Compression Policy Decision:', policy);

            switch (policy.compression_strategy) {
                case 'RankedCompression':
                    return await this.rankedCompression(searchResults, query, signal);
                case 'RAPTORCompression':
                    return await this.raptorCompression(searchResults, query, signal);
                case 'HybridCompression':
                    return await this.hybridCompression(searchResults, query, signal);
                default:
                    return await this.rankedCompression(searchResults, query, signal);
            }
        } catch (error) {
            throw RAGError.create('responseGeneration', undefined, { query }, error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Ranked sentence selection compression
     */
    private async rankedCompression(
        searchResults: SearchResult[],
        query: string,
        signal?: AbortSignal
    ): Promise<CompressedContext> {
        const allContent = searchResults.map(result => result.content).join('\n\n');
        const sentences = this.extractSentences(allContent);

        // Score sentences based on relevance to query
        const scoredSentences = await this.scoreSentences(sentences, query, signal);

        // Select top sentences within token budget
        const selectedSentences = this.selectSentencesWithinBudget(
            scoredSentences,
            this.config.maxTokens
        );

        const compressedContent = selectedSentences.map(s => s.sentence).join(' ');
        const spans = this.extractSpans(selectedSentences, searchResults);

        return {
            content: compressedContent,
            spans,
            tokenCount: this.estimateTokenCount(compressedContent),
            compressionRatio: compressedContent.length / allContent.length,
            preservedSpans: this.config.preserveSpans
        };
    }

    /**
     * Enhanced RAPTOR-style hierarchical tree compression
     */
    private async raptorCompression(
        searchResults: SearchResult[],
        query: string,
        signal?: AbortSignal
    ): Promise<CompressedContext> {
        try {
            // Phase 1: Group results by document
            const documentGroups = this.groupByDocument(searchResults);

            // Phase 2: Generate LLM-based document summaries
            const documentSummaries = await this.generateLLMDocumentSummaries(documentGroups, query, signal);

            // Phase 3: Create hierarchical tree structure with error handling
            let raptorTree: RAPTORTree;
            try {
                raptorTree = await this.createRAPTORTree(documentSummaries, query, signal);
            } catch (treeError) {
                console.warn('RAPTOR tree creation failed, using simplified structure:', treeError);
                raptorTree = this.createSimplifiedRAPTORTree(documentSummaries, query);
            }

            // Phase 4: Perform multi-level compression with error handling
            let compressionResult: RAPTORCompressionResult;
            try {
                compressionResult = await this.performMultiLevelCompression(raptorTree, query, signal);
            } catch (compressionError) {
                console.warn('RAPTOR compression failed, using basic compression:', compressionError);
                compressionResult = this.createBasicCompressionResult(documentSummaries, query);
            }

            // Phase 5: Generate final hierarchical summary with error handling
            let hierarchicalSummary: RAPTORHierarchicalSummary;
            try {
                hierarchicalSummary = await this.generateHierarchicalSummary(documentSummaries, query, signal);
            } catch (summaryError) {
                console.warn('Hierarchical summary failed, using basic summary:', summaryError);
                hierarchicalSummary = this.createBasicHierarchicalSummary(documentSummaries, query);
            }

            // Phase 6: Combine results with enhanced spans
            const finalContent = this.combineRAPTORResults(compressionResult, hierarchicalSummary);
            const enhancedSpans = this.createEnhancedSpans(documentSummaries, searchResults);

            return {
                content: finalContent,
                spans: enhancedSpans,
                tokenCount: this.estimateTokenCount(finalContent),
                compressionRatio: compressionResult.finalCompressionRatio,
                preservedSpans: this.config.preserveSpans
            };
        } catch (error) {
            console.warn('RAPTOR compression failed, falling back to basic summarization:', error);
            return await this.fallbackRAPTORCompression(searchResults, query, signal);
        }
    }

    /**
     * Hybrid compression combining ranked and RAPTOR
     */
    private async hybridCompression(
        searchResults: SearchResult[],
        query: string,
        signal?: AbortSignal
    ): Promise<CompressedContext> {
        const [rankedResult, raptorResult] = await Promise.all([
            this.rankedCompression(searchResults, query, signal),
            this.raptorCompression(searchResults, query, signal)
        ]);

        // Combine both approaches
        const combinedContent = `${rankedResult.content}\n\n${raptorResult.content}`;
        const combinedSpans = [...rankedResult.spans, ...raptorResult.spans];

        return {
            content: combinedContent,
            spans: combinedSpans,
            tokenCount: this.estimateTokenCount(combinedContent),
            compressionRatio: (rankedResult.compressionRatio + raptorResult.compressionRatio) / 2,
            preservedSpans: this.config.preserveSpans
        };
    }

    /**
     * Extract sentences from content
     */
    private extractSentences(content: string): string[] {
        return content
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10)
            .slice(0, 100); // Limit to prevent excessive processing
    }

    /**
     * Score sentences based on relevance to query
     */
    private async scoreSentences(
        sentences: string[],
        query: string,
        signal?: AbortSignal
    ): Promise<Array<{ sentence: string; score: number }>> {
        const queryTerms = query.toLowerCase().split(/\s+/);

        return sentences.map(sentence => {
            const sentenceTerms = sentence.toLowerCase().split(/\s+/);
            const matches = queryTerms.filter(term =>
                sentenceTerms.some(sTerm => sTerm.includes(term))
            );
            const score = matches.length / queryTerms.length;
            return { sentence, score };
        }).sort((a, b) => b.score - a.score);
    }

    /**
     * Select sentences within token budget
     */
    private selectSentencesWithinBudget(
        scoredSentences: Array<{ sentence: string; score: number }>,
        maxTokens: number
    ): Array<{ sentence: string; score: number }> {
        const selected: Array<{ sentence: string; score: number }> = [];
        let currentTokens = 0;

        for (const scoredSentence of scoredSentences) {
            const sentenceTokens = this.estimateTokenCount(scoredSentence.sentence);
            if (currentTokens + sentenceTokens <= maxTokens) {
                selected.push(scoredSentence);
                currentTokens += sentenceTokens;
            } else {
                break;
            }
        }

        return selected;
    }

    /**
     * Extract spans from selected sentences
     */
    private extractSpans(
        selectedSentences: Array<{ sentence: string; score: number }>,
        searchResults: SearchResult[]
    ): Span[] {
        const spans: Span[] = [];
        let currentOffset = 0;

        for (const { sentence } of selectedSentences) {
            // Find which search result contains this sentence
            const sourceResult = searchResults.find(result =>
                result.content.includes(sentence)
            );

            if (sourceResult) {
                const startOffset = sourceResult.content.indexOf(sentence);
                spans.push({
                    start: currentOffset + startOffset,
                    end: currentOffset + startOffset + sentence.length,
                    text: sentence,
                    sourceChunkId: sourceResult.chunkId,
                    confidence: 0.8
                });
            }

            currentOffset += sentence.length + 1; // +1 for space
        }

        return spans;
    }

    /**
     * Group search results by document
     */
    private groupByDocument(searchResults: SearchResult[]): SearchResult[][] {
        const groups = new Map<string, SearchResult[]>();

        for (const result of searchResults) {
            if (!groups.has(result.documentId)) {
                groups.set(result.documentId, []);
            }
            groups.get(result.documentId)!.push(result);
        }

        return Array.from(groups.values());
    }

    /**
     * Generate summary for a document group
     */
    private async generateDocumentSummary(
        group: SearchResult[],
        query: string,
        signal?: AbortSignal
    ): Promise<string> {
        const content = group.map(r => r.content).join('\n\n');

        // Simple fallback summarization without LLM
        const sentences = this.extractSentences(content);
        const scoredSentences = await this.scoreSentences(sentences, query, signal);
        const selectedSentences = this.selectSentencesWithinBudget(scoredSentences, 200);

        return selectedSentences.map(s => s.sentence).join(' ');
    }

    /**
     * Extract spans from a document group
     */
    private extractSpansFromGroup(group: SearchResult[]): Span[] {
        return group.map(result => ({
            start: 0,
            end: result.content.length,
            text: result.content,
            sourceChunkId: result.chunkId,
            confidence: 0.7
        }));
    }

    /**
     * Estimate token count using js-tiktoken
     */
    private estimateTokenCount(text: string): number {
        return calculateTokenCount(text);
    }

    /**
     * Generate LLM-based document summaries with fallback
     */
    private async generateLLMDocumentSummaries(
        documentGroups: SearchResult[][],
        query: string,
        signal?: AbortSignal
    ): Promise<Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>> {
        return await Promise.all(
            documentGroups.map(async (group) => {
                try {
                    const content = group.map(r => r.content).join('\n\n');
                    const metadata = group[0].metadata || {};

                    const summary = await generateLLMResponse<RAPTORDocumentSummary>(
                        PROMPT_IDS.RAPTOR_DOCUMENT_SUMMARY,
                        {
                            query,
                            content,
                            metadata: JSON.stringify(metadata)
                        }
                    );

                    return {
                        documentId: group[0].documentId,
                        summary,
                        spans: this.extractSpansFromGroup(group)
                    };
                } catch (error) {
                    console.warn(`RAPTOR summary generation failed for document ${group[0].documentId}, using fallback:`, error);

                    // Fallback to basic summarization
                    const fallbackSummary = await this.generateDocumentSummary(group, query, signal);

                    return {
                        documentId: group[0].documentId,
                        summary: {
                            summary: fallbackSummary,
                            keyPoints: [fallbackSummary.substring(0, 100) + '...'],
                            relevanceScore: 0.8,
                            confidence: 0.7
                        },
                        spans: this.extractSpansFromGroup(group)
                    };
                }
            })
        );
    }

    /**
     * Create hierarchical RAPTOR tree structure
     */
    private async createRAPTORTree(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        query: string,
        signal?: AbortSignal
    ): Promise<RAPTORTree> {
        try {
            const allContent = documentSummaries.map(d => d.summary.summary).join('\n\n');

            const treeStructure = await generateLLMResponse<{
                rootNode: RAPTORNode;
                branches: RAPTORNode[];
                compressionStrategy: string;
                estimatedCompressionRatio: number;
            }>(
                PROMPT_IDS.RAPTOR_TREE_STRUCTURE,
                {
                    query,
                    content: allContent
                }
            );

            // Validate required fields
            if (!treeStructure.compressionStrategy || treeStructure.estimatedCompressionRatio === undefined) {
                throw new Error('RAPTOR tree missing required fields: compressionStrategy or estimatedCompressionRatio');
            }

            // Enhance tree with source tracking
            treeStructure.rootNode.sourceChunkIds = documentSummaries.map(d => d.documentId);
            treeStructure.branches.forEach(branch => {
                branch.sourceChunkIds = documentSummaries.map(d => d.documentId);
            });

            return treeStructure;
        } catch (error) {
            console.warn('⚠️ RAPTOR tree creation failed, using simplified structure:', error);
            return {
                rootNode: {
                    title: 'Document Summary',
                    content: documentSummaries.map(d => d.summary.summary).join('\n\n'),
                    relevanceScore: 0.8,
                    compressionAction: 'preserve' as const,
                    sourceChunkIds: documentSummaries.map(d => d.documentId)
                },
                branches: [],
                compressionStrategy: 'fallback-simplified',
                estimatedCompressionRatio: 0.5
            };
        }
    }

    /**
     * Perform multi-level compression using RAPTOR tree
     */
    private async performMultiLevelCompression(
        raptorTree: RAPTORTree,
        query: string,
        signal?: AbortSignal
    ): Promise<RAPTORCompressionResult> {
        const compressionLevel = this.determineCompressionLevel(raptorTree);

        const result = await generateLLMResponse<RAPTORCompressionResult>(
            PROMPT_IDS.RAPTOR_MULTI_LEVEL_COMPRESSION,
            {
                query,
                treeStructure: JSON.stringify(raptorTree),
                compressionLevel
            }
        );

        return result;
    }


    private async generateHierarchicalSummary(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        query: string,
        signal?: AbortSignal
    ): Promise<RAPTORHierarchicalSummary> {
        const documents = documentSummaries.map(d => ({
            id: d.documentId,
            summary: d.summary.summary,
            keyPoints: d.summary.keyPoints
        }));

        return await generateLLMResponse<RAPTORHierarchicalSummary>(
            PROMPT_IDS.RAPTOR_HIERARCHICAL_SUMMARY,
            {
                query,
                documents: JSON.stringify(documents)
            }
        );
    }

    private combineRAPTORResults(
        compressionResult: RAPTORCompressionResult,
        hierarchicalSummary: RAPTORHierarchicalSummary
    ): string {
        const sections = [];

        if (hierarchicalSummary.mainTopic) {
            sections.push(`# ${hierarchicalSummary.mainTopic}`);
        }

        if (compressionResult.compressedContent) {
            sections.push(compressionResult.compressedContent);
        }

        if (hierarchicalSummary.categories.length > 0) {
            sections.push('\n## Key Categories:');
            hierarchicalSummary.categories.forEach(category => {
                if (category.relevanceScore >= 0.6) {
                    sections.push(`### ${category.title}`);
                    sections.push(category.content);
                }
            });
        }

        if (hierarchicalSummary.keyInsights.length > 0) {
            sections.push('\n## Key Insights:');
            hierarchicalSummary.keyInsights.forEach(insight => {
                sections.push(`• ${insight}`);
            });
        }

        return sections.join('\n\n');
    }


    private createEnhancedSpans(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        searchResults: SearchResult[]
    ): Span[] {
        const enhancedSpans: Span[] = [];
        let currentOffset = 0;

        documentSummaries.forEach((docSummary, index) => {
            const summaryLength = docSummary.summary.summary.length;

            enhancedSpans.push({
                start: currentOffset,
                end: currentOffset + summaryLength,
                text: docSummary.summary.summary,
                sourceChunkId: docSummary.documentId,
                confidence: docSummary.summary.confidence
            });

            currentOffset += summaryLength + 2;
        });

        return enhancedSpans;
    }

    private determineCompressionLevel(raptorTree: RAPTORTree): number {
        const totalNodes = 1 + raptorTree.branches.length; // root + branches
        const avgRelevance = (raptorTree.rootNode.relevanceScore +
            raptorTree.branches.reduce((sum, b) => sum + b.relevanceScore, 0)) / totalNodes;

        if (totalNodes > 10 || avgRelevance < 0.5) {
            return 3; // Aggressive compression
        } else if (totalNodes > 5 || avgRelevance < 0.7) {
            return 2; // Medium compression
        } else {
            return 1; // Light compression
        }
    }


    private createSimplifiedRAPTORTree(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        query: string
    ): RAPTORTree {
        const allContent = documentSummaries.map(d => d.summary.summary).join('\n\n');

        return {
            rootNode: {
                title: 'Document Content',
                content: allContent,
                relevanceScore: 0.8,
                compressionAction: 'preserve',
                sourceChunkIds: documentSummaries.map(d => d.documentId)
            },
            branches: documentSummaries.map(doc => ({
                title: `Document ${doc.documentId}`,
                content: doc.summary.summary,
                relevanceScore: doc.summary.relevanceScore,
                compressionAction: doc.summary.relevanceScore > 0.7 ? 'preserve' : 'compress',
                sourceChunkIds: [doc.documentId]
            })),
            compressionStrategy: 'simplified',
            estimatedCompressionRatio: 0.7
        };
    }

    private createBasicCompressionResult(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        query: string
    ): RAPTORCompressionResult {
        const relevantSummaries = documentSummaries
            .filter(doc => doc.summary.relevanceScore > 0.5)
            .map(doc => doc.summary.summary);

        const compressedContent = relevantSummaries.join('\n\n');

        return {
            compressedContent,
            preservedNodes: documentSummaries
                .filter(doc => doc.summary.relevanceScore > 0.7)
                .map(doc => doc.documentId),
            compressedNodes: documentSummaries
                .filter(doc => doc.summary.relevanceScore > 0.5 && doc.summary.relevanceScore <= 0.7)
                .map(doc => doc.documentId),
            removedNodes: documentSummaries
                .filter(doc => doc.summary.relevanceScore <= 0.5)
                .map(doc => doc.documentId),
            finalCompressionRatio: 0.7,
            informationRetention: 0.8
        };
    }


    private createBasicHierarchicalSummary(
        documentSummaries: Array<{ documentId: string; summary: RAPTORDocumentSummary; spans: Span[] }>,
        query: string
    ): RAPTORHierarchicalSummary {
        const relevantDocs = documentSummaries.filter(doc => doc.summary.relevanceScore > 0.5);
        const mainTopic = relevantDocs.length > 0 ? 'Document Information' : 'No Relevant Information';

        return {
            mainTopic,
            categories: relevantDocs.map(doc => ({
                title: `Document ${doc.documentId}`,
                content: doc.summary.summary,
                relevanceScore: doc.summary.relevanceScore,
                sourceDocuments: [doc.documentId]
            })),
            overallSummary: relevantDocs.map(doc => doc.summary.summary).join('\n\n'),
            keyInsights: relevantDocs.flatMap(doc => doc.summary.keyPoints),
            confidence: 0.6
        };
    }


    private async fallbackRAPTORCompression(
        searchResults: SearchResult[],
        query: string,
        signal?: AbortSignal
    ): Promise<CompressedContext> {
        // Use the original basic implementation as fallback
        const documentGroups = this.groupByDocument(searchResults);

        const documentSummaries = await Promise.all(
            documentGroups.map(async (group) => {
                const summary = await this.generateDocumentSummary(group, query, signal);
                return {
                    documentId: group[0].documentId,
                    summary,
                    spans: this.extractSpansFromGroup(group)
                };
            })
        );

        const combinedSummary = documentSummaries.map(d => d.summary).join('\n\n');
        const allSpans = documentSummaries.flatMap(d => d.spans);

        return {
            content: combinedSummary,
            spans: allSpans,
            tokenCount: this.estimateTokenCount(combinedSummary),
            compressionRatio: combinedSummary.length / searchResults.map(r => r.content).join('').length,
            preservedSpans: this.config.preserveSpans
        };
    }


    dispose(): void {
        this.isDisposed = true;
    }
}

export const contextCompressionService = new ContextCompressionService();

