/**
 * Types of segments a text string can be broken into.
 */
export enum SegmentType {
    Text,
    UnicodeEmoji,
    CustomEmoji
}

export interface TextSegment {
    type: SegmentType;
    content: string;
    /** For CustomEmoji, this holds the snowflake ID. */
    id?: string;
    /** For CustomEmoji, this indicates whether it is an animated `<a:name:id>` format. */
    animated?: boolean;
}

export class TextSegmenter {
    private static readonly discordEmojiRegex = /<(a?):(\w+):(\d+)>/g;
    
    // Grapheme segmentation ensures that complex emojis (like ZWJ sequences or flags)
    // are correctly treated as a single graphical unit rather than split apart.
    private static readonly segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    
    // Modern Unicode property escape to accurately detect pictographic characters.
    private static readonly emojiRegex = /\p{Extended_Pictographic}/u;

    /**
     * Parses a raw string into an array of distinct segments for rendering.
     * This handles Discord custom emoji syntax and complex Unicode ZWJ sequences.
     */
    public static segment(input: string): TextSegment[] {
        const segments: TextSegment[] = [];
        
        // 1. Extract Discord custom emojis first.
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        this.discordEmojiRegex.lastIndex = 0;

        while ((match = this.discordEmojiRegex.exec(input)) !== null) {
            if (match.index > lastIndex) {
                this.parseUnicode(input.slice(lastIndex, match.index), segments);
            }

            segments.push({
                type: SegmentType.CustomEmoji,
                content: match[0],
                animated: match[1] === 'a',
                id: match[3]
            });

            lastIndex = this.discordEmojiRegex.lastIndex;
        }

        if (lastIndex < input.length) {
            this.parseUnicode(input.slice(lastIndex), segments);
        }

        return this.collapseTextSegments(segments);
    }

    /**
     * Segments standard text into standard characters or Unicode emojis.
     */
    private static parseUnicode(text: string, outSegments: TextSegment[]): void {
        const graphemes = this.segmenter.segment(text);
        
        for (const grapheme of graphemes) {
            if (this.emojiRegex.test(grapheme.segment)) {
                outSegments.push({
                    type: SegmentType.UnicodeEmoji,
                    content: grapheme.segment
                });
            } else {
                outSegments.push({
                    type: SegmentType.Text,
                    content: grapheme.segment
                });
            }
        }
    }

    /**
     * Collapses consecutive Text segments into a single segment for rendering efficiency.
     * We don't collapse emojis, as they must be rendered individually as images.
     */
    private static collapseTextSegments(segments: TextSegment[]): TextSegment[] {
        const collapsed: TextSegment[] = [];
        let currentText = '';

        for (const segment of segments) {
            if (segment.type === SegmentType.Text) {
                currentText += segment.content;
            } else {
                if (currentText) {
                    collapsed.push({ type: SegmentType.Text, content: currentText });
                    currentText = '';
                }
                collapsed.push(segment);
            }
        }

        if (currentText) {
            collapsed.push({ type: SegmentType.Text, content: currentText });
        }

        return collapsed;
    }
}
