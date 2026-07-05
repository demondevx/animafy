import { AssetManager } from 'animafy-assets';
import { CanvasBuilder, GifWorkerPool } from 'animafy-core';
import * as os from 'os';
import { OmggifDecoder } from 'animafy-decoders';
/**
 * Advanced usage client that gives full isolation of internal AssetManager.
 * Recommended for multi-bot or heavily sharded environments.
 */
export class AnimafyClient {
    assetManager;
    workerPool;
    constructor(options) {
        this.assetManager = new AssetManager(options?.cache);
        const poolSize = options?.workerPoolSize || Math.min(os.cpus().length, 8); // Cap at 8 for standard workloads
        this.workerPool = new GifWorkerPool({ size: poolSize });
    }
    /**
     * Creates a new CanvasBuilder instance bound to this client's AssetManager.
     */
    canvas() {
        return new CanvasBuilder(this.assetManager, this.workerPool);
    }
    /**
     * Exposes the internal AssetManager for cache control operations.
     */
    get cache() {
        return this.assetManager;
    }
}
/**
 * Beginner-friendly factory for creating an AnimafyClient with sensible defaults.
 * Configured automatically for standard Discord bot workloads.
 */
export function createAnimafy() {
    const client = new AnimafyClient({
        cache: {
            maxSize: 250, // 250 assets default cap
            ttl: 5 * 60 * 1000 // 5 minutes TTL
        }
    });
    // Automatically configure the GIF decoder for ease of use
    client.cache.setGifDecoder(new OmggifDecoder());
    return client;
}
// Explicitly re-export only the public interfaces and types developers might need
export { CanvasBuilder } from 'animafy-core';
//# sourceMappingURL=index.js.map