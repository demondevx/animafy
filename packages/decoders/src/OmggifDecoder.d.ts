import type { AnimatedAsset, GifDecoder } from 'animafy-assets';
export declare class OmggifDecoder implements GifDecoder {
    decode(buffer: Buffer): AnimatedAsset;
}
