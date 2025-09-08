import {
    GradedDocument,
    SearchResult,
    EnhancedSource,
    Span,
    SentenceSpan
} from '../types/rag-types';
import { AccessibleDocument } from '../document-permissions';

const MIN_SENTENCE_LENGTH = 10;
const DEFAULT_CONFIDENCE = 0.8;
const DEFAULT_SIMILARITY = 0.5;
const DOCUMENT_ID_PREFIX_LENGTH = 8;

export class SourceBuildingService {
    async buildSources(
        relevantDocuments: GradedDocument[],
        documents: SearchResult[],
        accessibleDocuments: AccessibleDocument[]
    ): Promise<EnhancedSource[]> {
        const documentNameMap = new Map<string, string>();
        accessibleDocuments.forEach(doc => {
            documentNameMap.set(doc.documentId, doc.documentName);
        });

        const sources: EnhancedSource[] = [];
        for (const doc of relevantDocuments) {
            const match = documents.find(r => r.chunkId === doc.chunkId);
            if (!match) continue;

            const documentId = doc.documentId || doc.chunkId?.split(':')[0];
            const documentName = documentNameMap.get(documentId) || this.inferDocumentName(match.content, documentId);
            const locationInfo = this.extractLocationInfo(match.content, this.extractPageNumberFromRanges(match.metadata?.pageRanges) || 1);

            const spans = this.extractSpans(match.content, doc.chunkId);
            const sentenceSpans = this.extractSentenceSpans(match.content, spans);
            const coverage = this.calculateCoverage(sentenceSpans);

            sources.push({
                documentName,
                similarity: doc.relevanceScore || match.similarity || DEFAULT_SIMILARITY,
                pageNumber: this.extractPageNumberFromRanges(match.metadata?.pageRanges),
                locationInfo,
                documentId,
                chunkId: doc.chunkId,
                spans,
                sentenceSpans,
                coverage,
                startOffset: 0,
                endOffset: match.content.length,
                content: match.content
            });
        }
        return sources;
    }

    private extractSentences(content: string): string[] {
        return content
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > MIN_SENTENCE_LENGTH);
    }

    private extractSpans(content: string, chunkId: string): Span[] {
        const sentences = this.extractSentences(content);
        const spans: Span[] = [];
        let currentOffset = 0;

        for (const sentence of sentences) {
            const startOffset = content.indexOf(sentence, currentOffset);
            if (startOffset !== -1) {
                spans.push({
                    start: startOffset,
                    end: startOffset + sentence.length,
                    text: sentence,
                    sourceChunkId: chunkId,
                    confidence: DEFAULT_CONFIDENCE
                });
                currentOffset = startOffset + sentence.length;
            }
        }

        return spans;
    }

    private extractSentenceSpans(content: string, spans: Span[]): SentenceSpan[] {
        const sentences = this.extractSentences(content);

        return sentences.map(sentence => {
            const sentenceSpans = spans.filter(span =>
                span.text.includes(sentence) || sentence.includes(span.text)
            );

            const coverage = sentenceSpans.length > 0 ?
                sentenceSpans.reduce((sum, span) => sum + span.confidence, 0) / sentenceSpans.length : 0;

            return {
                sentence,
                spans: sentenceSpans,
                coverage
            };
        });
    }
    private calculateCoverage(sentenceSpans: SentenceSpan[]): number {
        if (sentenceSpans.length === 0) return 0;

        const totalCoverage = sentenceSpans.reduce((sum, sentenceSpan) => sum + sentenceSpan.coverage, 0);
        return totalCoverage / sentenceSpans.length;
    }

    private extractPageNumberFromRanges(pageRanges?: string[]): number | undefined {
        if (!pageRanges || pageRanges.length === 0) return undefined;

        const firstRange = pageRanges[0];
        if (!firstRange) return undefined;

        try {
            if (firstRange.includes('-')) {
                const pageNum = parseInt(firstRange.split('-')[0], 10);
                return isNaN(pageNum) ? undefined : pageNum;
            } else {
                const pageNum = parseInt(firstRange, 10);
                return isNaN(pageNum) ? undefined : pageNum;
            }
        } catch (error) {
            console.warn('Failed to parse page range:', firstRange, error);
            return undefined;
        }
    }


    private inferDocumentName(content: string, documentId: string): string {
        if (!content || !documentId) {
            return 'Unknown Document';
        }

        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const firstLine = lines[0]?.trim();

        if (firstLine && firstLine.length > 3 && firstLine.length < 100) {
            return firstLine;
        }

        return `Document ${documentId.substring(0, DOCUMENT_ID_PREFIX_LENGTH)}`;
    }

    private extractLocationInfo(content: string, pageNumber: number): string {
        if (!content || !pageNumber || pageNumber < 1) {
            return 'Unknown Location';
        }

        const lines = content.split('\n');
        const firstLine = lines[0]?.trim();

        if (firstLine?.match(/^(Section|Chapter|Article|Part)\s+\d+/i)) {
            return `${firstLine} (Page ${pageNumber})`;
        }

        if (firstLine?.match(/^Table\s+\d+/i)) {
            return `${firstLine} (Page ${pageNumber})`;
        }

        return `Page ${pageNumber}`;
    }

}

export const sourceBuildingService = new SourceBuildingService();
