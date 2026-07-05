import { AssetManager, type CacheOptions } from 'animafy-assets';
import { CanvasBuilder } from 'animafy-core';
export interface AnimafyClientOptions {
    cache?: CacheOptions;
    workerPoolSize?: number;
}
/**
 * Advanced usage client that gives full isolation of internal AssetManager.
 * Recommended for multi-bot or heavily sharded environments.
 */
export declare class AnimafyClient {
    private readonly assetManager;
    private readonly workerPool;
    constructor(options?: AnimafyClientOptions);
    /**
     * Creates a new CanvasBuilder instance bound to this client's AssetManager.
     */
    canvas(): CanvasBuilder;
    /**
     * Exposes the internal AssetManager for cache control operations.
     */
    get cache(): AssetManager;
}
/**
 * Beginner-friendly factory for creating an AnimafyClient with sensible defaults.
 * Configured automatically for standard Discord bot workloads.
 */
export declare function createAnimafy(): AnimafyClient;
export { CanvasBuilder } from 'animafy-core';
