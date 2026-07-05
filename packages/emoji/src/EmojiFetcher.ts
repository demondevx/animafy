// @ts-ignore: twemoji-parser might not have complete type definitions available.
import { parse } from 'twemoji-parser';

export class EmojiFetcher {
    /**
     * Resolves a Unicode emoji string to its standard Twemoji image URL.
     * Uses twemoji-parser to guarantee accurate mapping of complex ZWJ sequences.
     */
    public static getTwemojiUrl(unicodeEmoji: string): string | null {
        try {
            const entities = parse(unicodeEmoji);
            if (entities.length > 0) {
                return entities[0].url;
            }
        } catch {
            // Ignore parse failures; some custom unicode characters may not map.
        }
        return null;
    }

    /**
     * Constructs the official Discord CDN URL for a custom emoji.
     */
    public static getDiscordEmojiUrl(id: string, animated: boolean = false): string {
        const extension = animated ? 'gif' : 'png';
        return `https://cdn.discordapp.com/emojis/${id}.${extension}`;
    }
}
