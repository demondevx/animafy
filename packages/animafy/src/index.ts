import { AssetManager, type CacheOptions } from 'animafy-assets';
import { CanvasBuilder, GifWorkerPool, TimelineBuilder } from 'animafy-core';
import * as os from 'os';
import { OmggifDecoder } from 'animafy-decoders';
import {
    buildRankCard, buildWelcomeCard, buildProfileCard,
    buildLeaderboardCard, buildLevelUpCard,
    type RankCardOptions, type WelcomeCardOptions,
    type ProfileCardOptions, type LeaderboardCardOptions,
    type LevelUpCardOptions
} from 'animafy-templates';

export interface AnimafyClientOptions {
    cache?: CacheOptions;
    workerPoolSize?: number;
}

export class AnimafyClient {
    private readonly assetManager: AssetManager;
    private readonly workerPool: GifWorkerPool;

    constructor(options?: AnimafyClientOptions) {
        this.assetManager = new AssetManager(options?.cache);
        const poolSize = options?.workerPoolSize || Math.min(os.cpus().length, 8);
        this.workerPool = new GifWorkerPool({ size: poolSize });
    }

    public canvas(): CanvasBuilder {
        return new CanvasBuilder(this.assetManager, this.workerPool);
    }

    public timeline(): TimelineBuilder {
        return new TimelineBuilder(this.assetManager, this.workerPool);
    }

    public get cache(): AssetManager {
        return this.assetManager;
    }

    // --- Built-in Templates ---

    public async rankCard(opts: RankCardOptions & { animated?: boolean }): Promise<Buffer> {
        const builder = this.canvas();
        buildRankCard(builder, opts);
        return opts.animated ? builder.exportGIF({ fastMode: true }) : builder.exportPNG();
    }

    public async welcomeCard(opts: WelcomeCardOptions & { animated?: boolean }): Promise<Buffer> {
        const builder = this.canvas();
        buildWelcomeCard(builder, opts);
        return opts.animated ? builder.exportGIF({ fastMode: true }) : builder.exportPNG();
    }

    public async profileCard(opts: ProfileCardOptions & { animated?: boolean }): Promise<Buffer> {
        const builder = this.canvas();
        buildProfileCard(builder, opts);
        return opts.animated ? builder.exportGIF({ fastMode: true }) : builder.exportPNG();
    }

    public async leaderboardCard(opts: LeaderboardCardOptions & { animated?: boolean }): Promise<Buffer> {
        const builder = this.canvas();
        buildLeaderboardCard(builder, opts);
        return opts.animated ? builder.exportGIF({ fastMode: true }) : builder.exportPNG();
    }

    public async levelUpCard(opts: LevelUpCardOptions & { animated?: boolean }): Promise<Buffer> {
        const builder = this.canvas();
        buildLevelUpCard(builder, opts);
        return opts.animated ? builder.exportGIF({ fastMode: true }) : builder.exportPNG();
    }
}

export function createAnimafy(options?: AnimafyClientOptions): AnimafyClient {
    const client = new AnimafyClient({
        cache: {
            maxSize: 250,
            ttl: 5 * 60 * 1000,
            ...options?.cache
        },
        workerPoolSize: options?.workerPoolSize
    });

    client.cache.setGifDecoder(new OmggifDecoder());
    return client;
}

// Re-export public API surface
export { CanvasBuilder, TimelineBuilder } from 'animafy-core';
export type { RenderOptions, RenderMetrics, DrawOperation, GradientStop } from 'animafy-core';
export type {
    RankCardOptions, WelcomeCardOptions, ProfileCardOptions,
    LeaderboardCardOptions, LeaderboardEntry, LevelUpCardOptions,
    ThemeColors
} from 'animafy-templates';
