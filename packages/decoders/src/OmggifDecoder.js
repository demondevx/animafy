import { GifReader } from 'omggif';
export class OmggifDecoder {
    decode(buffer) {
        const uint8Array = new Uint8Array(buffer);
        const reader = new GifReader(uint8Array);
        const width = reader.width;
        const height = reader.height;
        const frames = [];
        let duration = 0;
        // Omggif decodes frames by blitting them onto a single cumulative RGBA array.
        // This inherently handles GIF disposal methods and frame compositing.
        const canvasPixels = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < reader.numFrames(); i++) {
            const frameInfo = reader.frameInfo(i);
            // omggif provides delay in hundredths of a second (centiseconds).
            // A missing or 0 delay is often treated as 100ms in modern browsers.
            const delay = (frameInfo.delay || 10) * 10;
            duration += delay;
            reader.decodeAndBlitFrameRGBA(i, canvasPixels);
            // We must clone the array because canvasPixels is reused and mutated
            // in subsequent iterations of the loop.
            frames.push({
                data: new Uint8ClampedArray(canvasPixels),
                delay
            });
        }
        return {
            frames,
            duration,
            loopCount: reader.loopCount() ?? 0,
            width,
            height
        };
    }
}
//# sourceMappingURL=OmggifDecoder.js.map