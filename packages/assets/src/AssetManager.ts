import { loadImage, type Image } from '@napi-rs/canvas';
import { EmojiFetcher } from 'animafy-emoji';
import type { AssetItem } from './AssetCache.js';
import { AssetCache } from './AssetCache.js';
import type { GifDecoder } from './GifDecoder.js';

export class AssetManager {
    private readonly cache: AssetCache;
    private gifDecoder: GifDecoder | null = null;

    constructor(cacheOptions?: import('./AssetCache.js').CacheOptions) {
        this.cache = new AssetCache(cacheOptions);
    }

    public setGifDecoder(decoder: GifDecoder): void {
        this.gifDecoder = decoder;
    }

    /**
     * Retrieves an asset synchronously from the cache if it exists.
     * Required by the rendering pipeline during rasterization.
     */
    public getCached(source: string): AssetItem | undefined {
        return this.cache.get(source);
    }

    private async fetchBuffer(url: string): Promise<Buffer> {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Animafy/1.0 (+https://github.com/animafy)'
            }
        });
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
    public async resolve(source: string | Buffer): Promise<AssetItem> {
        if (typeof source === 'string') {
            const cached = this.cache.get(source);
            if (cached) return cached;
        }

        const buffer = typeof source === 'string' ? await this.fetchBuffer(source) : source;

        // Auto-detect GIF magic number (GIF87a or GIF89a)
        const isGif = buffer.length > 3 && 
            buffer[0] === 0x47 && // G
            buffer[1] === 0x49 && // I
            buffer[2] === 0x46;   // F

        let asset: AssetItem;

        if (isGif) {
            if (!this.gifDecoder) {
                throw new Error('GIF detected but no GifDecoder is registered in AssetManager.');
            }
            asset = this.gifDecoder.decode(buffer);
        } else {
            // @napi-rs/canvas loadImage supports PNG, JPEG, WEBP natively
            asset = await loadImage(buffer);
        }

        if (typeof source === 'string') {
            this.cache.set(source, asset);
        }

        return asset;
    }
}
