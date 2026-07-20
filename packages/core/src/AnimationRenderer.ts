import { createCanvas, ImageData } from '@napi-rs/canvas';
import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';
import type { AssetManager, AssetItem } from 'animafy-assets';
import type {
    DrawOperation, DrawTextOperation, DrawGradientOperation,
    DrawCircleOperation, DrawLineOperation, DrawProgressBarOperation
} from './Operations.js';
import { TextSegmenter, SegmentType } from 'animafy-text';
import { EmojiFetcher } from 'animafy-emoji';
import type { GifWorkerPool } from './GifWorkerPool.js';
import crypto from 'node:crypto';

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

export class AnimationRenderer {
    private readonly ctx: SKRSContext2D;
    private readonly assetManager: AssetManager;
    private readonly scratchCanvas: Canvas;
    private readonly scratchCtx: SKRSContext2D;

    constructor(
        private readonly canvas: Canvas,
        assetManager: AssetManager,
        private readonly workerPool?: GifWorkerPool
    ) {
        this.assetManager = assetManager;
        this.ctx = canvas.getContext('2d');
        this.scratchCanvas = createCanvas(1, 1);
        this.scratchCtx = this.scratchCanvas.getContext('2d');
    }

    public async loadAssets(operations: DrawOperation[]): Promise<void> {
        const promises: Promise<AssetItem>[] = [];

        for (const op of operations) {
            if (op.type === 'avatar' || op.type === 'image') {
                promises.push(this.assetManager.resolve(op.url).catch((e: any) => {
                    console.error(`Failed to load asset ${op.url}:`, e.message);
                    return null as any;
                }));
            } else if (op.type === 'text') {
                const segments = TextSegmenter.segment(op.text);
                for (const seg of segments) {
                    if (seg.type === SegmentType.UnicodeEmoji) {
                        const url = EmojiFetcher.getTwemojiUrl(seg.content);
                        if (url) promises.push(this.assetManager.resolve(url).catch(() => null as any));
                    } else if (seg.type === SegmentType.CustomEmoji && seg.id) {
                        const url = EmojiFetcher.getDiscordEmojiUrl(seg.id, seg.animated);
                        promises.push(this.assetManager.resolve(url).catch(() => null as any));
                    }
                }
            }
        }

        await Promise.all(promises);
    }

    public renderStatic(operations: DrawOperation[], backgroundColor?: string): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.fillBackground(backgroundColor);

        for (const op of operations) {
            this.executeOperation(op, 0);
        }
    }

    public async renderAnimated(
        operations: DrawOperation[],
        backgroundColor?: string,
        options?: RenderOptions
    ): Promise<Buffer> {
        let maxDuration = 0;
        for (const op of operations) {
            if (op.type === 'avatar' || op.type === 'image') {
                const asset = this.assetManager.getCached(op.url);
                if (asset && 'duration' in asset) {
                    if (asset.duration > maxDuration) {
                        maxDuration = asset.duration;
                    }
                }
            }
        }

        if (maxDuration === 0) maxDuration = 1000;

        const isFast = options?.fastMode === true;
        const FPS = isFast ? 15 : 30;
        const delayMs = Math.round(1000 / FPS);
        const totalFrames = Math.ceil(maxDuration / delayMs);

        const scale = isFast ? 0.5 : 1;
        const exportWidth = Math.floor(this.canvas.width * scale);
        const exportHeight = Math.floor(this.canvas.height * scale);
        const exportCanvas = createCanvas(exportWidth, exportHeight);
        const exportCtx = exportCanvas.getContext('2d');

        if (!this.workerPool) {
            throw new Error("Worker pool is required for GIF encoding");
        }

        const session = await this.workerPool.acquire(exportWidth, exportHeight, isFast);

        let composeTime = 0;
        let encodeTime = 0;
        const frameHashes: string[] = [];

        try {
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                const composeStart = performance.now();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.fillBackground(backgroundColor);

                const timeMs = frameIndex * delayMs;

                for (const op of operations) {
                    this.executeOperation(op, timeMs);
                }

                exportCtx.clearRect(0, 0, exportWidth, exportHeight);
                exportCtx.drawImage(this.canvas, 0, 0, exportWidth, exportHeight);
                const imageData = exportCtx.getImageData(0, 0, exportWidth, exportHeight);

                if (options?.onMetrics) {
                    const hash = crypto.createHash('sha256').update(imageData.data).digest('hex');
                    frameHashes.push(hash);
                }

                composeTime += performance.now() - composeStart;

                const encodeAddStart = performance.now();
                await session.addFrame(imageData.data.buffer as ArrayBuffer, exportWidth, exportHeight, delayMs);
                encodeTime += performance.now() - encodeAddStart;

                await new Promise(resolve => setImmediate(resolve));
            }

            const encodeFinishStart = performance.now();
            const buffer = await session.finish();
            encodeTime += performance.now() - encodeFinishStart;

            if (options?.onMetrics) {
                options.onMetrics({ composeTime, encodeTime, totalFrames, frameHashes });
            }

            return buffer;
        } finally {
            this.workerPool.release(session);
        }
    }

    private fillBackground(backgroundColor?: string): void {
        if (backgroundColor) {
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private executeOperation(op: DrawOperation, timeMs: number): void {
        switch (op.type) {
            case 'rect':
                this.ctx.fillStyle = op.color;
                if (op.radius) {
                    this.drawRoundedRect(op.x, op.y, op.width, op.height, op.radius);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(op.x, op.y, op.width, op.height);
                }
                break;

            case 'text':
                this.renderText(op, timeMs);
                break;

            case 'avatar':
            case 'image':
                this.renderAsset(op, timeMs);
                break;

            case 'gradient':
                this.renderGradient(op);
                break;

            case 'circle':
                this.renderCircle(op);
                break;

            case 'line':
                this.renderLine(op);
                break;

            case 'progressBar':
                this.renderProgressBar(op);
                break;

            case 'pushState':
                this.ctx.save();
                break;

            case 'popState':
                this.ctx.restore();
                break;

            case 'filter':
                this.ctx.filter = op.filter;
                break;

            case 'clearFilter':
                this.ctx.filter = 'none';
                break;

            case 'shadow':
                this.ctx.shadowOffsetX = op.offsetX;
                this.ctx.shadowOffsetY = op.offsetY;
                this.ctx.shadowBlur = op.blur;
                this.ctx.shadowColor = op.color;
                break;

            case 'clearShadow':
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                this.ctx.shadowBlur = 0;
                this.ctx.shadowColor = 'transparent';
                break;

            case 'opacity':
                this.ctx.globalAlpha = op.value;
                break;
        }
    }

    private renderGradient(op: DrawGradientOperation): void {
        let gradient;
        if (op.gradientType === 'linear') {
            const angle = (op.angle ?? 0) * Math.PI / 180;
            const cx = op.x + op.width / 2;
            const cy = op.y + op.height / 2;
            const len = Math.sqrt(op.width * op.width + op.height * op.height) / 2;
            gradient = this.ctx.createLinearGradient(
                cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
                cx + Math.cos(angle) * len, cy + Math.sin(angle) * len
            );
        } else {
            const cx = op.x + op.width / 2;
            const cy = op.y + op.height / 2;
            const r = Math.min(op.width, op.height) / 2;
            gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        }

        for (const stop of op.stops) {
            gradient.addColorStop(stop.offset, stop.color);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(op.x, op.y, op.width, op.height);
    }

    private renderCircle(op: DrawCircleOperation): void {
        this.ctx.beginPath();
        this.ctx.arc(op.x, op.y, op.radius, 0, Math.PI * 2);

        if (op.fillColor) {
            this.ctx.fillStyle = op.fillColor;
            this.ctx.fill();
        }
        if (op.strokeColor) {
            this.ctx.strokeStyle = op.strokeColor;
            this.ctx.lineWidth = op.strokeWidth ?? 2;
            this.ctx.stroke();
        }
    }

    private renderLine(op: DrawLineOperation): void {
        this.ctx.strokeStyle = op.color;
        this.ctx.lineWidth = op.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(op.x1, op.y1);
        this.ctx.lineTo(op.x2, op.y2);
        this.ctx.stroke();
    }

    private renderProgressBar(op: DrawProgressBarOperation): void {
        // Background track
        this.ctx.fillStyle = op.bgColor;
        if (op.radius) {
            this.drawRoundedRect(op.x, op.y, op.width, op.height, op.radius);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(op.x, op.y, op.width, op.height);
        }

        // Fill bar
        const fillWidth = op.width * op.progress;
        if (fillWidth > 0) {
            this.ctx.fillStyle = op.barColor;
            if (op.radius) {
                // Clamp radius to avoid artifacts on very small fill widths
                const clampedRadius = Math.min(op.radius, fillWidth / 2, op.height / 2);
                this.drawRoundedRect(op.x, op.y, fillWidth, op.height, clampedRadius);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(op.x, op.y, fillWidth, op.height);
            }
        }
    }

    private drawRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
        this.ctx.beginPath();
        if (typeof this.ctx.roundRect === 'function') {
            this.ctx.roundRect(x, y, w, h, r);
        } else {
            this.ctx.moveTo(x + r, y);
            this.ctx.arcTo(x + w, y, x + w, y + h, r);
            this.ctx.arcTo(x + w, y + h, x, y + h, r);
            this.ctx.arcTo(x, y + h, x, y, r);
            this.ctx.arcTo(x, y, x + w, y, r);
            this.ctx.closePath();
        }
    }

    private renderAsset(op: import('./Operations.js').DrawAvatarOperation | import('./Operations.js').DrawImageOperation, timeMs: number): void {
        const asset = this.assetManager.getCached(op.url);
        if (!asset) return;

        let drawX = op.x;
        let drawY = op.y;
        let drawWidth: number;
        let drawHeight: number;

        if (op.type === 'avatar') {
            const radius = op.radius;
            drawWidth = radius * 2;
            drawHeight = radius * 2;
            drawX = op.x - radius;
            drawY = op.y - radius;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(op.x, op.y, radius, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.clip();
        } else {
            drawWidth = op.width;
            drawHeight = op.height;
        }

        if ('frames' in asset) {
            const localTime = timeMs % asset.duration;
            let elapsed = 0;
            let targetFrame = asset.frames[0];

            for (const frame of asset.frames) {
                elapsed += frame.delay;
                if (localTime <= elapsed) {
                    targetFrame = frame;
                    break;
                }
            }

            if (this.scratchCanvas.width !== asset.width || this.scratchCanvas.height !== asset.height) {
                this.scratchCanvas.width = asset.width;
                this.scratchCanvas.height = asset.height;
            }
            const imgData = new ImageData(targetFrame.data, asset.width, asset.height);
            this.scratchCtx.putImageData(imgData, 0, 0);

            this.ctx.drawImage(this.scratchCanvas, drawX, drawY, drawWidth, drawHeight);
        } else {
            this.ctx.drawImage(asset, drawX, drawY, drawWidth, drawHeight);
        }

        if (op.type === 'avatar') {
            this.ctx.restore();
        }
    }

    private renderText(op: DrawTextOperation, timeMs: number): void {
        this.ctx.fillStyle = op.color;
        this.ctx.font = `${op.fontSize}px ${op.fontFamily}`;
        this.ctx.textBaseline = 'alphabetic';

        const segments = TextSegmenter.segment(op.text);
        const lines = this.layoutTextLines(segments, op);

        let currentY = op.y;
        const lineHeight = op.fontSize * 1.5;

        for (const line of lines) {
            let currentX = op.x;
            for (const item of line) {
                if (item.type === 'text') {
                    this.ctx.fillStyle = op.color;
                    this.ctx.font = `${op.fontSize}px ${op.fontFamily}`;
                    this.ctx.fillText(item.content, currentX, currentY);
                    currentX += this.ctx.measureText(item.content).width;
                } else if (item.type === 'emoji') {
                    const emojiSize = op.fontSize;
                    const emojiY = currentY - (emojiSize * 0.8);
                    if (item.asset) {
                        if ('frames' in item.asset) {
                            const localTime = timeMs % item.asset.duration;
                            let elapsed = 0;
                            let targetFrame = item.asset.frames[0];
                            for (const frame of item.asset.frames) {
                                elapsed += frame.delay;
                                if (localTime <= elapsed) { targetFrame = frame; break; }
                            }
                            if (this.scratchCanvas.width !== item.asset.width || this.scratchCanvas.height !== item.asset.height) {
                                this.scratchCanvas.width = item.asset.width;
                                this.scratchCanvas.height = item.asset.height;
                            }
                            const imgData = new ImageData(targetFrame.data, item.asset.width, item.asset.height);
                            this.scratchCtx.putImageData(imgData, 0, 0);
                            this.ctx.drawImage(this.scratchCanvas, currentX, emojiY, emojiSize, emojiSize);
                        } else {
                            this.ctx.drawImage(item.asset, currentX, emojiY, emojiSize, emojiSize);
                        }
                    }
                    currentX += emojiSize;
                }
            }
            currentY += lineHeight;
        }
    }

    /**
     * Splits text segments into lines that respect maxWidth.
     * Falls back to single-line when maxWidth is undefined.
     */
    private layoutTextLines(
        segments: ReturnType<typeof TextSegmenter.segment>,
        op: DrawTextOperation
    ): Array<Array<{ type: 'text'; content: string } | { type: 'emoji'; asset: AssetItem | null }>> {
        this.ctx.font = `${op.fontSize}px ${op.fontFamily}`;
        const maxWidth = op.maxWidth;
        const emojiWidth = op.fontSize;

        const lines: Array<Array<{ type: 'text'; content: string } | { type: 'emoji'; asset: AssetItem | null }>> = [[]];
        let currentLineWidth = 0;

        for (const seg of segments) {
            if (seg.type === SegmentType.Text) {
                const parts = seg.content.split('\n');
                for (let i = 0; i < parts.length; i++) {
                    if (i > 0) {
                        lines.push([]);
                        currentLineWidth = 0;
                    }
                    if (parts[i].length === 0) continue;

                    if (!maxWidth) {
                        lines[lines.length - 1].push({ type: 'text', content: parts[i] });
                        currentLineWidth += this.ctx.measureText(parts[i]).width;
                    } else {
                        // Word-wrap within maxWidth
                        const words = parts[i].split(/(\s+)/);
                        for (const word of words) {
                            const wordWidth = this.ctx.measureText(word).width;
                            if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
                                lines.push([]);
                                currentLineWidth = 0;
                            }
                            if (word.trim().length > 0 || currentLineWidth > 0) {
                                lines[lines.length - 1].push({ type: 'text', content: word });
                                currentLineWidth += wordWidth;
                            }
                        }
                    }
                }
            } else {
                let url: string | null = null;
                if (seg.type === SegmentType.UnicodeEmoji) {
                    url = EmojiFetcher.getTwemojiUrl(seg.content);
                } else if (seg.type === SegmentType.CustomEmoji && seg.id) {
                    url = EmojiFetcher.getDiscordEmojiUrl(seg.id, seg.animated);
                }

                const asset = url ? this.assetManager.getCached(url) ?? null : null;

                if (maxWidth && currentLineWidth + emojiWidth > maxWidth && currentLineWidth > 0) {
                    lines.push([]);
                    currentLineWidth = 0;
                }

                lines[lines.length - 1].push({ type: 'emoji', asset });
                currentLineWidth += emojiWidth;
            }
        }

        return lines;
    }
}
