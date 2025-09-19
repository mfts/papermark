import pMap from 'p-map';
import {
    SearchResult,
    GradedDocument,
    RAG_CONSTANTS
} from '../types/rag-types';
import { PROMPT_IDS } from '../prompts';
import { configurationManager } from '../config/configuration-manager';
import { RAGError } from '../errors/rag-errors';
import { QUERY_PATTERNS } from '../constants/patterns';
import { generateLLMResponse } from '../llm';

interface GradingResult {
    relevantDocuments: GradedDocument[];
    context: string;
    hasRelevantDocuments: boolean;
}

interface QueryComplexity {
    level: 'low' | 'medium' | 'high';
    patterns: string[];
    score: number;
}

export class DocumentGradingService {
    private ragConfig = configurationManager.getRAGConfig();
    private isDisposed = false;


    async gradeAndFilterDocuments(
        query: string,
        searchResults: SearchResult[],
        complexityAnalysis?: {
            complexityScore: number;
            wordCount: number;
            complexityLevel: 'low' | 'medium' | 'high';
        }
    ): Promise<GradingResult> {
        if (this.isDisposed) {
            throw RAGError.create('serviceDisposed', undefined, { service: 'DocumentGradingService' });
        }

        return RAGError.withErrorHandling(
            async () => {
                if (this.isConversationalQuery(query)) {
                    return this.handleConversationalQuery(query, searchResults);
                }
                return this.processRegularQuery(query, searchResults, complexityAnalysis);
            },
            'grading',
            { service: 'DocumentGrading', operation: 'gradeAndFilterDocuments', query }
        );
    }

    private async handleConversationalQuery(query: string, searchResults: SearchResult[]): Promise<GradingResult> {
        const highConfidenceDocs = searchResults.slice(0, 3);
        const context = this.buildContext(highConfidenceDocs);

        const gradedDocs = highConfidenceDocs.map(doc => this.createGradedDocument(doc, {
            relevanceScore: RAG_CONSTANTS.HIGH_CONFIDENCE,
            confidence: RAG_CONSTANTS.HIGH_CONFIDENCE,
            isRelevant: true,
            suggestedWeight: RAG_CONSTANTS.HIGH_CONFIDENCE
        }));

        return {
            relevantDocuments: gradedDocs,
            context,
            hasRelevantDocuments: true
        };
    }

    private async processRegularQuery(
        query: string,
        searchResults: SearchResult[],
        complexityAnalysis?: {
            complexityScore: number;
            wordCount: number;
            complexityLevel: 'low' | 'medium' | 'high';
        }
    ): Promise<GradingResult> {
        const queryComplexity = complexityAnalysis
            ? {
                level: complexityAnalysis.complexityLevel,
                patterns: [], // No longer using
                score: complexityAnalysis.complexityScore
            }
            : this.assessQueryComplexity(query);
        const documentsToGrade = this.selectDocumentsToGrade(searchResults, queryComplexity);
        const gradingResults = await this.batchGradeDocuments(query, documentsToGrade);

        // Filter relevant documents
        const relevantDocuments = gradingResults.filter(doc =>
            doc.isRelevant && doc.relevanceScore >= this.ragConfig.grading.relevanceThreshold
        );

        // Build context from relevant documents
        const context = this.buildContext(relevantDocuments.map(doc => ({
            content: doc.originalContent,
            documentId: doc.documentId,
            chunkId: doc.chunkId,
            metadata: doc.metadata,
            similarity: doc.relevanceScore
        })));

        return {
            relevantDocuments,
            context,
            hasRelevantDocuments: relevantDocuments.length > 0
        };
    }


    private assessQueryComplexity(query: string): QueryComplexity {
        const patterns = [...QUERY_PATTERNS.complexity.high, ...QUERY_PATTERNS.complexity.medium];
        const matchedPatterns: string[] = [];
        let score = 0;

        for (const pattern of patterns) {
            if (query.toLowerCase().includes(pattern)) {
                matchedPatterns.push(pattern);
                score += 0.1;
            }
        }

        const level = score > 0.7 ? 'high' : score > 0.3 ? 'medium' : 'low';

        return { level, patterns: matchedPatterns, score };
    }


    private selectDocumentsToGrade(searchResults: SearchResult[], complexity: QueryComplexity): SearchResult[] {

        if (complexity.level === 'high') {
            return searchResults.slice(0, Math.min(15, searchResults.length));
        } else if (complexity.level === 'medium') {
            return searchResults.slice(0, Math.min(10, searchResults.length));
        } else {
            return searchResults.slice(0, Math.min(8, searchResults.length));
        }
    }


    private isConversationalQuery(query: string): boolean {
        return QUERY_PATTERNS.conversational.some(pattern =>
            query.toLowerCase().includes(pattern)
        );
    }


    private createGradedDocument(doc: SearchResult, grading: Partial<GradedDocument>): GradedDocument {
        return {
            documentId: doc.documentId,
            chunkId: doc.chunkId,
            relevanceScore: grading.relevanceScore || 0,
            confidence: grading.confidence || 0,
            isRelevant: grading.isRelevant || false,
            suggestedWeight: grading.suggestedWeight || 0,
            originalContent: doc.content,
            metadata: doc.metadata
        };
    }


    private buildContext(documents: SearchResult[]): string {
        return documents
            .map(doc => doc.content)
            .filter(Boolean)
            .join('\n\n');
    }


    private async batchGradeDocuments(query: string, documents: SearchResult[]): Promise<GradedDocument[]> {
        const batchSize = RAG_CONSTANTS.DEFAULT_BATCH_SIZE;
        const results: GradedDocument[] = [];

        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);

            const batchResults = await pMap(
                batch,
                async (document) => {
                    return await this.gradeSingleDocument(query, document);
                },
                { concurrency: 3 }
            );

            results.push(...batchResults);
        }

        return results;
    }

    private async gradeSingleDocument(query: string, document: SearchResult): Promise<GradedDocument> {
        const grade = await generateLLMResponse<{
            relevanceScore: number;
            confidence: number;
            isRelevant: boolean;
            suggestedWeight: number;
        }>(
            PROMPT_IDS.DOCUMENT_GRADING_SINGLE,
            {
                query,
                documentContent: document.content,
                documentMetadata: document.metadata
            }
        );

        return this.createGradedDocument(document, {
            relevanceScore: grade.relevanceScore,
            confidence: grade.confidence,
            isRelevant: grade.isRelevant,
            suggestedWeight: grade.suggestedWeight
        });
    }


    dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
    }

    get disposed(): boolean {
        return this.isDisposed;
    }
}

export const documentGradingService = new DocumentGradingService();
