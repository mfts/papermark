import { SearchResult, CompressionConfig, CompressedContext, Span } from '../types/rag-types';
import { RAGError } from '../errors';
import { generateLLMResponse } from '../utils/llm-utils';
import { configurationManager } from '../config';
import { PROMPT_IDS } from '../prompts';
import { calculateTokenCount } from '../utils/chunk-utils';

interface CompressionPolicy {
    compression_strategy: 'RankedCompression' | 'HybridCompression' | 'RAPTORCompression';
}

interface RAPTORNode {
    title: string;
    content: string;
    relevanceScore: number;
    compressionAction: 'preserve' | 'compress' | 'remove';
    children?: RAPTORNode[];
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
    private static instance: ContextCompressionService | null = null;

    private constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.config = {
            maxTokens: ragConfig.compression.maxTokens,
            compressionRatio: ragConfig.compression.compressionRatio,
            preserveSpans: ragConfig.compression.preserveSpans,
            method: ragConfig.compression.method
        };
    }

    static getInstance(): ContextCompressionService {
        if (!ContextCompressionService.instance) {
            ContextCompressionService.instance = new ContextCompressionService();
        }
        return ContextCompressionService.instance;
    }

    private selectCompressionStrategy(
        query: string,
        searchResults: SearchResult[],
        tokenBudget: number = 6000,
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

        const exceedsTokenBudget = estimatedTokens > tokenBudget * 1.1;

        // Check retrieval confidence (based on similarity scores)
        const avgSimilarity = searchResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / searchResults.length;
        const lowConfidence = avgSimilarity < 0.6;

        if (exceedsTokenBudget && estimatedTokens > tokenBudget * 2.0) {
            return {
                compression_strategy: 'RAPTORCompression'
            };
        }

        if ((isMultiHop || isResearchStyle) && queryLength > 50 && documentCount > 5 && complexityScore > 0.8) {
            return {
                compression_strategy: 'RAPTORCompression'
            };
        }
        if (totalContentLength > 10000 && documentCount > 2) {
            return {
                compression_strategy: 'RAPTORCompression'
            };
        }

        if ((isMultiHop || isResearchStyle) && queryLength > 35 && documentCount > 2) {
            return {
                compression_strategy: 'RAPTORCompression'
            };
        }

        // Prefer hybrid for multi-document moderate complexity
        if ((queryLength >= 15 || complexityScore > 0.6) && documentCount > 1) {
            return {
                compression_strategy: 'HybridCompression'
            };
        }

        if (queryLength >= 15 || complexityScore > 0.6) {
            return {
                compression_strategy: 'HybridCompression'
            };
        }

        if (lowConfidence) {
            return {
                compression_strategy: 'HybridCompression'
            };
        }

        return {
            compression_strategy: 'RankedCompression'
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


        try {
            const policy = this.selectCompressionStrategy(query, searchResults, this.config.maxTokens, complexityAnalysis);


            let result: CompressedContext;
            switch (policy.compression_strategy) {
                case 'RankedCompression':
                    result = await this.rankedCompression(searchResults, query, signal);
                    break;
                case 'RAPTORCompression':
                    result = await this.raptorCompression(searchResults, query, signal);
                    break;
                case 'HybridCompression':
                    result = await this.hybridCompression(searchResults, query, signal);
                    break;
                default:
                    result = await this.rankedCompression(searchResults, query, signal);
            }

            return result;
        } catch (error) {
            return await this.rankedCompression(searchResults, query, signal);
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
            preservedSpans: this.config.preserveSpans,
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
        const raptorTimeout = AbortSignal.timeout(45000);
        const combinedSignal = signal ? this.combineAbortSignals([signal, raptorTimeout]) : raptorTimeout;
        try {
            // Phase 1: Group results by document
            const documentGroups = this.groupByDocument(searchResults);

            // Phase 2: Generate LLM-based document summaries
            const documentSummaries = await this.generateLLMDocumentSummaries(documentGroups, query, combinedSignal);

            // Phase 3: Create hierarchical tree structure with error handling
            let raptorTree: RAPTORTree;
            try {
                raptorTree = await this.createRAPTORTree(documentSummaries, query, combinedSignal);
            } catch (treeError) {
                throw treeError;
            }

            // Phase 4: Perform multi-level compression with error handling
            let compressionResult: RAPTORCompressionResult;
            try {
                compressionResult = await this.performMultiLevelCompression(raptorTree, query, combinedSignal);
            } catch (compressionError) {
                throw compressionError;
            }

            // Phase 5: Generate final hierarchical summary with error handling
            let hierarchicalSummary: RAPTORHierarchicalSummary;
            try {
                hierarchicalSummary = await this.generateHierarchicalSummary(documentSummaries, query, signal);
            } catch (summaryError) {
                throw summaryError;
            }

            // Phase 6: Combine results with enhanced spans
            const finalContent = this.combineRAPTORResults(compressionResult, hierarchicalSummary);
            const enhancedSpans = this.createEnhancedSpans(documentSummaries, searchResults);

            return {
                content: finalContent,
                spans: enhancedSpans,
                tokenCount: this.estimateTokenCount(finalContent),
                compressionRatio: compressionResult.finalCompressionRatio,
                preservedSpans: this.config.preserveSpans,
            };
        } catch (error) {
            return await this.rankedCompression(searchResults, query, signal);
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
        try {
            const [rankedResult, raptorResult] = await Promise.allSettled([
                this.rankedCompression(searchResults, query, signal),
                this.raptorCompression(searchResults, query, signal)
            ]);

            // Handle results with fallbacks
            const ranked = rankedResult.status === 'fulfilled' ? rankedResult.value : null;
            const raptor = raptorResult.status === 'fulfilled' ? raptorResult.value : null;

            if (!ranked && !raptor) {
                return await this.rankedCompression(searchResults, query, signal);
            }
            const finalResult = ranked || raptor!;
            const additionalResult = ranked && raptor ? raptor : null;

            if (additionalResult) {
                // Combine both approaches
                const combinedContent = `${finalResult.content}\n\n${additionalResult.content}`;
                const combinedSpans = [...finalResult.spans, ...additionalResult.spans];

                return {
                    content: combinedContent,
                    spans: combinedSpans,
                    tokenCount: this.estimateTokenCount(combinedContent),
                    compressionRatio: (finalResult.compressionRatio + additionalResult.compressionRatio) / 2,
                    preservedSpans: this.config.preserveSpans,
                };
            }

            return finalResult;
        } catch (error) {
            return await this.rankedCompression(searchResults, query, signal);
        }
    }

    /**
     * Extract sentences from content
     */
    private extractSentences(content: string): string[] {
        return content
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10)
            .slice(0, 100);
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
        const limitedGroups = documentGroups.slice(0, 3);

        return await Promise.all(
            limitedGroups.map(async (group) => {
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
                },
                {
                    signal,
                    maxTokens: 2000,
                    temperature: 0.1
                }
            );

            // Validate required fields
            if (!treeStructure.compressionStrategy || treeStructure.estimatedCompressionRatio === undefined) {
                throw new Error('RAPTOR tree missing required fields: compressionStrategy or estimatedCompressionRatio');
            }


            return treeStructure;
        } catch (error) {
            return {
                rootNode: {
                    title: 'Document Summary',
                    content: documentSummaries.map(d => d.summary.summary).join('\n\n'),
                    relevanceScore: 0.8,
                    compressionAction: 'preserve' as const,
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

    private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
        const controller = new AbortController();

        signals.forEach(signal => {
            if (signal.aborted) {
                controller.abort();
            } else {
                signal.addEventListener('abort', () => controller.abort(), { once: true });
            }
        });

        return controller.signal;
    }


}

export const contextCompressionService = ContextCompressionService.getInstance();

