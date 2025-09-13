import { LRUCache as NodeLRUCache } from 'lru-cache';

export class EmbeddingCache {
  private cache: NodeLRUCache<string, { embedding: number[]; timestamp: number }>;

  constructor(maxSize: number = 5000, ttl: number = 12 * 60 * 60 * 1000) {
    this.cache = new NodeLRUCache<string, { embedding: number[]; timestamp: number }>({
      max: maxSize,
      ttl: ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  async get(key: string): Promise<{ embedding: number[]; timestamp: number } | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: { embedding: number[]; timestamp: number }): Promise<void> {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: 5000
    };
  }

  dispose(): void {
    this.cache.clear();
  }
}

export class TokenCountCache {
  private cache: NodeLRUCache<string, number>;

  constructor() {
    this.cache = new NodeLRUCache<string, number>({
      max: 1000,
      ttl: 60 * 60 * 1000, // 1 hour
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  async get(key: string): Promise<number | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: number): Promise<void> {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: 1000
    };
  }

  // Synchronous methods for performance-critical operations
  getSync(key: string): number | undefined {
    return this.cache.get(key);
  }

  setSync(key: string, value: number): void {
    this.cache.set(key, value);
  }

  dispose(): void {
    this.cache.clear();
  }
}

export class PromptTemplateCache {
  private cache: NodeLRUCache<string, any>;

  constructor() {
    this.cache = new NodeLRUCache<string, any>({
      max: 50,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  async get(key: string): Promise<any | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: 50
    };
  }

  dispose(): void {
    this.cache.clear();
  }
}

export class DocumentAccessCache {
  private cache: NodeLRUCache<string, any[]>;

  constructor() {
    this.cache = new NodeLRUCache<string, any[]>({
      max: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  async get(key: string): Promise<any[] | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: any[]): Promise<void> {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: 1000
    };
  }

  generateKey(dataroomId: string, viewerId: string): string {
    return `${dataroomId}:${viewerId}`;
  }


  dispose(): void {
    this.cache.clear();
  }
}


