import type { AnimatedAsset } from '../../assets/src/AnimatedAsset.js';
/**
 * Defines the contract for any GIF decoding implementation.
 * Allows swapping out the underlying decoder (e.g. omggif, a native Rust binding, etc.)
 * without modifying the core animation pipeline.
 */
export interface GifDecoder {
    /**
     * Decodes a raw binary buffer into an AnimatedAsset.
     *
     * @param buffer - The binary buffer containing GIF data.
     * @returns A parsed AnimatedAsset ready for the render pipeline.
     */
    decode(buffer: Buffer): AnimatedAsset;
}
