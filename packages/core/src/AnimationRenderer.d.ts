import type { Canvas } from '@napi-rs/canvas';
import type { AssetManager } from 'animafy-assets';
import type { DrawOperation } from './Operations.js';
/**
 * Responsible for converting a sequence of immutable operations into a final
 * rasterized output (PNG or GIF), properly synchronizing any animated assets.
 */
export declare class AnimationRenderer {
    private readonly canvas;
    private readonly assetManager;
    private readonly ctx;
    constructor(canvas: Canvas, assetManager: AssetManager);
    loadAssets(operations: DrawOperation[]): Promise<void>;
    renderStatic(operations: DrawOperation[]): void;
    renderAnimated(operations: DrawOperation[]): Promise<Buffer>;
    private executeOperation;
    private renderText;
}
