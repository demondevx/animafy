import type { CanvasBuilder } from 'animafy-core';
import { resolveTheme, type ThemeColors } from './themes.js';

export interface LevelUpCardOptions {
    username: string;
    avatarUrl: string;
    oldLevel: number;
    newLevel: number;
    theme?: string;
    accentColor?: string;
    customColors?: Partial<ThemeColors>;
}

export function buildLevelUpCard(canvas: CanvasBuilder, opts: LevelUpCardOptions): void {
    const t = resolveTheme(opts.theme ?? 'neon', opts.customColors);
    const accent = opts.accentColor ?? t.accent;

    canvas.setSize(600, 200)
        // Background gradient
        .drawGradient('linear', 0, 0, 600, 200, [
            { offset: 0, color: t.background },
            { offset: 0.5, color: t.surface },
            { offset: 1, color: t.background },
        ], 0)
        // Top/bottom accent lines
        .drawRect(0, 0, 600, 3, accent)
        .drawRect(0, 197, 600, 3, accent)
        // Avatar
        .drawAvatar(opts.avatarUrl, 80, 100, 45)
        // Avatar glow ring
        .pushState()
        .setShadow(0, 0, 15, accent)
        .drawCircle(80, 100, 48, undefined, accent, 2)
        .popState()
        // LEVEL UP label
        .drawText('LEVEL UP!', 160, 70, 14, 'sans-serif', accent)
        // Username
        .drawText(opts.username, 160, 105, 26, 'sans-serif', t.primaryText)
        // Level transition
        .drawText(`${opts.oldLevel}`, 160, 150, 32, 'sans-serif', t.secondaryText)
        .drawText('→', 220, 150, 32, 'sans-serif', accent)
        .drawText(`${opts.newLevel}`, 260, 150, 32, 'sans-serif', t.primaryText);
}
