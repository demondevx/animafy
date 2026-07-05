export declare class EmojiFetcher {
    /**
     * Resolves a Unicode emoji string to its standard Twemoji image URL.
     * Uses twemoji-parser to guarantee accurate mapping of complex ZWJ sequences.
     */
    static getTwemojiUrl(unicodeEmoji: string): string | null;
    /**
     * Constructs the official Discord CDN URL for a custom emoji.
     */
    static getDiscordEmojiUrl(id: string, animated?: boolean): string;
}
