import { SearchResult, RerankerResult } from '../types/rag-types';
import { RAGError } from '../errors/rag-errors';
import { configurationManager } from '../config/configuration-manager';

export class RerankerService {
    private enabled: boolean;
    private static instance: RerankerService | null = null;

    private idfCache: Map<string, number> = new Map();

    private constructor() {
        const ragConfig = configurationManager.getRAGConfig();
        this.enabled = ragConfig.reranker.enabled;
    }

    static getInstance(): RerankerService {
        if (!RerankerService.instance) {
            RerankerService.instance = new RerankerService();
        }
        return RerankerService.instance;
    }

    async rerankResults(
        query: string,
        searchResults: SearchResult[]
    ): Promise<RerankerResult[]> {
        this.validateInputs(query, searchResults);

        if (!this.enabled) {
            if (process.env.NODE_ENV === 'development') {
                console.log('⏭️ Reranking Disabled - Using Original Scores');
            }
            return searchResults.map((result, index) => ({
                ...result,
                relevanceScore: result.similarity ?? 0,
                confidence: 0.5,
                rerankedRank: index
            }));
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Reranking Started:', {
                query: query.length > 80 ? query.substring(0, 77) + '...' : query,
                resultsCount: searchResults.length,
                enabled: this.enabled,
                method: 'TF-IDF'
            });
        }

        try {
            const results = this.tfidfRerank(query, searchResults);

            if (process.env.NODE_ENV === 'development') {
                const scores = results.map(r => r.relevanceScore);
                console.log('✅ Reranking Completed:', {
                    method: 'TF-IDF',
                    resultsCount: results.length,
                    avgScore: scores.length ? (scores.reduce((s, x) => s + x, 0) / scores.length) : 0,
                    topScores: scores.slice(0, 5),
                    scoreRange: scores.length ? { min: Math.min(...scores), max: Math.max(...scores) } : {}
                });
            }

            return results;
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('⚠️ Reranking failed, using original scores', err);
            }
            return searchResults.map((result, index) => ({
                ...result,
                relevanceScore: result.similarity ?? 0,
                confidence: 0.3,
                rerankedRank: index
            }));
        }
    }

    private tfidfRerank(query: string, searchResults: SearchResult[]): RerankerResult[] {
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Using Production TF-IDF Reranking');
        }

        const docs = searchResults.map(r => r.content || '');
        const corpusTerms = docs.map(d => this.normalizeText(d));
        const allTerms = new Set<string>();
        corpusTerms.forEach(arr => arr.forEach(t => allTerms.add(t)));
        const terms = Array.from(allTerms);

        const df: Map<string, number> = new Map();
        for (const term of terms) {
            let count = 0;
            for (const docTerms of corpusTerms) {
                if (docTerms.includes(term)) count++;
            }
            df.set(term, count);
            const idf = Math.log((docs.length + 1) / (count + 1)) + 1;
            this.idfCache.set(term, idf);
        }

        const tfidfVectors = docs.map((doc, idx) => {
            const v = new Map<string, number>();
            const docTerms = corpusTerms[idx];
            const termCounts: Map<string, number> = new Map();
            for (const t of docTerms) {
                termCounts.set(t, (termCounts.get(t) || 0) + 1);
            }
            for (const term of terms) {
                const tf = (termCounts.get(term) || 0) / Math.max(1, docTerms.length);
                const idfVal = df.has(term) ? (Math.log((docs.length + 1) / (df.get(term)! + 1)) + 1) : 1;
                v.set(term, tf * idfVal);
            }
            return v;
        });

        const qTerms = this.normalizeText(query);
        const qTermCounts: Map<string, number> = new Map();
        qTerms.forEach(t => qTermCounts.set(t, (qTermCounts.get(t) || 0) + 1));
        const qVec = new Map<string, number>();
        for (const term of terms) {
            const tf = (qTermCounts.get(term) || 0) / Math.max(1, qTerms.length);
            const idfVal = this.idfCache.get(term) ?? Math.log((docs.length + 1) / ((df.get(term) ?? 0) + 1)) + 1;
            qVec.set(term, tf * idfVal);
        }

        const scores = tfidfVectors.map((v, idx) => {
            const sim = this.cosineSimilarityMap(qVec, v);
            return sim;
        });

        const maxScore = Math.max(...scores, 1e-9);
        const minScore = Math.min(...scores);
        const normalized = scores.map(s => (s - minScore) / (maxScore - minScore + 1e-12));

        const results: RerankerResult[] = searchResults.map((r, i) => ({
            ...r,
            relevanceScore: Math.max(0, Math.min(1, normalized[i])),
            confidence: 0.8, // Higher confidence for production TF-IDF
            rerankedRank: i
        })).sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((res, idx) => ({ ...res, rerankedRank: idx }));

        return results;
    }

    private cosineSimilarityMap(a: Map<string, number>, b: Map<string, number>): number {
        let dot = 0;
        let na = 0;
        let nb = 0;
        for (const [k, va] of a) {
            const vb = b.get(k) ?? 0;
            dot += va * vb;
            na += va * va;
        }
        for (const [, vb] of b) {
            nb += vb * vb;
        }
        if (na === 0 || nb === 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private normalizeText(text: string): string[] {
        return (text || '')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 0);
    }

    private validateInputs(query: string, searchResults: SearchResult[]): void {
        if (!query?.trim()) {
            throw RAGError.create('validation', 'Query is required for reranking', {
                service: 'RerankerService',
                field: 'query'
            });
        }
        if (!Array.isArray(searchResults)) {
            throw RAGError.create('validation', 'Search results must be an array', {
                service: 'RerankerService',
                field: 'searchResults'
            });
        }
    }
}

export const rerankerService = RerankerService.getInstance();