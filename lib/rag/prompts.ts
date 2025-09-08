import { z } from 'zod';
import { PromptTemplateCache } from './utils/lruCache';
import { RAGError } from './errors';

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
  "reasoning": "The content directly addresses the query with specific financial data",
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
                reasoning: z.string(),
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
            id: 'document-grading-batch',
            version: '2.0',
            description: 'Batch grade multiple documents for efficiency',
            prompt: `Rate relevance of each document to the query.

Query: "{{query}}"

Documents:
{{documents}}

Rate each document 0-1 for relevance. Format: [1]: 0.8, [2]: 0.3, etc.

Be generous - include if content helps answer query, even partially.

IMPORTANT: Return ONLY the actual ratings data, NOT a JSON schema. The response should contain the real values, not schema definitions.

EXAMPLE OUTPUT FORMAT:
{
  "ratings": [
    {
      "index": 1,
      "relevanceScore": 0.8,
      "isRelevant": true,
      "reasoning": "Contains specific financial data requested"
    },
    {
      "index": 2,
      "relevanceScore": 0.3,
      "isRelevant": false,
      "reasoning": "Only general background information"
    }
  ]
}`,
            variables: ['query', 'documents'],
            schema: z.object({
                ratings: z.array(z.object({
                    index: z.number(),
                    relevanceScore: z.number().min(0).max(1),
                    isRelevant: z.boolean(),
                    reasoning: z.string()
                }))
            }),
            optimization: {
                maxTokens: 300,
                model: 'gpt-5-nano'
            }
        });

        // ============================================================================
        // QUERY ROUTING PROMPTS (Optimized for accurate strategy selection)
        // ============================================================================

        this.registerTemplate({
            id: 'query-routing-logical',
            version: '3.0',
            description: 'Universal query routing that works for any domain and query type',
            prompt: `Analyze the query and determine the best search strategy for ANY domain.

Query: "{{query}}"

UNIVERSAL QUERY ANALYSIS:
Analyze the query to determine:
1. Query Type: What kind of information is being requested?
2. Complexity: How complex is the query?
3. Search Strategy: What search approach will work best?

QUERY TYPES (Universal):
- factual: Looking for specific facts, data, or information
- analytical: Requires analysis, comparison, or interpretation
- procedural: Asking about processes, steps, or procedures
- definitional: Seeking definitions, explanations, or clarifications
- comparative: Comparing different items, concepts, or options
- temporal: Time-based questions (when, how long, etc.)
- numerical: Questions about numbers, amounts, statistics
- conversational: Greetings, casual conversation, general chat
- legal: Legal terms, regulations, contracts (if legal domain detected)
- technical: Technical specifications, requirements (if technical domain detected)
- medical: Medical terms, diagnoses, treatments (if medical domain detected)
- business: Business data, strategies, metrics (if business domain detected)
- academic: Academic concepts, research, methodology (if academic domain detected)

SEARCH STRATEGIES:
- semantic: Best for conceptual questions, definitions, explanations
- keyword: Best for specific terms, names, exact matches
- hybrid: Best for complex questions requiring both semantic and keyword search
- structured: Best for data-heavy questions, specifications, requirements
- general: Best for conversational queries, greetings, general questions

COMPLEXITY LEVELS:
- low: Simple questions, greetings, basic facts
- medium: Questions requiring some analysis or multiple pieces of information
- high: Complex questions requiring deep analysis, multiple sources, or specialized knowledge

ADAPTIVE DOMAIN DETECTION:
- Automatically detect if query relates to specific domains
- Adjust strategy based on detected domain
- For legal queries: Use structured search for precise references
- For technical queries: Use hybrid search for specifications
- For medical queries: Use semantic search for concepts
- For business queries: Use keyword search for data/metrics
- For academic queries: Use semantic search for concepts
- For general queries: Use appropriate strategy based on complexity

Provide the best routing decision for this query.`,
            variables: ['query'],
            schema: z.object({
                queryType: z.enum(['factual', 'analytical', 'procedural', 'definitional', 'comparative', 'temporal', 'numerical', 'conversational', 'legal', 'technical', 'medical', 'business', 'academic']),
                complexity: z.enum(['low', 'medium', 'high']),
                searchStrategy: z.enum(['semantic', 'keyword', 'hybrid', 'structured', 'general']),
                reasoning: z.string(),
                detectedDomain: z.string().optional(),
                confidence: z.number().min(0).max(1)
            }),
            optimization: {
                maxTokens: 200,
                model: 'gpt-4o-mini'
            }
        });

        this.registerTemplate({
            id: 'rag-response-system',
            version: '5.0',
            description: 'Specialized AI assistant for DocSend with strict reasoning process and structured output',
            prompt: `<persona>
You are a specialized AI assistant for DocSend, an expert in precise document analysis. Your purpose is to provide users with accurate, verifiable answers derived exclusively from the documents they have uploaded. You are meticulous, trustworthy, and you never provide information that cannot be directly substantiated by the provided text.
</persona>

<objective>
Your primary objective is to answer the user's question by following a strict reasoning process. You must analyze the provided <context> and generate a structured response containing a precise answer, the reasoning behind it, and verifiable source citations.
</objective>

<rules>
1. **Grounding is Absolute:** You MUST base your answer 100% on the information within the provided <context> tags. Do NOT use any external knowledge or make assumptions.
2. **Honesty Above All:** If the context does not contain the information needed to answer the question, you MUST state this clearly. Never invent or infer answers.
3. **Citation is Mandatory:** Every piece of information in your answer MUST be accompanied by a precise citation.
4. **No Garbage IDs:** You MUST use the human-readable document names from the <sources> list for citations. Never use system IDs like 'cmect6ykm0015uj44j4391x31'.
</rules>

<thought_process>
Before generating the final response, you MUST follow these internal steps. This is your internal monologue and is not to be included in the final output.

Step 1: **Analyze the Query.** Deconstruct the user's question to understand the core intent. Identify key entities, dates, and the specific information being requested.

Step 2: **Scan Context for Keywords.** Perform a keyword search within the <context> to find potentially relevant passages.

Step 3: **Find & Verify Direct Evidence.** Scrutinize the passages found in Step 2.
    - Locate the EXACT sentence(s) or table row(s) that directly address the user's query.
    - Quote these sentences internally to yourself.
    - Verify that these quotes are not taken out of context and accurately represent the information.

Step 4: **Evaluate Context Sufficiency.** Based on the verified evidence, make a critical decision:
    - **[Direct Answer]** Is there enough information to answer the user's question directly and completely?
    - **[Information Not Available]** Is the information completely absent from the context?
    - **[Helpful Alternative / Near-Miss]** Is the exact information requested absent, but closely related information is available? (e.g., user asks for 2022 data, but context has 2021 data).

Step 5: **Construct the Answer.**
    - If **[Direct Answer]**, formulate a clear and concise answer synthesized from the verified evidence.
    - If **[Information Not Available]**, state this clearly.
    - If **[Helpful Alternative]**, first state that the requested information is not available, and then provide the related information as a helpful alternative.

Step 6: **Format the Final Response.** Assemble the final response in markdown format, ensuring all citations are properly formatted and the answer is clear and verifiable.
</thought_process>

<output_format>
You MUST provide your response in markdown format with the following structure:

## Answer
[Your clear, concise answer to the user's question, synthesized from the context. If the information is not available, state this clearly and offer a helpful alternative if one exists.]

## Reasoning
[Brief explanation of how the answer was derived or why the information could not be found. For example: 'The answer was synthesized from the financial summary table.' or 'The document does not contain financial data for the requested year.']

## Sources
[List your sources in this format:]
- **[DocumentName@pPageNumber:LocationInfo]** - Brief description of what information was found here
- **[DocumentName@pPageNumber:LocationInfo]** - Brief description of what information was found here

**IMPORTANT:** 
- Use the EXACT document names from the <sources> list below
- Include precise location information (Section, Table, etc.) in citations
- Be honest about what information is available vs. what's missing
- If you cannot find the exact quote, state that the information is not available

Context from documents:
{{context}}

Sources used:
{{sources}}

User Question: "{{query}}"`,
            variables: ['context', 'sources', 'query'],
            optimization: {
                model: 'gpt-5-nano'
            }
        });

        this.registerTemplate({
            id: 'rag-fallback-response',
            version: '2.0',
            description: 'Fallback response when no relevant context is available',
            prompt: `You are a helpful document assistant. You can only answer questions based on information in the available documents.

IMPORTANT: You do not have any relevant information to answer this specific question: "{{query}}"

Please respond with:
1. Acknowledge that the specific information is not available
2. Explain what types of documents are available (if known)
3. Suggest what kind of information might be found in the documents
4. Be helpful and professional

Available document types: {{documentTypes}}`,
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
- Include source references where appropriate

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
                    sourceDocuments: z.array(z.string())
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
    "sourceChunkIds": ["1"]
  },
  "branches": [
    {
      "title": "Key Section",
      "content": "Section content",
      "relevanceScore": 0.8,
      "compressionPriority": "preserve",
      "sourceChunkIds": ["2"]
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
                    sourceChunkIds: z.array(z.string()).optional()
                }),
                branches: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    relevanceScore: z.number().min(0).max(1),
                    compressionPriority: z.enum(['preserve', 'compress', 'remove']),
                    sourceChunkIds: z.array(z.string()).optional()
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
- Preserve source references
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
            id: 'clarifying-queries',
            version: '1.0',
            description: 'Generate clarifying queries for recursive retrieval when initial search results are insufficient',
            prompt: `You are an expert search query generator.

Based on the original query and the context from previous search results, generate 2-3 clarifying queries that would help find more relevant information.

ORIGINAL QUERY: "{{originalQuery}}"

PREVIOUS SEARCH CONTEXT:
{{resultContext}}

SEARCH HISTORY:
{{searchHistory}}

GUIDELINES:
- Focus on specific aspects mentioned in the original query
- Use different terminology or synonyms
- Break down complex queries into simpler parts
- Consider alternative phrasings
- Generate {{maxQueries}} queries maximum

Return ONLY valid JSON with this structure:
{
  "clarifyingQueries": ["query1", "query2", "query3"]
}

Generate clarifying queries:`,
            variables: ['originalQuery', 'resultContext', 'searchHistory', 'maxQueries'],
            schema: z.object({
                clarifyingQueries: z.array(z.string()).min(1).max(3)
            }),
            optimization: {
                maxTokens: 150,
                model: 'gpt-4o-mini'
            }
        });

        this.registerTemplate({
            id: 'unified-query-analysis',
            version: '4.0',
            description: 'Enhanced unified query analysis with integrated query rewriting based on complexity score',
            prompt: `Analyze the following user query for:

1. Sanitization: Return a sanitized version, check for basic toxicity or scripting/XSS. Assign a sanitizationLevel: "safe", "suspicious", or "blocked".
2. Query Classification: Detect if query is abusive, chitchat, or a legitimate document question. Generate a personalized response based on the user's actual query content.
3. Complexity Analysis: Assess how complex the query is (low, medium, high) and word count.
4. Query Extraction: Extract page numbers, document names, and main keywords (3–8, lowercase, unique).
5. Query Rewriting: Generate 3-5 rewritten queries for medium+ complexity, plus Hyde hypothetical answer for high complexity.

Return ONLY valid JSON with this structure:
{
  "sanitization": {
    "isValid": boolean,
    "sanitizedQuery": string,
    "toxicityScore": number,
    "sanitizationLevel": "safe|suspicious|blocked"
  },
  "queryClassification": {
    "type": "abusive|chitchat|document_question",
    "intent": "extraction|summarization|comparison|concept_explanation|analysis|verification|general_inquiry",
    "confidence": number,
    "response": string,
    "requiresExpansion": boolean,
    "optimalContextSize": "small|medium|large",
    "processingStrategy": "precise|comprehensive|comparative|analytical"
  },
  "complexityAnalysis": {
    "complexityScore": number, // Must be between 0.0 and 1.0 (0.0 = simple, 1.0 = complex)
    "complexityLevel": "low|medium|high",
    "wordCount": number
  },
  "queryExtraction": {
    "pageNumbers": [number],
    "keywords": [string]
  },
  "queryRewriting": {
    "rewrittenQueries": [string], // Dynamic count based on intent and complexity
    "hydeAnswer": string, // Hypothetical answer for high complexity (empty for low/medium)
    "generatedQueryCount": number, // Actual number of queries generated
    "expansionStrategy": "minimal|moderate|comprehensive", // Based on intent and complexity
    "requiresHyde": boolean, // Whether Hyde answer is needed
    "contextWindowHint": "focused|balanced|broad" // Context size recommendation
  }
}

QUERY CLASSIFICATION GUIDELINES:
- "abusive": Spam, inappropriate content, suspicious patterns, too short/long queries
- "chitchat": Greetings, farewells, thanks, small talk, social conversation
- "document_question": Legitimate questions about documents, content, or information

RESPONSE GUIDELINES:
- For "abusive" queries: Acknowledge their concern professionally, then redirect to document assistance. Be empathetic but firm.
- For "chitchat" queries: Respond warmly to their greeting/small talk, then naturally guide them toward document questions. Match their tone.
- For "document_question" queries: Set response to "Answer the user's question about their documents"

IMPORTANT: The response should be personalized based on the user's actual query. Do not use generic responses. Acknowledge what they said and respond appropriately.

INTENT CLASSIFICATION GUIDELINES:
- "extraction": Specific data points, exact figures, precise information (e.g., "What was the exact revenue?", "Show me the contract terms")
- "summarization": Overview, summary, general understanding (e.g., "Summarize Q3 performance", "Give me an overview")
- "comparison": Comparing two or more items, periods, or concepts (e.g., "How did Q3 compare to Q2?", "What's the difference between plans A and B?")
- "concept_explanation": Understanding concepts, definitions, explanations (e.g., "What is a CUSIP?", "Explain the liability terms")
- "analysis": Deep analysis, trends, patterns, insights (e.g., "Analyze the revenue trends", "What patterns do you see?")
- "verification": Confirming facts, checking information (e.g., "Is this correct?", "Verify the numbers")
- "general_inquiry": General questions, exploration, discovery (e.g., "What information is available?", "Tell me about the company")

INTENT-BASED PROCESSING:
- "extraction": requiresExpansion=false, optimalContextSize=small, processingStrategy=precise
- "summarization": requiresExpansion=true, optimalContextSize=large, processingStrategy=comprehensive
- "comparison": requiresExpansion=true, optimalContextSize=medium, processingStrategy=comparative
- "concept_explanation": requiresExpansion=false, optimalContextSize=medium, processingStrategy=analytical
- "analysis": requiresExpansion=true, optimalContextSize=large, processingStrategy=analytical
- "verification": requiresExpansion=false, optimalContextSize=small, processingStrategy=precise
- "general_inquiry": requiresExpansion=true, optimalContextSize=medium, processingStrategy=comprehensive

EXAMPLES OF INTELLIGENT FIELD VALUES:

**Extraction Intent Example:**
- Query: "What was the exact revenue in Q3 2023?"
- requiresExpansion: false
- optimalContextSize: "small"
- processingStrategy: "precise"
- expansionStrategy: "minimal"
- contextWindowHint: "focused"
- generatedQueryCount: 2

**Summarization Intent Example:**
- Query: "Summarize our Q3 2023 financial performance"
- requiresExpansion: true
- optimalContextSize: "large"
- processingStrategy: "comprehensive"
- expansionStrategy: "comprehensive"
- contextWindowHint: "broad"
- generatedQueryCount: 6

**Comparison Intent Example:**
- Query: "How did Q3 2023 compare to Q2 2023?"
- requiresExpansion: true
- optimalContextSize: "medium"
- processingStrategy: "comparative"
- expansionStrategy: "moderate"
- contextWindowHint: "balanced"
- generatedQueryCount: 4

**Response Examples:**
- Chitchat: "Hi there! Good morning to you too! I'm here to help you with your documents. What would you like to know about your files today?"
- Abusive: "I understand you may be frustrated, but I'm designed to help with document-related questions. How can I assist you with your documents today?"
- Document Question: "Answer the user's question about their documents"

**Personalization Guidelines:**
- If user says "Hi" → "Hi! How can I help you with your documents today?"
- If user says "Good morning" → "Good morning! What can I help you find in your documents?"
- If user says "Thanks" → "You're welcome! Is there anything else I can help you with regarding your documents?"
- If user asks about weather → "I can't help with weather info, but I'm great with documents! What would you like to know about your files?"
- If user asks about programming → "I specialize in document assistance. How can I help you with your documents instead?"


COMPLEXITY SCORING GUIDELINES:
- complexityScore: Must be a decimal between 0.0 and 1.0
  * 0.0-0.3: Simple queries (basic questions, single concepts)
  * 0.4-0.7: Medium complexity (multi-part questions, comparisons)
  * 0.8-1.0: High complexity (analytical, research-style, multi-step reasoning)

INTELLIGENT QUERY REWRITING GUIDELINES:
- **Dynamic Query Count**: Let the LLM decide optimal number based on intent and complexity
- **Intent-Based Expansion**:
  * extraction: 1-3 queries (minimal, focused)
  * summarization: 5-8 queries (comprehensive, broad)
  * comparison: 4-6 queries (moderate, balanced)
  * concept_explanation: 2-4 queries (moderate, focused)
  * analysis: 6-8 queries (comprehensive, analytical)
  * verification: 1-2 queries (minimal, precise)
  * general_inquiry: 3-5 queries (moderate, balanced)

- **Complexity + Intent Combination**:
  * Low + extraction: 1-2 queries, no Hyde
  * Low + summarization: 3-4 queries, no Hyde
  * Medium + any: 3-6 queries, no Hyde
  * High + extraction: 3-4 queries + Hyde
  * High + summarization: 6-8 queries + Hyde
  * High + comparison: 5-7 queries + Hyde
  * High + analysis: 7-8 queries + Hyde

- **Expansion Strategy Selection**:
  * "minimal": 1-3 queries for precise extraction/verification
  * "moderate": 3-6 queries for balanced coverage
  * "comprehensive": 6-8 queries for thorough analysis/summarization

- **Context Window Hints**:
  * "focused": Small context for precise answers
  * "balanced": Medium context for balanced coverage
  * "broad": Large context for comprehensive understanding

For Hyde Generation (High Complexity):
- Generate Hyde hypothetical answer that:
  * Provides a realistic, detailed answer to the query
  * Includes specific facts, numbers, dates, and details
  * Uses professional, authoritative tone
  * Is comprehensive but focused on the specific query
  * Helps improve document retrieval through hypothetical document embeddings

QUERY REWRITING EXAMPLES:
- Original: "What was our Q3 revenue growth compared to last year?
"
- Rewritten: ["Q3 2024 financial report revenue", "Q3 2023
revenue performance", "quarterly revenue comparison Q3", "Q3
revenue growth analysis"]

- Original: "Show me the legal terms in section 3.2"
- Rewritten: ["section 3.2 legal terms", "legal terms section 3.
2", "terms and conditions section 3.2", "legal provisions 3.2"]

QUERY EXTRACTION GUIDELINES:
- pageNumbers: Extract any page numbers mentioned in the query.
- keywords: Extract 3–8 main meaningful words for keyword-based search (lowercase, unique)

IMPORTANT: 
1. You MUST return ONLY valid JSON. Do not include any other text, explanations, or markdown formatting. The response must be parseable JSON.
2. The 'response' field should be personalized based on the user's actual query. Do not use generic responses.
3. For chitchat, acknowledge what they said and respond naturally before redirecting to documents.
4. For abusive queries, be empathetic but firm in redirecting to document assistance.

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

// Export singleton instance
export const promptManager = PromptManager.getInstance();

// Export commonly used prompt IDs for easy access
export const PROMPT_IDS = {
    DOCUMENT_GRADING_SINGLE: 'document-grading-single',
    DOCUMENT_GRADING_BATCH: 'document-grading-batch',
    QUERY_ROUTING_LOGICAL: 'query-routing-logical',
    RAG_RESPONSE_SYSTEM: 'rag-response-system',
    RAG_FALLBACK_RESPONSE: 'rag-fallback-response',
    // RAPTOR Compression Prompts
    RAPTOR_DOCUMENT_SUMMARY: 'raptor-document-summary',
    RAPTOR_HIERARCHICAL_SUMMARY: 'raptor-hierarchical-summary',
    RAPTOR_TREE_STRUCTURE: 'raptor-tree-structure',
    RAPTOR_MULTI_LEVEL_COMPRESSION: 'raptor-multi-level-compression',
    // Clarifying Queries
    CLARIFYING_QUERIES: 'clarifying-queries',
    // Unified Query Analysis
    UNIFIED_QUERY_ANALYSIS: 'unified-query-analysis',

} as const;
