import type { Canvas } from '@napi-rs/canvas';
import type { AssetManager } from 'animafy-assets';
import type { DrawOperation } from './Operations.js';
import type { GifWorkerPool } from './GifWorkerPool.js';
export interface RenderMetrics {
    composeTime: number;
    encodeTime: number;
    totalFrames: number;
    frameHashes?: string[];
}
export interface RenderOptions {
    onMetrics?: (metrics: RenderMetrics) => void;
    fastMode?: boolean;
}
/**
 * Responsible for converting a sequence of immutable operations into a final
 * rasterized output (PNG or GIF), properly synchronizing any animated assets.
 */
export declare class AnimationRenderer {
    private readonly canvas;
    private readonly workerPool?;
    private readonly ctx;
    private readonly assetManager;
    private readonly scratchCanvas;
    private readonly scratchCtx;
    constructor(canvas: Canvas, assetManager: AssetManager, workerPool?: GifWorkerPool | undefined);
    loadAssets(operations: DrawOperation[]): Promise<void>;
    renderStatic(operations: DrawOperation[]): void;
    renderAnimated(operations: DrawOperation[], options?: RenderOptions): Promise<Buffer>;
    private executeOperation;
    private renderText;
}
