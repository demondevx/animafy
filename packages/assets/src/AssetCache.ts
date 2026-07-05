import type { Image } from '@napi-rs/canvas';
import type { AnimatedAsset } from './AnimatedAsset.js';

export type AssetItem = Image | AnimatedAsset;

interface CacheEntry {
    asset: AssetItem;
    timestamp: number;
}

export interface CacheOptions {
    maxSize?: number;
    ttl?: number;
}

export class AssetCache {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly maxSize: number;
    private readonly ttl: number;

    constructor(options: CacheOptions = {}) {
        this.maxSize = options.maxSize ?? 500;
        this.ttl = options.ttl ?? 1000 * 60 * 10; // 10 minutes
    }

    public get(key: string): AssetItem | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        // LRU behavior: refresh position
        this.cache.delete(key);
        entry.timestamp = Date.now();
        this.cache.set(key, entry);

        return entry.asset;
    }

    public set(key: string, asset: AssetItem): void {
        this.evictExpired();

        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            // Evict least recently used (first item in Map)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.delete(key);
        this.cache.set(key, { asset, timestamp: Date.now() });
    }

    public has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    public clear(): void {
        this.cache.clear();
    }

    private evictExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}
