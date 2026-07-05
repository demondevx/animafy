import type { AssetManager } from '@animafy/assets';
export declare class CanvasBuilder {
    private readonly assetManager;
    private width;
    private height;
    private readonly operations;
    constructor(assetManager: AssetManager);
    setSize(width: number, height: number): this;
    drawAvatar(url: string, x: number, y: number, radius: number): this;
    drawText(text: string, x: number, y: number, fontSize?: number, fontFamily?: string, color?: string): this;
    setBackground(color: string): this;
    /**
     * Executes the render pipeline for a single static frame and returns a PNG buffer.
     */
    exportPNG(): Promise<Buffer>;
    /**
     * Executes the render pipeline and synchronizes animated assets into a GIF buffer.
     */
    exportGIF(): Promise<Buffer>;
}
