import type { CanvasBuilder } from 'animafy-core';
import { resolveTheme, type ThemeColors } from './themes.js';

export interface LeaderboardEntry {
    username: string;
    avatarUrl: string;
    score: string;
}

export interface LeaderboardCardOptions {
    title?: string;
    entries: LeaderboardEntry[];
    theme?: string;
    accentColor?: string;
    customColors?: Partial<ThemeColors>;
}

export function buildLeaderboardCard(canvas: CanvasBuilder, opts: LeaderboardCardOptions): void {
    const t = resolveTheme(opts.theme ?? 'neon', opts.customColors);
    const accent = opts.accentColor ?? t.accent;
    const entries = opts.entries.slice(0, 10);
    const rowHeight = 50;
    const headerHeight = 80;
    const totalHeight = headerHeight + entries.length * rowHeight + 30;

    canvas.setSize(700, totalHeight)
        .setBackground(t.background)
        // Header
        .drawRect(0, 0, 700, headerHeight, t.surface)
        .drawText(opts.title ?? 'Leaderboard', 30, 50, 28, 'sans-serif', t.primaryText)
        // Accent underline
        .drawRect(0, headerHeight - 3, 700, 3, accent);

    entries.forEach((entry, i) => {
        const y = headerHeight + i * rowHeight;
        const isEven = i % 2 === 0;
        const rowBg = isEven ? t.surface : t.background;

        canvas.drawRect(0, y, 700, rowHeight, rowBg);

        // Rank number
        const rankColor = i < 3 ? accent : t.secondaryText;
        canvas.drawText(`#${i + 1}`, 20, y + 33, 18, 'sans-serif', rankColor);

        // Avatar
        canvas.drawAvatar(entry.avatarUrl, 80, y + 25, 18);

        // Username
        canvas.drawText(entry.username, 110, y + 33, 18, 'sans-serif', t.primaryText);

        // Score (right-aligned approximation)
        canvas.drawText(entry.score, 600, y + 33, 18, 'sans-serif', accent);
    });
}
