import { redis } from '../../redis';

export class EmbeddingCache {
  private readonly ttl: number;
  private readonly keyPrefix = 'rag:embedding_cache:';

  constructor(ttl: number = 12 * 60 * 60 * 1000) {
    this.ttl = Math.floor(ttl / 1000);
  }

  async get(key: string): Promise<{ embedding: number[]; timestamp: number } | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (!cached) {
        return undefined;
      }

      if (typeof cached !== 'string' || !cached.startsWith('{')) {
        await this.invalidate(key);
        return undefined;
      }

      return JSON.parse(cached);
    } catch (error) {
      await this.invalidate(key);
      return undefined;
    }
  }

  async set(key: string, value: { embedding: number[]; timestamp: number }): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, serialized);
    } catch (error) {
      // cache is optional
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(`${this.keyPrefix}${key}`);
    } catch (error) {
      console.warn('Redis embedding cache invalidate error:', error);
    }
  }
}

export class TokenCountCache {
  private readonly ttl = 60 * 60; // 1 hour in seconds
  private readonly keyPrefix = 'rag:token_count_cache:';

  async get(key: string): Promise<number | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (!cached) {
        return undefined;
      }
      if (typeof cached !== 'string' || isNaN(Number(cached))) {
        await this.invalidate(key);
        return undefined;
      }

      return parseInt(cached, 10);
    } catch (error) {
      await this.invalidate(key);
      return undefined;
    }
  }

  async set(key: string, value: number): Promise<void> {
    try {
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, value.toString());
    } catch (error) {
      // cache is optional
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(`${this.keyPrefix}${key}`);
    } catch (error) {
      //  optional
    }
  }

}

export class DocumentAccessCache {
  private readonly ttl = 5 * 60; // 5 minutes in seconds
  private readonly keyPrefix = 'rag:document_access_cache:';

  async get(key: string): Promise<any[] | undefined> {
    try {
      const cached = await redis.get<string>(`${this.keyPrefix}${key}`);
      if (!cached) {
        return undefined;
      }

      if (typeof cached !== 'string' || !cached.startsWith('[')) {
        await this.invalidate(key);
        return undefined;
      }

      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        await this.invalidate(key);
        return undefined;
      }
    } catch (error) {
      await this.invalidate(key);
      return undefined;
    }
  }

  async set(key: string, value: any[]): Promise<void> {
    try {
      if (!Array.isArray(value)) {
        return;
      }

      const serialized = JSON.stringify(value);
      await redis.setex(`${this.keyPrefix}${key}`, this.ttl, serialized);
    } catch (error) {
      // cache is optional
    }
  }

  generateKey(dataroomId: string, viewerId: string): string {
    return `${dataroomId}:${viewerId}`;
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(`${this.keyPrefix}${key}`);
    } catch (error) {
      console.warn('Redis document access cache invalidate error:', error);
    }
  }
}
