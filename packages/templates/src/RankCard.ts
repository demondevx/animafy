import type { CanvasBuilder } from 'animafy-core';
import { resolveTheme, type ThemeColors } from './themes.js';

export interface RankCardOptions {
    username: string;
    avatarUrl: string;
    level: number;
    xp: number;
    maxXp: number;
    rank: number;
    theme?: string;
    accentColor?: string;
    customColors?: Partial<ThemeColors>;
}

export function buildRankCard(canvas: CanvasBuilder, opts: RankCardOptions): void {
    const t = resolveTheme(opts.theme ?? 'neon', opts.customColors);
    const accent = opts.accentColor ?? t.accent;
    const progress = Math.max(0, Math.min(1, opts.xp / opts.maxXp));

    canvas.setSize(934, 282)
        .setBackground(t.background)
        // Surface card
        .drawRect(20, 20, 894, 242, t.surface, 16)
        // Avatar
        .drawAvatar(opts.avatarUrl, 120, 141, 65)
        // Avatar ring
        .drawCircle(120, 141, 68, undefined, accent, 3)
        // Username
        .drawText(opts.username, 210, 110, 28, 'sans-serif', t.primaryText)
        // Rank badge
        .drawText(`Rank #${opts.rank}`, 210, 145, 18, 'sans-serif', t.secondaryText)
        // Level badge
        .drawText(`Level ${opts.level}`, 780, 110, 22, 'sans-serif', accent)
        // XP text
        .drawText(`${formatNumber(opts.xp)} / ${formatNumber(opts.maxXp)} XP`, 780, 145, 14, 'sans-serif', t.secondaryText)
        // Progress bar background
        .drawProgressBar(210, 180, 690, 24, progress, {
            barColor: accent,
            bgColor: t.background,
            radius: 12,
        })
        // Progress percentage
        .drawText(`${Math.round(progress * 100)}%`, 870, 220, 14, 'sans-serif', t.secondaryText);
}

function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
