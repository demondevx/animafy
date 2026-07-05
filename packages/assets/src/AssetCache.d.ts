import type { Image } from '@napi-rs/canvas';
import type { AnimatedAsset } from './AnimatedAsset.js';
export type AssetItem = Image | AnimatedAsset;
export interface CacheOptions {
    maxSize?: number;
    ttl?: number;
}
export declare class AssetCache {
    private readonly cache;
    private readonly maxSize;
    private readonly ttl;
    constructor(options?: CacheOptions);
    get(key: string): AssetItem | undefined;
    set(key: string, asset: AssetItem): void;
    has(key: string): boolean;
    clear(): void;
    private evictExpired;
}
