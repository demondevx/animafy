import { createCanvas } from '@napi-rs/canvas';
import { AnimationRenderer } from './AnimationRenderer.js';
export class CanvasBuilder {
    assetManager;
    width = 800;
    height = 400;
    operations = [];
    constructor(assetManager) {
        this.assetManager = assetManager;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
        return this;
    }
    drawAvatar(url, x, y, radius) {
        this.operations.push({ type: 'avatar', url, x, y, radius });
        return this;
    }
    drawText(text, x, y, fontSize = 32, fontFamily = 'sans-serif', color = '#ffffff') {
        this.operations.push({ type: 'text', text, x, y, fontSize, fontFamily, color });
        return this;
    }
    setBackground(color) {
        this.operations.push({ type: 'rect', x: 0, y: 0, width: this.width, height: this.height, color });
        return this;
    }
    /**
     * Executes the render pipeline for a single static frame and returns a PNG buffer.
     */
    async exportPNG() {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager);
        await renderer.loadAssets(this.operations);
        renderer.renderStatic(this.operations);
        return canvas.encode('png');
    }
    /**
     * Executes the render pipeline and synchronizes animated assets into a GIF buffer.
     */
    async exportGIF() {
        const canvas = createCanvas(this.width, this.height);
        const renderer = new AnimationRenderer(canvas, this.assetManager);
        await renderer.loadAssets(this.operations);
        return renderer.renderAnimated(this.operations);
    }
}
//# sourceMappingURL=CanvasBuilder.js.map