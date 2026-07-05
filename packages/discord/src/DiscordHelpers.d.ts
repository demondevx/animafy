import { CanvasBuilder } from 'animafy-core';
export declare class DiscordCanvasBuilder extends CanvasBuilder {
    /**
     * Helper to draw a circular avatar.
     * The underlying engine will handle GIF vs PNG seamlessly.
     */
    drawCircularAvatar(url: string, x: number, y: number, radius: number): this;
}
