export interface CacheEntry<V> {
  value: V;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL?: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate?: number;
}

export class LRUCache<K, V> {
  protected cache: Map<K, CacheEntry<V>>;
  protected readonly defaultTTL?: number;

  constructor(
    protected maxSize: number,
    defaultTTL?: number // Default TTL in milliseconds
  ) {
    this.cache = new Map<K, CacheEntry<V>>();
    this.defaultTTL = defaultTTL;
  }

  async get(key: K): Promise<V | undefined> {
    const entry = this.cache.get(key);
    if (entry) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        return undefined;
      }
      // Move key to the end (recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }
    return undefined;
  }

  async set(key: K, value: V, ttl?: number): Promise<void> {
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    // In-memory storage with LRU eviction
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, entry);
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry && this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return entry !== undefined;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  // Get all keys (useful for debugging and monitoring)
  keys(): IterableIterator<K> {
    this.cleanupExpired();
    return this.cache.keys();
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    this.cleanupExpired();
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  private cleanupExpired(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    let expiredCount = 0;

    for (const [key, entry] of entries) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    if (expiredCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  // Check if entry has expired
  protected isExpired(entry: CacheEntry<V>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Dispose method for cleanup
  dispose(): void {
    this.cache.clear();
  }
}

export class VectorSearchCache extends LRUCache<string, any[]> {
  constructor() {
    super(1000, 5 * 60 * 1000);
  }
}

export class DocumentNameCache extends LRUCache<string, Record<string, string>> {
  constructor() {
    super(500, 10 * 60 * 1000); // 500 entries, 10 minutes TTL
  }
}

export class GradingResultCache extends LRUCache<string, unknown[]> {
  constructor() {
    super(300, 3 * 60 * 1000); // 300 entries, 3 minutes TTL
  }
}

export class EmbeddingCache extends LRUCache<string, { embedding: number[]; timestamp: number }> {
  constructor(maxSize: number = 5000, ttl: number = 12 * 60 * 60 * 1000) {
    super(maxSize, ttl);
  }
}

export class TokenCountCache extends LRUCache<string, number> {
  constructor() {
    super(1000, 60 * 60 * 1000); // 1000 entries, 1 hour TTL
  }

  // Synchronous methods for performance-critical operations
  getSync(key: string): number | undefined {
    const entry = this.cache.get(key);
    if (entry && !this.isExpired(entry)) {
      // Move key to the end (recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }
    return undefined;
  }

  setSync(key: string, value: number): void {
    const entry: CacheEntry<number> = {
      value,
      timestamp: Date.now(),
      ttl: this.defaultTTL
    };

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, entry);
  }
}

export class PromptTemplateCache extends LRUCache<string, unknown> {
  constructor() {
    super(50, 24 * 60 * 60 * 1000); // 50 entries, 24 hours TTL
  }
}

export class LLMResponseCache extends LRUCache<string, unknown> {
  constructor() {
    super(100, 30 * 60 * 1000); // 100 entries, 30 minutes TTL
  }
}
