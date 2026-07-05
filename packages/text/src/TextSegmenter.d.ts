/**
 * Types of segments a text string can be broken into.
 */
export declare enum SegmentType {
    Text = 0,
    UnicodeEmoji = 1,
    CustomEmoji = 2
}
export interface TextSegment {
    type: SegmentType;
    content: string;
    /** For CustomEmoji, this holds the snowflake ID. */
    id?: string;
    /** For CustomEmoji, this indicates whether it is an animated `<a:name:id>` format. */
    animated?: boolean;
}
export declare class TextSegmenter {
    private static readonly discordEmojiRegex;
    private static readonly segmenter;
    private static readonly emojiRegex;
    /**
     * Parses a raw string into an array of distinct segments for rendering.
     * This handles Discord custom emoji syntax and complex Unicode ZWJ sequences.
     */
    static segment(input: string): TextSegment[];
    /**
     * Segments standard text into standard characters or Unicode emojis.
     */
    private static parseUnicode;
    /**
     * Collapses consecutive Text segments into a single segment for rendering efficiency.
     * We don't collapse emojis, as they must be rendered individually as images.
     */
    private static collapseTextSegments;
}
