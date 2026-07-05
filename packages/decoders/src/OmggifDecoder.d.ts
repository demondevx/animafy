import type { AnimatedAsset } from '../../assets/src/AnimatedAsset.js';
import type { GifDecoder } from './GifDecoder.js';
export declare class OmggifDecoder implements GifDecoder {
    decode(buffer: Buffer): AnimatedAsset;
}
