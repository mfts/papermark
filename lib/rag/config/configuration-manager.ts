

export interface RAGConfig {
    grading: {
        relevanceThreshold: number;
        maxDocumentsToGrade: number;
    };

    generation: {
        temperature: number;
        maxTokens?: number;
    };

    llm: {
        model: string;
        temperature: number;
        timeout: number;
        retries: number;
    };

    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };

    search: {
        defaultTopK: number;
        defaultSimilarityThreshold: number;
        fastTopK: number;
        fastSimilarityThreshold: number;
        standardTopK: number;
        standardSimilarityThreshold: number;
        expandedTopK: number;
        expandedSimilarityThreshold: number;
    };

    reranker: {
        model: string;
        maxTokens: number;
        temperature: number;
        timeout: number;
        fallbackModel: string;
    };

    // Context Compression Configuration
    compression: {
        maxTokens: number;
        compressionRatio: number;
        preserveSpans: boolean;
        method: 'ranked' | 'raptor' | 'hybrid';
    };

    // Vector Search Configuration
    vectorSearch: {
        defaultTopK: number;
        defaultSimilarityThreshold: number;
        embeddingTimeout: number;
    };
}


export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private config: RAGConfig;

    private constructor() {
        this.config = this.loadConfiguration();
    }

    static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    private loadConfiguration(): RAGConfig {
        return {
            grading: {
                relevanceThreshold: this.getEnvNumber('RAG_GRADING_RELEVANCE_THRESHOLD', 0.05),
                maxDocumentsToGrade: this.getEnvNumber('RAG_GRADING_MAX_DOCUMENTS', 10),
            },

            generation: {
                temperature: this.getEnvNumber('RAG_GENERATION_TEMPERATURE', 0.1),
                maxTokens: this.getEnvNumber('RAG_GENERATION_MAX_TOKENS', 10000),
            },

            llm: {
                model: this.getEnvString('RAG_LLM_MODEL', 'gpt-4o-mini'),
                temperature: this.getEnvNumber('RAG_LLM_TEMPERATURE', 0.1),
                timeout: this.getEnvNumber('RAG_LLM_TIMEOUT', 60000), // 60 seconds for LLM calls
                retries: this.getEnvNumber('RAG_LLM_RETRIES', 3),
            },

            cache: {
                enabled: this.getEnvBoolean('RAG_CACHE_ENABLED', true),
                ttl: this.getEnvNumber('RAG_CACHE_TTL', 300000), // 5 minutes
                maxSize: this.getEnvNumber('RAG_CACHE_MAX_SIZE', 1000),
            },

            search: {
                defaultTopK: this.getEnvNumber('RAG_SEARCH_DEFAULT_TOP_K', 10),
                defaultSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_DEFAULT_SIMILARITY_THRESHOLD', 0.3),
                fastTopK: this.getEnvNumber('RAG_SEARCH_FAST_TOP_K', 2),
                fastSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_FAST_SIMILARITY_THRESHOLD', 0.5),
                standardTopK: this.getEnvNumber('RAG_SEARCH_STANDARD_TOP_K', 3),
                standardSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_STANDARD_SIMILARITY_THRESHOLD', 0.4),
                expandedTopK: this.getEnvNumber('RAG_SEARCH_EXPANDED_TOP_K', 4),
                expandedSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_EXPANDED_SIMILARITY_THRESHOLD', 0.3),
            },

            reranker: {
                model: this.getEnvString('RAG_RERANKER_MODEL', 'bge-reranker-large'),
                maxTokens: this.getEnvNumber('RAG_RERANKER_MAX_TOKENS', 512),
                temperature: this.getEnvNumber('RAG_RERANKER_TEMPERATURE', 0.1),
                timeout: this.getEnvNumber('RAG_RERANKER_TIMEOUT', 20000),
                fallbackModel: this.getEnvString('RAG_RERANKER_FALLBACK_MODEL', 'bge-reranker-base'),
            },

            compression: {
                maxTokens: this.getEnvNumber('RAG_COMPRESSION_MAX_TOKENS', 10000),
                compressionRatio: this.getEnvNumber('RAG_COMPRESSION_RATIO', 0.7),
                preserveSpans: this.getEnvBoolean('RAG_COMPRESSION_PRESERVE_SPANS', true),
                method: this.getEnvString('RAG_COMPRESSION_METHOD', 'ranked') as 'ranked' | 'raptor' | 'hybrid',
            },

            vectorSearch: {
                defaultTopK: this.getEnvNumber('RAG_VECTOR_SEARCH_DEFAULT_TOP_K', 10),
                defaultSimilarityThreshold: this.getEnvNumber('RAG_VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD', 0.3),
                embeddingTimeout: this.getEnvNumber('RAG_VECTOR_SEARCH_EMBEDDING_TIMEOUT', 20000),
            },
        };
    }

    /**
     * Get environment variable as number with validation
     */
    private getEnvNumber(key: string, defaultValue: number): number {
        const value = process.env[key];
        if (!value) return defaultValue;

        const num = parseInt(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Get environment variable as boolean
     */
    private getEnvBoolean(key: string, defaultValue: boolean): boolean {
        const value = process.env[key];
        if (!value) return defaultValue;

        return value.toLowerCase() === 'true' || value === '1';
    }

    /**
     * Get environment variable as string
     */
    private getEnvString(key: string, defaultValue: string): string {
        return process.env[key] || defaultValue;
    }

    /**
     * Get the complete configuration
     */
    getConfig(): RAGConfig {
        return this.config;
    }

    /**
     * Get RAG configuration (for backward compatibility)
     */
    getRAGConfig(): RAGConfig {
        return this.config;
    }

    /**
     * Validate configuration
     */
    validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate grading configuration
        if (this.config.grading.relevanceThreshold < 0 || this.config.grading.relevanceThreshold > 1) {
            errors.push('RAG_GRADING_RELEVANCE_THRESHOLD must be between 0 and 1');
        }

        if (this.config.grading.maxDocumentsToGrade <= 0 || this.config.grading.maxDocumentsToGrade > 50) {
            errors.push('RAG_GRADING_MAX_DOCUMENTS must be between 1 and 50');
        }

        // Validate generation configuration
        if (this.config.generation.temperature < 0 || this.config.generation.temperature > 2) {
            errors.push('RAG_GENERATION_TEMPERATURE must be between 0 and 2');
        }

        // Validate LLM configuration
        if (this.config.llm.temperature < 0 || this.config.llm.temperature > 2) {
            errors.push('RAG_LLM_TEMPERATURE must be between 0 and 2');
        }

        if (this.config.llm.timeout <= 0) {
            errors.push('RAG_LLM_TIMEOUT must be greater than 0');
        }

        // Search configuration validation
        if (this.config.search.defaultTopK <= 0) {
            errors.push('RAG_SEARCH_DEFAULT_TOP_K must be greater than 0');
        }
        if (this.config.search.defaultSimilarityThreshold < 0 || this.config.search.defaultSimilarityThreshold > 1) {
            errors.push('RAG_SEARCH_DEFAULT_SIMILARITY_THRESHOLD must be between 0 and 1');
        }

        // Reranker configuration validation
        if (this.config.reranker.maxTokens <= 0) {
            errors.push('RAG_RERANKER_MAX_TOKENS must be greater than 0');
        }
        if (this.config.reranker.temperature < 0 || this.config.reranker.temperature > 2) {
            errors.push('RAG_RERANKER_TEMPERATURE must be between 0 and 2');
        }
        if (this.config.reranker.timeout <= 0) {
            errors.push('RAG_RERANKER_TIMEOUT must be greater than 0');
        }

        if (this.config.compression.maxTokens <= 0) {
            errors.push('RAG_COMPRESSION_MAX_TOKENS must be greater than 0');
        }
        if (this.config.compression.compressionRatio < 0 || this.config.compression.compressionRatio > 1) {
            errors.push('RAG_COMPRESSION_RATIO must be between 0 and 1');
        }

        if (this.config.vectorSearch.defaultTopK <= 0) {
            errors.push('RAG_VECTOR_SEARCH_DEFAULT_TOP_K must be greater than 0');
        }
        if (this.config.vectorSearch.defaultSimilarityThreshold < 0 || this.config.vectorSearch.defaultSimilarityThreshold > 1) {
            errors.push('RAG_VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD must be between 0 and 1');
        }
        if (this.config.vectorSearch.embeddingTimeout <= 0) {
            errors.push('RAG_VECTOR_SEARCH_EMBEDDING_TIMEOUT must be greater than 0');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }


    reloadConfig(): void {
        this.config = this.loadConfiguration();
    }
}

export const configurationManager = ConfigurationManager.getInstance();

export const getRAGConfig = () => configurationManager.getRAGConfig();
