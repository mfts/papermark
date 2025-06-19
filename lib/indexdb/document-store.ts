interface DocumentData {
    document: any;
    primaryVersion: any;
    links: any[];
    timestamp: number;
    version: number; // For cache invalidation
    isStale?: boolean; // For stale cache handling
}

interface DocumentStore {
    id: string;
    data: DocumentData;
}

// documents = Your actual cached document data
// timestamp = Just an index for fast timestamp - based queries(not actual data)

class DocumentIndexedDB {
    private dbName = 'papermark-documents';
    private version = 1;
    private storeName = 'documents';
    private db: IDBDatabase | null = null;
    private maxStorageSize = 100 * 1024 * 1024; // 100MB limit

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create documents store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'data.timestamp', { unique: false });
                    console.log('Created documents object store');
                }
            };
        });
    }

    async getDocument(id: string): Promise<DocumentData | null> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onerror = () => {
                console.error('Failed to get document from IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                const result = request.result as DocumentStore;
                if (result) {
                    console.log('Found document in IndexedDB:', id);
                    resolve(result.data);
                } else {
                    console.log('Document not found in IndexedDB:', id);
                    resolve(null);
                }
            };
        });
    }

    async setDocument(id: string, data: Omit<DocumentData, 'timestamp' | 'version' | 'isStale'>): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        const documentData: DocumentData = {
            ...data,
            timestamp: Date.now(),
            version: 1,
            isStale: false,
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ id, data: documentData });

            request.onerror = () => {
                console.error('Failed to store document in IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('Document stored in IndexedDB:', id);
                resolve();
            };
        });
    }

    async updateDocument(id: string, data: Omit<DocumentData, 'timestamp' | 'version' | 'isStale'>): Promise<void> {
        const existing = await this.getDocument(id);
        const version = existing ? existing.version + 1 : 1;

        const documentData: DocumentData = {
            ...data,
            timestamp: Date.now(),
            version,
            isStale: false,
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ id, data: documentData });

            request.onerror = () => {
                console.error('Failed to update document in IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('Document updated in IndexedDB:', id);
                resolve();
            };
        });
    }

    async deleteDocument(id: string): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onerror = () => {
                console.error('Failed to delete document from IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('Document deleted from IndexedDB:', id);
                resolve();
            };
        });
    }

    async getAllDocuments(): Promise<DocumentStore[]> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error('Failed to get all documents from IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result as DocumentStore[]);
            };
        });
    }

    async clearExpiredDocuments(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        const cutoffTime = Date.now() - maxAge;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');
            const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

            request.onerror = () => {
                console.error('Failed to clear expired documents:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    console.log('Cleared expired documents from IndexedDB');
                    resolve();
                }
            };
        });
    }

    async clearAllDocuments(): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => {
                console.error('Failed to clear all documents:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('All documents cleared from IndexedDB');
                resolve();
            };
        });
    }

    async getCacheStats(): Promise<{
        totalDocuments: number;
        totalSize: number;
        oldestDocument: number;
        newestDocument: number;
    }> {
        const documents = await this.getAllDocuments();

        if (documents.length === 0) {
            return {
                totalDocuments: 0,
                totalSize: 0,
                oldestDocument: 0,
                newestDocument: 0,
            };
        }

        let totalSize = 0;
        let oldestTimestamp = Infinity;
        let newestTimestamp = 0;

        documents.forEach(doc => {
            // Estimate size by JSON string length
            totalSize += JSON.stringify(doc.data).length;
            oldestTimestamp = Math.min(oldestTimestamp, doc.data.timestamp);
            newestTimestamp = Math.max(newestTimestamp, doc.data.timestamp);
        });

        return {
            totalDocuments: documents.length,
            totalSize,
            oldestDocument: oldestTimestamp === Infinity ? 0 : oldestTimestamp,
            newestDocument: newestTimestamp,
        };
    }

    async cleanupByStorageSize(): Promise<void> {
        const stats = await this.getCacheStats();

        // If we're under the storage limit, don't cleanup
        if (stats.totalSize < this.maxStorageSize) {
            return;
        }

        console.log(`Cache size (${stats.totalSize} bytes) exceeds limit (${this.maxStorageSize} bytes), cleaning up...`);

        // Get all documents sorted by timestamp (oldest first)
        const documents = await this.getAllDocuments();
        documents.sort((a, b) => a.data.timestamp - b.data.timestamp);

        // Remove oldest documents until we're under the limit
        let currentSize = stats.totalSize;
        let deletedCount = 0;

        for (const doc of documents) {
            if (currentSize < this.maxStorageSize * 0.8) { // Target 80% of max size
                break;
            }

            const docSize = JSON.stringify(doc.data).length;
            await this.deleteDocument(doc.id);
            currentSize -= docSize;
            deletedCount++;
        }

        console.log(`Cleaned up ${deletedCount} documents to free space`);
    }

    async isDocumentFresh(id: string, maxAge: number = 6 * 60 * 60 * 1000): Promise<boolean> {
        const doc = await this.getDocument(id);
        if (!doc) return false;

        return (Date.now() - doc.timestamp) < maxAge;
    }

    async updateDocumentIfNewer(
        id: string,
        data: Omit<DocumentData, 'timestamp' | 'version' | 'isStale'>,
        serverVersion?: number
    ): Promise<boolean> {
        const existing = await this.getDocument(id);

        if (serverVersion && existing && existing.version >= serverVersion) {
            console.log('Local version is newer or equal, skipping update:', id);
            return false;
        }

        await this.updateDocument(id, data);
        return true;
    }
}

export const documentIndexedDB = new DocumentIndexedDB(); 