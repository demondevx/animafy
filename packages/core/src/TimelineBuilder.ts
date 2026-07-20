import { createCanvas, ImageData } from '@napi-rs/canvas';
import type { AssetManager } from 'animafy-assets';
import { CanvasBuilder } from './CanvasBuilder.js';
import type { GifWorkerPool } from './GifWorkerPool.js';

interface FrameEntry {
    type: 'frame';
    callback: (canvas: CanvasBuilder) => void;
    durationMs: number;
}

interface TransitionEntry {
    type: 'transition';
    effect: 'fade';
    durationMs: number;
}

type TimelineEntry = FrameEntry | TransitionEntry;

export class TimelineBuilder {
    private width = 400;
    private height = 200;
    private fps = 20;
    private loopCount = 0;
    private readonly entries: TimelineEntry[] = [];

    constructor(
        private readonly assetManager: AssetManager,
        private readonly workerPool: GifWorkerPool
    ) {}

    public setSize(width: number, height: number): this {
        this.width = width;
        this.height = height;
        return this;
    }

    public setFPS(fps: number): this {
        this.fps = Math.max(1, Math.min(50, fps));
        return this;
    }

    public setLoop(count: number): this {
        this.loopCount = count;
        return this;
    }

    public addFrame(callback: (canvas: CanvasBuilder) => void, durationMs: number): this {
        this.entries.push({ type: 'frame', callback, durationMs });
        return this;
    }

    /** Inserts a fade transition between the previous frame and the next frame. */
    public transition(effect: 'fade', durationMs: number): this {
        if (this.entries.length === 0 || this.entries[this.entries.length - 1].type !== 'frame') {
            throw new Error('transition() must be called after addFrame()');
        }
        this.entries.push({ type: 'transition', effect, durationMs });
        return this;
    }

    public async export(): Promise<Buffer> {
        if (!this.workerPool) {
            throw new Error('Worker pool is required for timeline GIF export');
        }

        const delayMs = Math.round(1000 / this.fps);
        const session = await this.workerPool.acquire(this.width, this.height, false);

        try {
            const snapshots = await this.renderSnapshots();

            let snapshotIndex = 0;
            for (let i = 0; i < this.entries.length; i++) {
                const entry = this.entries[i];

                if (entry.type === 'frame') {
                    const snapshot = snapshots[snapshotIndex];
                    const frameCount = Math.max(1, Math.round(entry.durationMs / delayMs));

                    for (let f = 0; f < frameCount; f++) {
                        await session.addFrame(
                            snapshot,
                            this.width, this.height, delayMs
                        );
                    }
                    snapshotIndex++;

                } else if (entry.type === 'transition') {
                    const fromSnapshot = snapshots[snapshotIndex - 1];
                    const toSnapshot = snapshots[snapshotIndex];
                    if (!fromSnapshot || !toSnapshot) continue;

                    const transitionFrames = Math.max(2, Math.round(entry.durationMs / delayMs));
                    const blendCanvas = createCanvas(this.width, this.height);
                    const blendCtx = blendCanvas.getContext('2d');

                    const fromImageData = new ImageData(
                        new Uint8ClampedArray(fromSnapshot),
                        this.width, this.height
                    );
                    const toImageData = new ImageData(
                        new Uint8ClampedArray(toSnapshot),
                        this.width, this.height
                    );

                    for (let f = 0; f < transitionFrames; f++) {
                        const alpha = f / (transitionFrames - 1);
                        const blended = this.blendFrames(fromImageData, toImageData, alpha);

                        blendCtx.putImageData(blended, 0, 0);
                        const outData = blendCtx.getImageData(0, 0, this.width, this.height);

                        await session.addFrame(
                            outData.data.buffer as ArrayBuffer,
                            this.width, this.height, delayMs
                        );
                    }
                }
            }

            return await session.finish();
        } finally {
            this.workerPool.release(session);
        }
    }

    /** Renders each frame callback into a raw RGBA pixel buffer. */
    private async renderSnapshots(): Promise<ArrayBuffer[]> {
        const snapshots: ArrayBuffer[] = [];
        const renderCanvas = createCanvas(this.width, this.height);
        const renderCtx = renderCanvas.getContext('2d');

        for (const entry of this.entries) {
            if (entry.type !== 'frame') continue;

            const builder = new CanvasBuilder(this.assetManager);
            builder.setSize(this.width, this.height);
            entry.callback(builder);

            // Render the builder's operations onto our canvas
            renderCtx.clearRect(0, 0, this.width, this.height);
            const bg = builder.getBackgroundColor();
            if (bg) {
                renderCtx.fillStyle = bg;
                renderCtx.fillRect(0, 0, this.width, this.height);
            }

            // Use the AnimationRenderer to handle operations properly
            const { AnimationRenderer } = await import('./AnimationRenderer.js');
            const renderer = new AnimationRenderer(renderCanvas, this.assetManager);
            await renderer.loadAssets([...builder.getOperations()]);
            renderer.renderStatic([...builder.getOperations()], bg);

            const imageData = renderCtx.getImageData(0, 0, this.width, this.height);
            snapshots.push(imageData.data.buffer.slice(0) as ArrayBuffer);
        }

        return snapshots;
    }

    /** Alpha-blends two RGBA frames for fade transitions. */
    private blendFrames(from: ImageData, to: ImageData, alpha: number): ImageData {
        const result = new Uint8ClampedArray(from.data.length);
        const invAlpha = 1 - alpha;

        for (let i = 0; i < from.data.length; i += 4) {
            result[i] = Math.round(from.data[i] * invAlpha + to.data[i] * alpha);
            result[i + 1] = Math.round(from.data[i + 1] * invAlpha + to.data[i + 1] * alpha);
            result[i + 2] = Math.round(from.data[i + 2] * invAlpha + to.data[i + 2] * alpha);
            result[i + 3] = Math.round(from.data[i + 3] * invAlpha + to.data[i + 3] * alpha);
        }

        return new ImageData(result, from.width, from.height);
    }
}
