import { createCanvas } from '@napi-rs/canvas';
import type { AssetManager } from '@animafy/assets';
import { AnimationRenderer } from './AnimationRenderer.js';
import type { GifWorkerPool } from './GifWorkerPool.js';
import type { DrawOperation } from './Operations.js';

export class CanvasBuilder {
    private width = 800;
    private height = 400;
    private readonly operations: DrawOperation[] = [];

    constructor(
        private readonly assetManager: AssetManager,
        private readonly workerPool?: GifWorkerPool
    ) {}

    public setSize(width: number, height: number): this {
        this.width = width;
        this.height = height;
        return this;
    }

    public drawAvatar(url: string, x: number, y: number, radius: number): this {
        this.operations.push({ type: 'avatar', url, x, y, radius });
        return this;
    }

    public drawText(text: string, x: number, y: number, fontSize: number = 32, fontFamily: string = 'sans-serif', color: string = '#ffffff'): this {
        this.operations.push({ type: 'text', text, x, y, fontSize, fontFamily, color });
        return this;
    }

    public drawImage(url: string, x: number, y: number, width: number, height: number): this {
        this.operations.push({ type: 'image', url, x, y, width, height });
        return this;
    }

    public drawRect(x: number, y: number, width: number, height: number, color: string, radius?: number): this {
        this.operations.push({ type: 'rect', x, y, width, height, color, radius });
        return this;
    }

    public setBackground(color: string): this {
        this.operations.push({ type: 'rect', x: 0, y: 0, width: this.width, height: this.height, color });
        return this;
    }

    /**
     * Executes the render pipeline for a single static frame and returns a PNG buffer.
     */
    public async exportPNG(): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager);
        
        await renderer.loadAssets(this.operations);
        renderer.renderStatic(this.operations);
        
        return canvas.encode('png');
    }

    /**
     * Executes the render pipeline and synchronizes animated assets into a GIF buffer.
     */
    public async exportGIF(options?: import('./AnimationRenderer.js').RenderOptions): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager, this.workerPool);
        
        await renderer.loadAssets(this.operations);
        return renderer.renderAnimated(this.operations, options);
    }
}
