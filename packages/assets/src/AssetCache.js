export class AssetCache {
    cache = new Map();
    maxSize;
    ttl;
    constructor(options = {}) {
        this.maxSize = options.maxSize ?? 500;
        this.ttl = options.ttl ?? 1000 * 60 * 10; // 10 minutes
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
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
    set(key, asset) {
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
    has(key) {
        return this.get(key) !== undefined;
    }
    clear() {
        this.cache.clear();
    }
    evictExpired() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}
//# sourceMappingURL=AssetCache.js.map