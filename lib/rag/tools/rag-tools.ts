import { tool } from 'ai';
import { z } from 'zod';
import { vectorSearchService } from '../vector-search';

export function createSearchDocumentsTool(context: { dataroomId?: string; documentIds?: string[] }) {
    return tool({
        description: 'Search for academic papers and research documents within the provided document collection. Use this tool when you need to find specific information, concepts, or documents that might not be in the current context. This tool performs semantic search across all indexed documents to find relevant content.',
        inputSchema: z.object({
            query: z.string()
                .min(1, 'Query is required')
                .max(500, 'Query must be under 500 characters')
                .describe('The search query for academic papers within the document collection. Be specific and descriptive to get better results. Examples: "machine learning algorithms", "statistical analysis methods", "research methodology", "conclusion findings".'),
            topK: z.number()
                .min(1)
                .max(10)
                .default(5)
                .describe('Number of results to return (1-10)'),
            similarityThreshold: z.number()
                .min(0)
                .max(1)
                .default(0.2)
                .describe('Minimum similarity threshold for results (0-1)')
        }),
        execute: async ({ query, topK = 5, similarityThreshold = 0.2 }) => {
            try {
                const { dataroomId, documentIds } = context;

                if (!dataroomId || !documentIds?.length) {
                    return 'Unable to search: No document collection context available.';
                }

                const searchResults = await vectorSearchService.searchSimilarChunks(
                    query,
                    dataroomId,
                    documentIds,
                    {
                        topK,
                        similarityThreshold,
                        metadataFilter: { documentIds, dataroomId }
                    }
                );

                if (searchResults.length === 0) {
                    return `No documents found related to "${query}". Try different keywords.`;
                }

                const formattedResults = searchResults.map((result: any, index: number) => {
                    const docName = result.metadata.documentName || 'Unknown Document';
                    const pageInfo = result.metadata.pageRanges ? ` (Page ${result.metadata.pageRanges.join(', ')})` : '';
                    const relevance = (result.similarity * 100).toFixed(1);
                    const content = result.content.substring(0, 300);

                    return `${index + 1}. **${docName}**${pageInfo} - ${relevance}%\n   ${content}${result.content.length > 300 ? '...' : ''}`;
                }).join('\n\n');

                return `Found ${searchResults.length} relevant documents:\n\n${formattedResults}`;
            } catch (error) {
                console.error('Search documents tool error:', error);
                return 'Error occurred while searching documents. Please try again.';
            }
        }
    });
}

export function createGetDocumentSummaryTool(context: { dataroomId?: string; documentIds?: string[] }) {
    return tool({
        description: 'Get a summary of a specific document by its ID. Use this tool when you need a high-level overview of a particular document or want to understand its main topics and structure.',
        inputSchema: z.object({
            documentId: z.string()
                .min(1, 'Document ID is required')
                .describe('The ID of the document to summarize. Must be one of the available document IDs in the current context.'),
            summaryType: z.enum(['overview', 'detailed', 'key_points'])
                .default('overview')
                .describe('Type of summary: "overview" for brief summary, "detailed" for comprehensive summary, "key_points" for main points only.')
        }),
        execute: async ({ documentId, summaryType = 'overview' }) => {
            try {
                const { dataroomId, documentIds } = context;

                if (!documentIds?.includes(documentId)) {
                    return `Error: Document ID "${documentId}" is not available in the current context.`;
                }

                if (!dataroomId) {
                    return 'Error: No dataroom context available.';
                }

                const searchResults = await vectorSearchService.searchSimilarChunks(
                    'document summary overview main topics key findings',
                    dataroomId,
                    [documentId],
                    {
                        topK: summaryType === 'detailed' ? 10 : summaryType === 'key_points' ? 5 : 3,
                        similarityThreshold: 0.2,
                        metadataFilter: { documentIds: [documentId], dataroomId }
                    }
                );

                if (searchResults.length === 0) {
                    return `No content found for document "${documentId}".`;
                }

                const docName = searchResults[0]?.metadata.documentName || 'Unknown Document';
                const chunks = searchResults.slice(0, summaryType === 'detailed' ? 8 : summaryType === 'key_points' ? 5 : 3);
                const contentLength = summaryType === 'detailed' ? 300 : summaryType === 'key_points' ? 200 : 150;

                const formattedContent = chunks.map((result: any, index: number) => {
                    const content = result.content.substring(0, contentLength);
                    const pageInfo = result.metadata.pageRanges ? ` (Page ${result.metadata.pageRanges.join(', ')})` : '';
                    return `${index + 1}. ${content}${result.content.length > contentLength ? '...' : ''}${pageInfo}`;
                }).join(summaryType === 'detailed' ? '\n\n' : '\n');

                const title = summaryType === 'key_points' ? 'Key Points' :
                    summaryType === 'detailed' ? 'Detailed Summary' : 'Overview';

                return `**${title} of ${docName}:**\n\n${formattedContent}`;
            } catch (error) {
                console.error('Get document summary tool error:', error);
                return 'Error occurred while generating document summary. Please try again.';
            }
        }
    });
}

export function createAnalyzeDataTool(context: { dataroomId?: string; documentIds?: string[] }) {
    return tool({
        description: 'Analyze and extract insights from document data. Use this tool when you need to perform data analysis, extract patterns, or get statistical insights from the document content.',
        inputSchema: z.object({
            analysisType: z.enum(['statistical', 'trend', 'comparison', 'summary'])
                .describe('Type of analysis to perform'),
            focusArea: z.string()
                .min(1, 'Focus area is required')
                .describe('The specific area or topic to focus the analysis on'),
            documentIds: z.array(z.string())
                .optional()
                .describe('Specific document IDs to analyze. If not provided, analyzes all available documents.')
        }),
        execute: async ({ analysisType, focusArea, documentIds }) => {
            try {
                const { dataroomId, documentIds: availableDocumentIds } = context;
                const targetDocumentIds = documentIds || availableDocumentIds || [];

                if (!dataroomId || !targetDocumentIds.length) {
                    return 'Unable to analyze: No document collection context available.';
                }

                // Search for relevant content based on focus area
                const searchResults = await vectorSearchService.searchSimilarChunks(
                    `${analysisType} analysis ${focusArea}`,
                    dataroomId,
                    targetDocumentIds,
                    {
                        topK: 10,
                        similarityThreshold: 0.15,
                        metadataFilter: { documentIds: targetDocumentIds, dataroomId }
                    }
                );

                if (searchResults.length === 0) {
                    return `No relevant data found for ${analysisType} analysis of "${focusArea}".`;
                }

                // Group results by document
                const documentGroups = searchResults.reduce((acc: any, result: any) => {
                    const docId = result.metadata.documentId;
                    if (!acc[docId]) {
                        acc[docId] = {
                            documentName: result.metadata.documentName || 'Unknown Document',
                            chunks: []
                        };
                    }
                    acc[docId].chunks.push(result);
                    return acc;
                }, {} as Record<string, { documentName: string; chunks: any[] }>);

                const analysisResults = Object.entries(documentGroups).map(([docId, group]) => {
                    const typedGroup = group as { documentName: string; chunks: any[] };
                    const topChunks = typedGroup.chunks.slice(0, 3);
                    const content = topChunks.map((chunk: any) =>
                        chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : '')
                    ).join('\n\n');

                    return `**${typedGroup.documentName}:**\n${content}`;
                }).join('\n\n---\n\n');

                return `**${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis of "${focusArea}":**\n\n${analysisResults}`;
            } catch (error) {
                console.error('Analyze data tool error:', error);
                return 'Error occurred while analyzing data. Please try again.';
            }
        }
    });
}

export function getRAGTools(context: { dataroomId?: string; documentIds?: string[] }) {
    return {
        searchDocuments: createSearchDocumentsTool(context),
        getDocumentSummary: createGetDocumentSummaryTool(context),
        analyzeData: createAnalyzeDataTool(context)
    };
}
