/**
 * Represents a single frame in an animated asset.
 */
export interface Frame {
    /** Raw RGBA pixel data for this frame. */
    data: Uint8ClampedArray;
    /** Duration of this frame in milliseconds. */
    delay: number;
}

/**
 * Represents a decoded animated asset independent of its source format.
 * GIF, APNG, animated WebP, or future formats should all map to this interface.
 */
export interface AnimatedAsset {
    /** The sequence of frames comprising the animation. */
    frames: Frame[];
    /** The total duration of the animation in milliseconds. */
    duration: number;
    /** The number of times the animation should loop (0 = infinite). */
    loopCount: number;
    /** The intrinsic width of the asset. */
    width: number;
    /** The intrinsic height of the asset. */
    height: number;
}
