import { z } from 'zod';
import { PromptTemplateCache } from './utils/lruCache';
import { RAGError } from './errors/rag-errors';

export interface PromptTemplate {
    id: string;
    version: string;
    description: string;
    prompt: string;
    schema?: z.ZodSchema<any>;
    variables?: string[];
    optimization?: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    };
}


export class PromptManager {
    private static instance: PromptManager;
    private templates = new PromptTemplateCache();

    private constructor() {
        this.initializePrompts();
    }

    static getInstance(): PromptManager {
        if (!PromptManager.instance) {
            PromptManager.instance = new PromptManager();
        }
        return PromptManager.instance;
    }

    private initializePrompts() {
        this.registerTemplate({
            id: 'document-grading-single',
            version: '3.0',
            description: 'Universal document grading that works for any domain and document type',
            prompt: `Rate document relevance to query and capture metadata for citations.

Query: "{{query}}"
Content: {{content}}
Document Name: {{documentName}}
Page Number: {{pageNumber}}
Similarity: {{similarity}}

UNIVERSAL RELEVANCE SCORING (Works for ANY domain):
Rate 0-1: How relevant is this content to answering the query?
- 0.9-1.0: Direct answer, specific reference, exact match
- 0.7-0.8: Relevant context/details, related information
- 0.5-0.6: Somewhat related, general information
- 0.3-0.4: Tangentially related, background information
- 0.0-0.2: Not relevant

ADAPTIVE DOMAIN HANDLING:
- Automatically detect document domain from content
- For legal documents: Look for articles, sections, clauses, definitions
- For medical documents: Look for diagnoses, treatments, symptoms, results
- For technical documents: Look for specifications, procedures, requirements
- For business documents: Look for data, metrics, strategies, plans
- For academic documents: Look for chapters, sections, references, methodology
- For any other domain: Look for domain-specific terminology and structure

METADATA CAPTURE:
- Document Name: Use actual document name from metadata
- Page Number: Capture the page where information is found
- Specific Location: Identify section, paragraph, or relevant identifier
- Be generous - include if content helps answer query, even partially

Consider: Does this content contain the specific information requested, regardless of domain?

IMPORTANT: Return ONLY the actual grading data, NOT a JSON schema. The response should contain the real values, not schema definitions.

EXAMPLE OUTPUT FORMAT:
{
  "relevanceScore": 0.8,
  "confidence": 0.9,
  "isRelevant": true,
  "suggestedWeight": 0.75,
  "documentName": "Annual Report 2023",
  "pageNumber": 15,
  "specificLocation": "Financial Summary Section",
  "detectedDomain": "business"
}`,
            variables: ['query', 'content', 'documentName', 'pageNumber', 'similarity'],
            schema: z.object({
                relevanceScore: z.number().min(0).max(1),
                confidence: z.number().min(0).max(1),
                isRelevant: z.boolean(),
                suggestedWeight: z.number().min(0).max(1),
                documentName: z.string(),
                pageNumber: z.number().optional(),
                specificLocation: z.string().optional(),
                detectedDomain: z.string().optional()
            }),
            optimization: {
                maxTokens: 150,
                model: 'gpt-5-nano'
            }
        });



        this.registerTemplate({
            id: 'rag-response-system',
            version: '7.0',
            description: 'Production-optimized RAG assistant with core grounding instructions',
            prompt: `# CORE DIRECTIVE: DOCUMENT ANALYSIS SPECIALIST

You are "papermarkDocBot", a specialized AI assistant for document analysis. Your entire knowledge base is strictly limited to the context provided in each query. You do not have opinions, general knowledge, or the ability to access external information.

## PRIMARY DIRECTIVE: CONTEXTUAL GROUNDING

Your primary directive is to answer the user's question using ONLY the information contained within the provided <context> blocks. Do not, under any circumstances, use information from your own training data or any external sources.

## SAFE ESCAPE HATCH

If, and only if, the provided context does not contain the information needed to answer the question, you MUST respond with the exact phrase: 'I'm sorry, but I could not find the answer to your question in the provided documents.' Do not attempt to infer, guess, or create an answer.

## EVIDENCE-BASED REASONING

Structure your answer in two parts:
1. **Direct Answer:** Provide a direct and concise answer to the user's question
2. **Evidence Section:** Quote the exact sentences or data points from the context that support your answer

<context>
{{context}}
</context>

<question>
{{query}}
</question>

## RESPONSE FORMAT

### Answer
[Your direct, factual answer based solely on the provided context]

### Evidence
[Quote the exact text from the context that supports your answer. If performing calculations, show the formula and values used.]

## CRITICAL REQUIREMENTS
- **Context-Only:** Use ONLY information from the provided context
- **No Hallucinations:** If information is missing, use the exact escape phrase
- **Evidence-Based:** Always show your work and cite sources
- **Precise Language:** Be factual and professional
- **Structured Response:** Follow the two-part format above

Remember: You are papermarkDocBot, a document analysis specialist. Your knowledge is limited to the provided context.`,
            variables: ['context', 'query'],
            optimization: {
                model: 'gpt-5-nano'
            }
        });

        this.registerTemplate({
            id: 'rag-fallback-response',
            version: '3.0',
            description: 'Production-optimized fallback response with core grounding',
            prompt: `# CORE DIRECTIVE: DOCUMENT ANALYSIS SPECIALIST

You are "papermarkDocBot", a specialized AI assistant for document analysis. Your entire knowledge base is strictly limited to the context provided in each query.

## SAFE ESCAPE HATCH

You MUST respond with the exact phrase: 'I'm sorry, but I could not find the answer to your question in the provided documents.'

## FALLBACK RESPONSE

Since no relevant context is available for the question: "{{query}}"

You must use the exact escape phrase above. Do not attempt to:
- Provide general knowledge answers
- Make suggestions about what might be in documents
- Offer alternative information
- Use your training data

## CRITICAL REQUIREMENTS
- **Exact Phrase Only:** Use the exact escape phrase provided
- **No Additional Content:** Do not add explanations or suggestions
- **No Hallucinations:** Do not provide any information not in the context
- **Professional Tone:** Maintain a helpful but constrained persona

Remember: You are papermarkDocBot, limited to the provided context only.`,
            variables: ['query', 'documentTypes'],
            optimization: {
                model: 'gpt-5-nano'
            }
        });

        this.registerTemplate({
            id: 'raptor-document-summary',
            version: '1.0',
            description: 'Generate abstractive document summaries for RAPTOR compression',
            prompt: `Create a comprehensive summary of this document content that directly addresses the user query.

Query: "{{query}}"
Document Content: {{content}}
Document Metadata: {{metadata}}

SUMMARIZATION GUIDELINES:
1. Focus on information directly relevant to the query
2. Preserve key facts, data, and important details
3. Maintain logical structure and flow
4. Include specific examples, numbers, or references when available
5. Use clear, concise language
6. Ensure the summary is self-contained and informative

CRITICAL SCORING REQUIREMENTS:
- relevanceScore: MUST be a decimal between 0.0 and 1.0
- Examples: 0.8, 0.95, 0.6, 0.3, 0.1
- DO NOT use: 5, 10, 80, 100, or any number above 1.0
- Use 0.0 for completely irrelevant, 1.0 for perfectly relevant
- confidence: MUST be a decimal between 0.0 and 1.0
- Examples: 0.9, 0.85, 0.75, 0.6

IMPORTANT: Return ONLY the actual summary data, NOT a JSON schema. The response should contain the real content, not schema definitions.

Generate a summary that captures the essential information needed to answer the query while maintaining document context.`,
            variables: ['query', 'content', 'metadata'],
            schema: z.object({
                summary: z.string(),
                keyPoints: z.array(z.string()),
                relevanceScore: z.number().min(0).max(1),
                confidence: z.number().min(0).max(1)
            }),
            optimization: {
                maxTokens: 500,
                model: 'gpt-4o-mini'
            }
        });

        this.registerTemplate({
            id: 'raptor-hierarchical-summary',
            version: '1.0',
            description: 'Create hierarchical summaries for multi-document RAPTOR compression',
            prompt: `Create a hierarchical summary that organizes information from multiple documents into a coherent structure.

Query: "{{query}}"
Documents: {{documents}}

HIERARCHICAL ORGANIZATION:
1. Main Topic/Theme: Identify the primary subject
2. Key Categories: Group related information into logical categories
3. Supporting Details: Include specific facts, examples, and data points
4. Cross-Document Connections: Highlight relationships between documents
5. Query-Specific Focus: Emphasize information directly relevant to the query

STRUCTURE:
- Use clear headings and subheadings
- Group related information together
- Maintain logical flow from general to specific

CRITICAL SCORING REQUIREMENTS:
- relevanceScore: MUST be a decimal between 0.0 and 1.0
- Examples: 0.8, 0.95, 0.6, 0.3, 0.1
- confidence: MUST be a decimal between 0.0 and 1.0

IMPORTANT: Return ONLY the actual summary data, NOT a JSON schema. The response should contain the real content, not schema definitions.

Generate a structured summary that provides comprehensive coverage while remaining focused on the query.`,
            variables: ['query', 'documents'],
            schema: z.object({
                mainTopic: z.string(),
                categories: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    relevanceScore: z.number().min(0).max(1),
                })),
                overallSummary: z.string(),
                keyInsights: z.array(z.string()),
                confidence: z.number().min(0).max(1)
            }),
            optimization: {
                maxTokens: 600,
                model: 'gpt-4o-mini'
            }
        });

        this.registerTemplate({
            id: 'raptor-tree-structure',
            version: '1.0',
            description: 'Generate tree-based document structure for RAPTOR compression',
            prompt: `Analyze the document content and create a hierarchical tree structure for efficient compression.

Query: "{{query}}"
Document Content: {{content}}

TREE STRUCTURE ANALYSIS:
1. Root Node: Main topic or theme
2. Branch Nodes: Major sections or categories
3. Leaf Nodes: Specific details, facts, or examples
4. Relevance Scoring: Rate each node's importance to the query
5. Compression Priority: Determine which nodes to preserve or compress

STRUCTURE GUIDELINES:
- Create logical hierarchy based on content organization
- Identify parent-child relationships between concepts
- Score each node for query relevance (0-1)
- Mark nodes for preservation, compression, or removal
- Maintain semantic coherence in the tree structure

CRITICAL SCORING REQUIREMENTS:
- relevanceScore: MUST be a decimal between 0.0 and 1.0
- Examples: 0.8, 0.95, 0.6, 0.3, 0.1
- DO NOT use: 5, 10, 80, 100, or any number above 1.0

REQUIRED OUTPUT FIELDS:
- compressionStrategy: String describing the compression approach used (e.g., "hierarchical", "relevance-based", "semantic")
- estimatedCompressionRatio: Number between 0.0 and 1.0 indicating expected compression (0.0 = no compression, 1.0 = maximum compression)

IMPORTANT: Return ONLY the actual tree structure data, NOT a JSON schema. The response should contain the real content, not schema definitions.

Generate a tree structure that enables efficient hierarchical compression while preserving query-relevant information.

EXAMPLE OUTPUT STRUCTURE:
{
  "rootNode": {
    "title": "Main Topic",
    "content": "Main content summary",
    "relevanceScore": 0.9,
    "compressionPriority": "preserve",
  },
  "branches": [
    {
      "title": "Key Section",
      "content": "Section content",
      "relevanceScore": 0.8,
      "compressionPriority": "preserve",
    }
  ],
  "compressionStrategy": "hierarchical relevance-based",
  "estimatedCompressionRatio": 0.7
}`,
            variables: ['query', 'content'],
            schema: z.object({
                rootNode: z.object({
                    title: z.string(),
                    content: z.string(),
                    relevanceScore: z.number().min(0).max(1),
                    compressionPriority: z.enum(['preserve', 'compress', 'remove']),
                }),
                branches: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    relevanceScore: z.number().min(0).max(1),
                    compressionPriority: z.enum(['preserve', 'compress', 'remove']),
                })),
                compressionStrategy: z.string(),
                estimatedCompressionRatio: z.number().min(0).max(1)
            }),
            optimization: {
                maxTokens: 400,
                model: 'gpt-4o-mini'
            }
        });

        this.registerTemplate({
            id: 'raptor-multi-level-compression',
            version: '1.0',
            description: 'Perform multi-level compression using RAPTOR tree structure',
            prompt: `Compress the document content using the RAPTOR tree structure while preserving query-relevant information.

Query: "{{query}}"
Tree Structure: {{treeStructure}}
Compression Level: {{compressionLevel}}

COMPRESSION GUIDELINES:
1. Preserve high-relevance nodes (relevanceScore >= 0.7)
2. Compress medium-relevance nodes (0.4 <= relevanceScore < 0.7)
3. Remove low-relevance nodes (relevanceScore < 0.4)
4. Maintain logical flow and coherence
5. Preserve specific facts, numbers, and examples
6. Ensure the compressed content directly answers the query

COMPRESSION TECHNIQUES:
- Summarize detailed explanations
- Combine related concepts
- Remove redundant information
- Maintain hierarchical structure

CRITICAL SCORING REQUIREMENTS:
- finalCompressionRatio: MUST be a decimal between 0.0 and 1.0
- qualityScore: MUST be a decimal between 0.0 and 1.0
- Examples: 0.8, 0.95, 0.6, 0.3, 0.1
- DO NOT use: 5, 10, 80, 100, or any number above 1.0

IMPORTANT: Return ONLY the actual compressed content data, NOT a JSON schema. The response should contain the real content, not schema definitions.

Generate compressed content that maximizes information density while preserving query-relevant details.`,
            variables: ['query', 'treeStructure', 'compressionLevel'],
            schema: z.object({
                compressedContent: z.string(),
                preservedNodes: z.array(z.string()),
                compressedNodes: z.array(z.string()),
                removedNodes: z.array(z.string()),
                finalCompressionRatio: z.number().min(0).max(1),
                qualityScore: z.number().min(0).max(1)
            }),
            optimization: {
                maxTokens: 800,
                model: 'gpt-4o-mini'
            }
        });


        this.registerTemplate({
            id: 'unified-query-analysis',
            version: '4.0',
            description: 'Enhanced unified query analysis with integrated query rewriting based on complexity score',
            prompt: `Analyze this query and return JSON:

1. Sanitize: Fix typos, check toxicity. Level: "safe|suspicious|blocked"
2. Classify: "abusive|chitchat|document_question"
3. Intent: "extraction|summarization|comparison|concept_explanation|analysis|verification|general_inquiry"
4. Complexity: 0.0-1.0 score, "low|medium|high" level
5. Extract: page numbers and keywords
6. Rewrite: Generate queries ONLY if complexity > 0.6 OR intent requires expansion

Return JSON:
{
  "sanitization": {"isValid": boolean, "sanitizedQuery": string, "toxicityScore": number, "sanitizationLevel": "safe|suspicious|blocked"},
  "queryClassification": {"type": "abusive|chitchat|document_question", "intent": "extraction|summarization|comparison|concept_explanation|analysis|verification|general_inquiry", "confidence": number, "response": string, "requiresExpansion": boolean, "optimalContextSize": "small|medium|large", "processingStrategy": "precise|comprehensive|comparative|analytical"},
  "complexityAnalysis": {"complexityScore": number, "complexityLevel": "low|medium|high", "wordCount": number},
  "queryExtraction": {"pageNumbers": [number], "keywords": [string]},
  "queryRewriting": {"rewrittenQueries": [string], "hydeAnswer": "", "generatedQueryCount": number, "expansionStrategy": "minimal|moderate|comprehensive", "requiresHyde": false, "contextWindowHint": "focused|balanced|broad", "shouldRewrite": boolean}
}

Rules:
- extraction: requiresExpansion=false, optimalContextSize=small, shouldRewrite=false
- summarization: requiresExpansion=true, optimalContextSize=large, shouldRewrite=true
- comparison: requiresExpansion=true, optimalContextSize=medium, shouldRewrite=true
- analysis: requiresExpansion=true, optimalContextSize=large, shouldRewrite=true
- verification: requiresExpansion=false, optimalContextSize=small, shouldRewrite=false
- general_inquiry: requiresExpansion=true, optimalContextSize=medium, shouldRewrite=complexity>0.6

Response Rules:
- abusive: response="I'm sorry, but I could not find the answer to your question in the provided documents."
- chitchat: response="I'm sorry, but I could not find the answer to your question in the provided documents."
- document_question: response="Proceed with document analysis"

Query Rewriting Rules:
- Only rewrite if shouldRewrite=true OR complexityScore > 0.6
- Simple extraction/verification: 0 rewritten queries
- Medium complexity: 1-2 rewritten queries
- High complexity: 2-3 rewritten queries

HyDE (Hypothetical Document Embeddings) Rules:
- Generate hydeAnswer if requiresHyde=true OR complexityScore > 0.7
- HyDE should be a 2-3 sentence hypothetical answer to the query
- Use for complex queries where direct search might miss relevant content
- Focus on the type of information the user is looking for

Query: "{{query}}"`,
            variables: ['query'],
            schema: z.object({
                sanitization: z.object({
                    isValid: z.boolean(),
                    sanitizedQuery: z.string(),
                    toxicityScore: z.number().min(0).max(1),
                    sanitizationLevel: z.enum(['safe', 'suspicious', 'blocked'])
                }),
                queryClassification: z.object({
                    type: z.enum(['abusive', 'chitchat', 'document_question']),
                    intent: z.enum(['extraction', 'summarization', 'comparison', 'concept_explanation', 'analysis', 'verification', 'general_inquiry']),
                    confidence: z.number().min(0).max(1),
                    response: z.string(),
                    requiresExpansion: z.boolean(),
                    optimalContextSize: z.enum(['small', 'medium', 'large']),
                    processingStrategy: z.enum(['precise', 'comprehensive', 'comparative', 'analytical'])
                }),
                complexityAnalysis: z.object({
                    complexityScore: z.number().min(0).max(1),
                    complexityLevel: z.enum(['low', 'medium', 'high']),
                    wordCount: z.number()
                }),
                queryExtraction: z.object({
                    pageNumbers: z.array(z.number()),
                    keywords: z.array(z.string())
                }),
                queryRewriting: z.object({
                    rewrittenQueries: z.array(z.string()),
                    hydeAnswer: z.string(),
                    generatedQueryCount: z.number(),
                    expansionStrategy: z.enum(['minimal', 'moderate', 'comprehensive']),
                    requiresHyde: z.boolean(),
                    contextWindowHint: z.enum(['focused', 'balanced', 'broad'])
                })
            }),
            optimization: {
                maxTokens: 300,
                model: 'gpt-4o-mini'
            }
        });


    }

    async registerTemplate(template: PromptTemplate) {
        await this.templates.set(template.id, template);
    }

    async getTemplate(id: string): Promise<PromptTemplate | undefined> {
        return await this.templates.get(id) as PromptTemplate | undefined;
    }

    async renderTemplate(id: string, variables: Record<string, any>): Promise<string> {
        const template = await this.getTemplate(id);
        if (!template) {
            throw RAGError.create('templateNotFound', undefined, { templateId: id });
        }

        let prompt = template.prompt;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
        }

        return prompt;
    }

    async getAllTemplates(): Promise<PromptTemplate[]> {
        const templates: PromptTemplate[] = [];
        const keys = Array.from(this.templates.keys());
        for (const key of keys) {
            const template = await this.templates.get(key);
            if (template) {
                templates.push(template as PromptTemplate);
            }
        }
        return templates;
    }

    async getTemplateSchema(id: string): Promise<z.ZodSchema<any> | undefined> {
        const template = await this.getTemplate(id);
        return template?.schema;
    }

    async getTemplateOptimization(id: string): Promise<{ temperature?: number; model?: string } | undefined> {
        const template = await this.getTemplate(id);
        return template?.optimization;
    }
}

export const promptManager = PromptManager.getInstance();

export const PROMPT_IDS = {
    DOCUMENT_GRADING_SINGLE: 'document-grading-single',
    RAG_RESPONSE_SYSTEM: 'rag-response-system',
    RAG_FALLBACK_RESPONSE: 'rag-fallback-response',
    RAPTOR_DOCUMENT_SUMMARY: 'raptor-document-summary',
    RAPTOR_HIERARCHICAL_SUMMARY: 'raptor-hierarchical-summary',
    RAPTOR_TREE_STRUCTURE: 'raptor-tree-structure',
    RAPTOR_MULTI_LEVEL_COMPRESSION: 'raptor-multi-level-compression',
    UNIFIED_QUERY_ANALYSIS: 'unified-query-analysis',
} as const;
