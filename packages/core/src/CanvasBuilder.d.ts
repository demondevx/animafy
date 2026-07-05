import type { AssetManager } from 'animafy-assets';
import type { GifWorkerPool } from './GifWorkerPool.js';
export declare class CanvasBuilder {
    private readonly assetManager;
    private readonly workerPool?;
    private width;
    private height;
    private readonly operations;
    constructor(assetManager: AssetManager, workerPool?: GifWorkerPool | undefined);
    setSize(width: number, height: number): this;
    drawAvatar(url: string, x: number, y: number, radius: number): this;
    drawText(text: string, x: number, y: number, fontSize?: number, fontFamily?: string, color?: string): this;
    drawImage(url: string, x: number, y: number, width: number, height: number): this;
    drawRect(x: number, y: number, width: number, height: number, color: string, radius?: number): this;
    setBackground(color: string): this;
    /**
     * Executes the render pipeline for a single static frame and returns a PNG buffer.
     */
    exportPNG(): Promise<Buffer>;
    /**
     * Executes the render pipeline and synchronizes animated assets into a GIF buffer.
     */
    exportGIF(options?: import('./AnimationRenderer.js').RenderOptions): Promise<Buffer>;
}
