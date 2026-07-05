import { CanvasBuilder } from 'animafy-core';
export class DiscordCanvasBuilder extends CanvasBuilder {
    /**
     * Helper to draw a circular avatar.
     * The underlying engine will handle GIF vs PNG seamlessly.
     */
    drawCircularAvatar(url, x, y, radius) {
        // In a complete implementation, this would enqueue a clipping mask operation
        // followed by the avatar operation to ensure it renders as a circle.
        return this.drawAvatar(url, x, y, radius);
    }
}
//# sourceMappingURL=DiscordHelpers.js.map