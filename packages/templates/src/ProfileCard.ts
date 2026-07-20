import type { CanvasBuilder } from 'animafy-core';
import { resolveTheme, type ThemeColors } from './themes.js';

export interface ProfileCardOptions {
    username: string;
    avatarUrl: string;
    bio?: string;
    badges?: string[];
    stats?: Array<{ label: string; value: string }>;
    theme?: string;
    accentColor?: string;
    customColors?: Partial<ThemeColors>;
}

export function buildProfileCard(canvas: CanvasBuilder, opts: ProfileCardOptions): void {
    const t = resolveTheme(opts.theme ?? 'neon', opts.customColors);
    const accent = opts.accentColor ?? t.accent;

    canvas.setSize(800, 400)
        .setBackground(t.background)
        // Header accent bar
        .drawGradient('linear', 0, 0, 800, 80, [
            { offset: 0, color: accent },
            { offset: 1, color: t.surface },
        ], 90)
        // Content surface
        .drawRect(20, 60, 760, 320, t.surface, 16)
        // Avatar
        .drawAvatar(opts.avatarUrl, 100, 100, 55)
        // Avatar ring
        .drawCircle(100, 100, 58, undefined, accent, 3)
        // Username
        .drawText(opts.username, 180, 110, 28, 'sans-serif', t.primaryText);

    // Badges row
    if (opts.badges && opts.badges.length > 0) {
        const badgeText = opts.badges.join('  ');
        canvas.drawText(badgeText, 180, 145, 16, 'sans-serif', t.secondaryText);
    }

    // Bio
    if (opts.bio) {
        canvas.drawText(opts.bio, 40, 200, 16, 'sans-serif', t.secondaryText, 720);
    }

    // Stats row
    if (opts.stats && opts.stats.length > 0) {
        // Separator line
        canvas.drawLine(40, 270, 760, 270, t.background, 1);

        const spacing = 720 / opts.stats.length;
        opts.stats.forEach((stat, i) => {
            const x = 40 + spacing * i + spacing / 2 - 40;
            canvas.drawText(stat.value, x, 310, 24, 'sans-serif', accent);
            canvas.drawText(stat.label, x, 340, 12, 'sans-serif', t.secondaryText);
        });
    }
}
