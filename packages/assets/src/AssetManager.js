import { loadImage } from '@napi-rs/canvas';
import { AssetCache } from './AssetCache.js';
export class AssetManager {
    cache;
    gifDecoder = null;
    constructor(cacheOptions) {
        this.cache = new AssetCache(cacheOptions);
    }
    setGifDecoder(decoder) {
        this.gifDecoder = decoder;
    }
    /**
     * Retrieves an asset synchronously from the cache if it exists.
     * Required by the rendering pipeline during rasterization.
     */
    getCached(source) {
        return this.cache.get(source);
    }
    async fetchBuffer(url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch asset from ${url}: ${res.statusText}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    /**
     * Resolves an image or animation. Automatically detects the format via magic numbers.
     * Caches the decoded asset to prevent duplicate network requests and decoding overhead.
     */
    async resolve(source) {
        if (typeof source === 'string') {
            const cached = this.cache.get(source);
            if (cached)
                return cached;
        }
        const buffer = typeof source === 'string' ? await this.fetchBuffer(source) : source;
        // Auto-detect GIF magic number (GIF87a or GIF89a)
        const isGif = buffer.length > 3 &&
            buffer[0] === 0x47 && // G
            buffer[1] === 0x49 && // I
            buffer[2] === 0x46; // F
        let asset;
        if (isGif) {
            if (!this.gifDecoder) {
                throw new Error('GIF detected but no GifDecoder is registered in AssetManager.');
            }
            asset = this.gifDecoder.decode(buffer);
        }
        else {
            // @napi-rs/canvas loadImage supports PNG, JPEG, WEBP natively
            asset = await loadImage(buffer);
        }
        if (typeof source === 'string') {
            this.cache.set(source, asset);
        }
        return asset;
    }
}
//# sourceMappingURL=AssetManager.js.map