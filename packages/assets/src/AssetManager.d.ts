import { type AssetItem } from './AssetCache.js';
import type { GifDecoder } from '@animafy/decoders';
export declare class AssetManager {
    private readonly cache;
    private gifDecoder;
    constructor(cacheOptions?: import('./AssetCache.js').CacheOptions);
    setGifDecoder(decoder: GifDecoder): void;
    /**
     * Retrieves an asset synchronously from the cache if it exists.
     * Required by the rendering pipeline during rasterization.
     */
    getCached(source: string): AssetItem | undefined;
    private fetchBuffer;
    /**
     * Resolves an image or animation. Automatically detects the format via magic numbers.
     * Caches the decoded asset to prevent duplicate network requests and decoding overhead.
     */
    resolve(source: string | Buffer): Promise<AssetItem>;
}
