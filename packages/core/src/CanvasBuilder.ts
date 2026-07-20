import { createCanvas } from '@napi-rs/canvas';
import type { AssetManager } from 'animafy-assets';
import { AnimationRenderer } from './AnimationRenderer.js';
import type { GifWorkerPool } from './GifWorkerPool.js';
import type { DrawOperation, GradientStop } from './Operations.js';

export class CanvasBuilder {
    private width = 800;
    private height = 400;
    private backgroundColor?: string;
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

    /** Stored as dedicated state so it always fills the final canvas dimensions regardless of call order. */
    public setBackground(color: string): this {
        this.backgroundColor = color;
        return this;
    }

    public drawAvatar(url: string, x: number, y: number, radius: number): this {
        this.operations.push({ type: 'avatar', url, x, y, radius });
        return this;
    }

    public drawText(
        text: string, x: number, y: number,
        fontSize: number = 32, fontFamily: string = 'sans-serif',
        color: string = '#ffffff', maxWidth?: number
    ): this {
        this.operations.push({ type: 'text', text, x, y, fontSize, fontFamily, color, maxWidth });
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

    // --- Visual Effects ---

    public drawGradient(
        gradientType: 'linear' | 'radial',
        x: number, y: number, width: number, height: number,
        stops: GradientStop[], angle?: number
    ): this {
        this.operations.push({ type: 'gradient', gradientType, x, y, width, height, stops, angle });
        return this;
    }

    public drawCircle(x: number, y: number, radius: number, fillColor?: string, strokeColor?: string, strokeWidth?: number): this {
        this.operations.push({ type: 'circle', x, y, radius, fillColor, strokeColor, strokeWidth });
        return this;
    }

    public drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth: number = 1): this {
        this.operations.push({ type: 'line', x1, y1, x2, y2, color, lineWidth });
        return this;
    }

    public drawProgressBar(
        x: number, y: number, width: number, height: number, progress: number,
        options: { barColor?: string; bgColor?: string; radius?: number } = {}
    ): this {
        this.operations.push({
            type: 'progressBar', x, y, width, height,
            progress: Math.max(0, Math.min(1, progress)),
            barColor: options.barColor ?? '#FF3366',
            bgColor: options.bgColor ?? '#2a2a3a',
            radius: options.radius
        });
        return this;
    }

    public pushState(): this {
        this.operations.push({ type: 'pushState' });
        return this;
    }

    public popState(): this {
        this.operations.push({ type: 'popState' });
        return this;
    }

    public setFilter(filter: string): this {
        this.operations.push({ type: 'filter', filter });
        return this;
    }

    public clearFilter(): this {
        this.operations.push({ type: 'clearFilter' });
        return this;
    }

    public setShadow(offsetX: number, offsetY: number, blur: number, color: string): this {
        this.operations.push({ type: 'shadow', offsetX, offsetY, blur, color });
        return this;
    }

    public clearShadow(): this {
        this.operations.push({ type: 'clearShadow' });
        return this;
    }

    public setOpacity(value: number): this {
        this.operations.push({ type: 'opacity', value: Math.max(0, Math.min(1, value)) });
        return this;
    }

    // --- Export ---

    public async exportPNG(): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager);

        await renderer.loadAssets(this.operations);
        renderer.renderStatic(this.operations, this.backgroundColor);

        return canvas.encode('png');
    }

    public async exportGIF(options?: import('./AnimationRenderer.js').RenderOptions): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager, this.workerPool);

        await renderer.loadAssets(this.operations);
        return renderer.renderAnimated(this.operations, this.backgroundColor, options);
    }

    // --- Introspection (used internally by TimelineBuilder and templates) ---

    public getWidth(): number { return this.width; }
    public getHeight(): number { return this.height; }
    public getBackgroundColor(): string | undefined { return this.backgroundColor; }
    public getOperations(): ReadonlyArray<DrawOperation> { return this.operations; }
}
