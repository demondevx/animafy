import { ImageData } from '@napi-rs/canvas';
import { TextSegmenter, SegmentType } from '@animafy/text';
import { EmojiFetcher } from '@animafy/emoji';
/**
 * Responsible for converting a sequence of immutable operations into a final
 * rasterized output (PNG or GIF), properly synchronizing any animated assets.
 */
export class AnimationRenderer {
    canvas;
    assetManager;
    ctx;
    constructor(canvas, assetManager) {
        this.canvas = canvas;
        this.assetManager = assetManager;
        this.ctx = canvas.getContext('2d');
    }
    async loadAssets(operations) {
        const promises = [];
        for (const op of operations) {
            if (op.type === 'avatar' || op.type === 'image') {
                promises.push(this.assetManager.resolve(op.url));
            }
            else if (op.type === 'text') {
                const segments = TextSegmenter.segment(op.text);
                for (const seg of segments) {
                    if (seg.type === SegmentType.UnicodeEmoji) {
                        const url = EmojiFetcher.getTwemojiUrl(seg.content);
                        if (url)
                            promises.push(this.assetManager.resolve(url));
                    }
                    else if (seg.type === SegmentType.CustomEmoji && seg.id) {
                        const url = EmojiFetcher.getDiscordEmojiUrl(seg.id, seg.animated);
                        promises.push(this.assetManager.resolve(url));
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
    async renderAnimated(operations) {
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
        const FPS = 30;
        const delayMs = Math.round(1000 / FPS);
        const totalFrames = Math.ceil(maxDuration / delayMs);
        const { GifEncoder } = await import('@napi-rs/canvas');
        const encoder = new GifEncoder(this.canvas.width, this.canvas.height, { repeat: 0 });
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const timeMs = frameIndex * delayMs;
            for (const op of operations) {
                this.executeOperation(op, timeMs);
            }
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            encoder.addFrame(imageData.data, this.canvas.width, this.canvas.height, { delay: delayMs });
        }
        const buffer = encoder.finish();
        return Buffer.from(buffer);
    }
    executeOperation(op, timeMs) {
        if (op.type === 'rect') {
            this.ctx.fillStyle = op.color;
            this.ctx.fillRect(op.x, op.y, op.width, op.height);
        }
        else if (op.type === 'text') {
            this.renderText(op, timeMs);
        }
        else if (op.type === 'avatar' || op.type === 'image') {
            const asset = this.assetManager.getCached(op.url);
            if (!asset)
                return;
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
                // In a production environment, this should ideally use pre-created Image objects
                // for performance, but ImageData works for the current architecture proof.
                const imgData = new ImageData(targetFrame.data, asset.width, asset.height);
                this.ctx.putImageData(imgData, op.x, op.y);
            }
            else {
                this.ctx.drawImage(asset, op.x, op.y);
            }
        }
    }
    renderText(op, timeMs) {
        this.ctx.fillStyle = op.color;
        this.ctx.font = `${op.fontSize}px ${op.fontFamily}`;
        this.ctx.textBaseline = 'alphabetic'; // Align properly
        let currentX = op.x;
        const segments = TextSegmenter.segment(op.text);
        for (const seg of segments) {
            if (seg.type === SegmentType.Text) {
                this.ctx.fillText(seg.content, currentX, op.y);
                currentX += this.ctx.measureText(seg.content).width;
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
                    const emojiY = op.y - (emojiSize * 0.8);
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
                            const imgData = new ImageData(targetFrame.data, asset.width, asset.height);
                            this.ctx.putImageData(imgData, currentX, emojiY);
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