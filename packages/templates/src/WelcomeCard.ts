import type { CanvasBuilder } from 'animafy-core';
import { resolveTheme, type ThemeColors } from './themes.js';

export interface WelcomeCardOptions {
    username: string;
    avatarUrl: string;
    serverName: string;
    memberCount?: number;
    theme?: string;
    accentColor?: string;
    customColors?: Partial<ThemeColors>;
}

export function buildWelcomeCard(canvas: CanvasBuilder, opts: WelcomeCardOptions): void {
    const t = resolveTheme(opts.theme ?? 'neon', opts.customColors);
    const accent = opts.accentColor ?? t.accent;

    canvas.setSize(1024, 450)
        // Background gradient
        .drawGradient('linear', 0, 0, 1024, 450, [
            { offset: 0, color: t.background },
            { offset: 1, color: t.surface },
        ], 135)
        // Decorative top accent line
        .drawRect(0, 0, 1024, 4, accent)
        // Avatar
        .drawAvatar(opts.avatarUrl, 512, 150, 80)
        // Avatar glow ring
        .pushState()
        .setShadow(0, 0, 20, accent)
        .drawCircle(512, 150, 84, undefined, accent, 3)
        .popState()
        // Welcome text
        .drawText('WELCOME', 512 - 80, 280, 20, 'sans-serif', t.secondaryText)
        // Username
        .drawText(opts.username, 512 - 120, 320, 36, 'sans-serif', t.primaryText)
        // Server name
        .drawText(opts.serverName, 512 - 100, 365, 18, 'sans-serif', accent)
        // Member count
        .drawText(
            opts.memberCount ? `Member #${formatNumber(opts.memberCount)}` : '',
            512 - 60, 400, 14, 'sans-serif', t.secondaryText
        )
        // Bottom accent line
        .drawRect(0, 446, 1024, 4, accent);
}

function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}
