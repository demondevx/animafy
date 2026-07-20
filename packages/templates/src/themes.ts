export interface ThemeColors {
    background: string;
    surface: string;
    accent: string;
    accentGlow: string;
    primaryText: string;
    secondaryText: string;
}

const THEMES: Record<string, ThemeColors> = {
    neon: {
        background: '#0D0D12',
        surface: '#16161F',
        accent: '#FF3366',
        accentGlow: '#FF5C85',
        primaryText: '#FFFFFF',
        secondaryText: '#B5BAC1',
    },
    dark: {
        background: '#1a1a2e',
        surface: '#16213e',
        accent: '#0f3460',
        accentGlow: '#533483',
        primaryText: '#FFFFFF',
        secondaryText: '#a0a0b0',
    },
    light: {
        background: '#F5F5F5',
        surface: '#FFFFFF',
        accent: '#5865F2',
        accentGlow: '#7289DA',
        primaryText: '#2C2F33',
        secondaryText: '#72767D',
    },
    pastel: {
        background: '#FFF0F5',
        surface: '#FFE4E9',
        accent: '#FF6B9D',
        accentGlow: '#FF8FB1',
        primaryText: '#4A3540',
        secondaryText: '#8B7080',
    },
};

export function resolveTheme(theme: string, customColors?: Partial<ThemeColors>): ThemeColors {
    const base = THEMES[theme] ?? THEMES.neon;
    if (!customColors) return base;
    return { ...base, ...customColors };
}
