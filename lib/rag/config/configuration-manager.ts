export interface RAGConfig {
    generation: {
        temperature: number;
    };

    llm: {
        model: string;
        temperature: number;
        timeout: number;
    };

    search: {
        fastTopK: number;
        fastSimilarityThreshold: number;
        standardTopK: number;
        standardSimilarityThreshold: number;
        expandedTopK: number;
        expandedSimilarityThreshold: number;
        maxConcurrentSearches: number;
        searchTimeoutMs: number;
    };

    reranker: {
        enabled: boolean;
        model: string;
        maxTokens: number;
        temperature: number;
        timeout: number;
        fallbackModel: string;
    };

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
            generation: {
                temperature: this.getEnvNumber('RAG_GENERATION_TEMPERATURE', 0.3),
            },

            llm: {
                model: this.getEnvString('RAG_LLM_MODEL', 'gpt-4o-mini'),
                temperature: this.getEnvNumber('RAG_LLM_TEMPERATURE', 0.2),
                timeout: this.getEnvNumber('RAG_LLM_TIMEOUT', 60000),
            },

            search: {
                fastTopK: this.getEnvNumber('RAG_SEARCH_FAST_TOP_K', 15),
                fastSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_FAST_SIMILARITY_THRESHOLD', 0.30),
                standardTopK: this.getEnvNumber('RAG_SEARCH_STANDARD_TOP_K', 25),
                standardSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_STANDARD_SIMILARITY_THRESHOLD', 0.25),
                expandedTopK: this.getEnvNumber('RAG_SEARCH_EXPANDED_TOP_K', 35),
                expandedSimilarityThreshold: this.getEnvNumber('RAG_SEARCH_EXPANDED_SIMILARITY_THRESHOLD', 0.20),
                maxConcurrentSearches: this.getEnvNumber('RAG_SEARCH_MAX_CONCURRENT', 5),
                searchTimeoutMs: this.getEnvNumber('RAG_SEARCH_TIMEOUT_MS', 10000),
            },

            reranker: {
                enabled: this.getEnvBoolean('RAG_RERANKER_ENABLED', true),
                model: this.getEnvString('RAG_RERANKER_MODEL', 'bge-reranker-large'),
                maxTokens: this.getEnvNumber('RAG_RERANKER_MAX_TOKENS', 512),

                temperature: this.getEnvNumber('RAG_RERANKER_TEMPERATURE', 0.0),
                timeout: this.getEnvNumber('RAG_RERANKER_TIMEOUT', 15000),
                fallbackModel: this.getEnvString('RAG_RERANKER_FALLBACK_MODEL', 'bge-reranker-base'),
            },


            vectorSearch: {
                defaultTopK: this.getEnvNumber('RAG_VECTOR_SEARCH_DEFAULT_TOP_K', 25),
                defaultSimilarityThreshold: this.getEnvNumber('RAG_VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD', 0.3),

                embeddingTimeout: this.getEnvNumber('RAG_VECTOR_SEARCH_EMBEDDING_TIMEOUT', 20000),
            },
        };
    }

    private getEnvNumber(key: string, defaultValue: number): number {
        const value = process.env[key];
        if (!value) return defaultValue;

        const num = parseInt(value);
        return isNaN(num) ? defaultValue : num;
    }

    private getEnvBoolean(key: string, defaultValue: boolean): boolean {
        const value = process.env[key];
        if (!value) return defaultValue;

        return value.toLowerCase() === 'true' || value === '1';
    }

    private getEnvString(key: string, defaultValue?: string): string {
        const value = process.env[key];
        if (!value && defaultValue === undefined) {
            throw new Error(`Required environment variable ${key} is not set`);
        }
        return value || defaultValue!;
    }

    getRAGConfig(): RAGConfig {
        return this.config;
    }

}

export const configurationManager = ConfigurationManager.getInstance();

export const getRAGConfig = () => configurationManager.getRAGConfig();
