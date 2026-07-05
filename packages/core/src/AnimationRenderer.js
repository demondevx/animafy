import { createCanvas, ImageData } from '@napi-rs/canvas';
import { TextSegmenter, SegmentType } from 'animafy-text';
import { EmojiFetcher } from 'animafy-emoji';
import crypto from 'node:crypto';
/**
 * Responsible for converting a sequence of immutable operations into a final
 * rasterized output (PNG or GIF), properly synchronizing any animated assets.
 */
export class AnimationRenderer {
    canvas;
    workerPool;
    ctx;
    assetManager;
    scratchCanvas;
    scratchCtx;
    constructor(canvas, assetManager, workerPool) {
        this.canvas = canvas;
        this.workerPool = workerPool;
        this.assetManager = assetManager;
        this.ctx = canvas.getContext('2d');
        this.scratchCanvas = createCanvas(1, 1);
        this.scratchCtx = this.scratchCanvas.getContext('2d');
    }
    async loadAssets(operations) {
        const promises = [];
        for (const op of operations) {
            if (op.type === 'avatar' || op.type === 'image') {
                promises.push(this.assetManager.resolve(op.url).catch((e) => {
                    console.error(`Failed to load asset ${op.url}:`, e.message);
                    return null;
                }));
            }
            else if (op.type === 'text') {
                const segments = TextSegmenter.segment(op.text);
                for (const seg of segments) {
                    if (seg.type === SegmentType.UnicodeEmoji) {
                        const url = EmojiFetcher.getTwemojiUrl(seg.content);
                        if (url)
                            promises.push(this.assetManager.resolve(url).catch(() => null));
                    }
                    else if (seg.type === SegmentType.CustomEmoji && seg.id) {
                        const url = EmojiFetcher.getDiscordEmojiUrl(seg.id, seg.animated);
                        promises.push(this.assetManager.resolve(url).catch(() => null));
                    }
                }
            }
        }
        await Promise.all(promises);
    }
    renderStatic(operations) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const op of operations) {
            this.executeOperation(op, 0);
        }
    }
    async renderAnimated(operations, options) {
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
        if (maxDuration === 0)
            maxDuration = 1000;
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
        const frameHashes = [];
        try {
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                const composeStart = performance.now();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
                await session.addFrame(imageData.data.buffer, exportWidth, exportHeight, delayMs);
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
        }
        finally {
            this.workerPool.release(session);
        }
    }
    executeOperation(op, timeMs) {
        if (op.type === 'rect') {
            this.ctx.fillStyle = op.color;
            if (op.radius) {
                this.ctx.beginPath();
                if (typeof this.ctx.roundRect === 'function') {
                    this.ctx.roundRect(op.x, op.y, op.width, op.height, op.radius);
                }
                else {
                    // Fallback for older canvas versions
                    const { x, y, width, height, radius } = op;
                    this.ctx.moveTo(x + radius, y);
                    this.ctx.arcTo(x + width, y, x + width, y + height, radius);
                    this.ctx.arcTo(x + width, y + height, x, y + height, radius);
                    this.ctx.arcTo(x, y + height, x, y, radius);
                    this.ctx.arcTo(x, y, x + width, y, radius);
                }
                this.ctx.fill();
            }
            else {
                this.ctx.fillRect(op.x, op.y, op.width, op.height);
            }
        }
        else if (op.type === 'text') {
            this.renderText(op, timeMs);
        }
        else if (op.type === 'avatar' || op.type === 'image') {
            const asset = this.assetManager.getCached(op.url);
            if (!asset)
                return;
            // Handle clipping and sizing
            let drawX = op.x;
            let drawY = op.y;
            let drawWidth = op.type === 'image' ? op.width : op.radius * 2;
            let drawHeight = op.type === 'image' ? op.height : op.radius * 2;
            if (op.type === 'avatar') {
                const radius = op.radius;
                drawX = op.x - radius;
                drawY = op.y - radius;
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(op.x, op.y, radius, 0, Math.PI * 2, true);
                this.ctx.closePath();
                this.ctx.clip();
            }
            if ('frames' in asset) {
                // It's an AnimatedAsset. Find the correct frame based on timeMs.
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
                // We use a scratch canvas to allow standard drawImage scaling and clipping.
                if (this.scratchCanvas.width !== asset.width || this.scratchCanvas.height !== asset.height) {
                    this.scratchCanvas.width = asset.width;
                    this.scratchCanvas.height = asset.height;
                }
                const imgData = new ImageData(targetFrame.data, asset.width, asset.height);
                this.scratchCtx.putImageData(imgData, 0, 0);
                this.ctx.drawImage(this.scratchCanvas, drawX, drawY, drawWidth, drawHeight);
            }
            else {
                this.ctx.drawImage(asset, drawX, drawY, drawWidth, drawHeight);
            }
            if (op.type === 'avatar') {
                this.ctx.restore();
            }
        }
    }
    renderText(op, timeMs) {
        this.ctx.fillStyle = op.color;
        this.ctx.font = `${op.fontSize}px ${op.fontFamily}`;
        this.ctx.textBaseline = 'alphabetic'; // Align properly
        let currentX = op.x;
        let currentY = op.y;
        const segments = TextSegmenter.segment(op.text);
        for (const seg of segments) {
            if (seg.type === SegmentType.Text) {
                const lines = seg.content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (i > 0) {
                        currentX = op.x;
                        currentY += op.fontSize * 1.5;
                    }
                    if (lines[i].length > 0) {
                        this.ctx.fillText(lines[i], currentX, currentY);
                        currentX += this.ctx.measureText(lines[i]).width;
                    }
                }
            }
            else {
                let url = null;
                if (seg.type === SegmentType.UnicodeEmoji) {
                    url = EmojiFetcher.getTwemojiUrl(seg.content);
                }
                else if (seg.type === SegmentType.CustomEmoji && seg.id) {
                    url = EmojiFetcher.getDiscordEmojiUrl(seg.id, seg.animated);
                }
                if (url) {
                    const asset = this.assetManager.getCached(url);
                    const emojiSize = op.fontSize; // Square box for emoji
                    // Adjust Y so emoji aligns with text baseline (roughly subtract 80% of size)
                    const emojiY = currentY - (emojiSize * 0.8);
                    if (asset) {
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
                            // Using putImageData directly for inline emoji might overwrite pixels.
                            // Real implementation should cache ImageBitmap or use offscreen canvas,
                            // but for this phase we use putImageData and assume no background overlap,
                            // OR we create a temporary canvas to use drawImage.
                            if (this.scratchCanvas.width !== asset.width || this.scratchCanvas.height !== asset.height) {
                                this.scratchCanvas.width = asset.width;
                                this.scratchCanvas.height = asset.height;
                            }
                            const imgData = new ImageData(targetFrame.data, asset.width, asset.height);
                            this.scratchCtx.putImageData(imgData, 0, 0);
                            this.ctx.drawImage(this.scratchCanvas, currentX, emojiY, emojiSize, emojiSize);
                        }
                        else {
                            this.ctx.drawImage(asset, currentX, emojiY, emojiSize, emojiSize);
                        }
                    }
                }
                // Advance cursor even if asset failed to load to preserve spacing
                currentX += op.fontSize;
            }
        }
    }
}
//# sourceMappingURL=AnimationRenderer.js.map