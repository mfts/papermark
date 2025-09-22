import { redis } from '../../redis';

export class EmbeddingCache {
  private readonly ttl: number;
  private readonly keyPrefix = 'rag:embedding_cache:';

  constructor(maxSize: number = 5000, ttl: number = 12 * 60 * 60 * 1000) {
    this.ttl = Math.floor(ttl / 1000); // Convert to seconds for Redis
  }

  async get(key: string): Promise<{ embedding: number[]; timestamp: number } | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return undefined;
    } catch (error) {
      console.error('Redis embedding cache get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: { embedding: number[]; timestamp: number }): Promise<void> {
    try {
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis embedding cache set error:', error);
    }
  }


  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis embedding cache clear error:', error);
    }
  }

}

export class TokenCountCache {
  private readonly ttl = 60 * 60; // 1 hour in seconds
  private readonly keyPrefix = 'rag:token_count_cache:';

  async get(key: string): Promise<number | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (cached) {
        return parseInt(cached, 10);
      }
      return undefined;
    } catch (error) {
      console.error('Redis token count cache get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: number): Promise<void> {
    try {
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, value.toString());
    } catch (error) {
      console.error('Redis token count cache set error:', error);
    }
  }


  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis token count cache clear error:', error);
    }
  }

}

export class PromptTemplateCache {
  private readonly ttl = 24 * 60 * 60; // 24 hours in seconds
  private readonly keyPrefix = 'rag:prompt_template_cache:';

  constructor() {
  }

  async get(key: string): Promise<any | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return undefined;
    } catch (error) {
      console.error('Redis prompt template cache get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis prompt template cache set error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis prompt template cache clear error:', error);
    }
  }
}

export class DocumentAccessCache {
  private readonly ttl = 5 * 60; // 5 minutes in seconds
  private readonly keyPrefix = 'rag:document_access_cache:';


  async get(key: string): Promise<any[] | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return undefined;
    } catch (error) {
      console.error('Redis document access cache get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: any[]): Promise<void> {
    try {
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis document access cache set error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis document access cache clear error:', error);
    }
  }

  generateKey(dataroomId: string, viewerId: string): string {
    return `${dataroomId}:${viewerId}`;
  }
}


