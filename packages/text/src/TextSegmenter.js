/**
 * Types of segments a text string can be broken into.
 */
export var SegmentType;
(function (SegmentType) {
    SegmentType[SegmentType["Text"] = 0] = "Text";
    SegmentType[SegmentType["UnicodeEmoji"] = 1] = "UnicodeEmoji";
    SegmentType[SegmentType["CustomEmoji"] = 2] = "CustomEmoji";
})(SegmentType || (SegmentType = {}));
export class TextSegmenter {
    static discordEmojiRegex = /<(a?):(\w+):(\d+)>/g;
    // Grapheme segmentation ensures that complex emojis (like ZWJ sequences or flags)
    // are correctly treated as a single graphical unit rather than split apart.
    static segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    // Modern Unicode property escape to accurately detect pictographic characters.
    static emojiRegex = /\p{Extended_Pictographic}/u;
    /**
     * Parses a raw string into an array of distinct segments for rendering.
     * This handles Discord custom emoji syntax and complex Unicode ZWJ sequences.
     */
    static segment(input) {
        const segments = [];
        // 1. Extract Discord custom emojis first.
        let lastIndex = 0;
        let match;
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
    static parseUnicode(text, outSegments) {
        const graphemes = this.segmenter.segment(text);
        for (const grapheme of graphemes) {
            if (this.emojiRegex.test(grapheme.segment)) {
                outSegments.push({
                    type: SegmentType.UnicodeEmoji,
                    content: grapheme.segment
                });
            }
            else {
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
    static collapseTextSegments(segments) {
        const collapsed = [];
        let currentText = '';
        for (const segment of segments) {
            if (segment.type === SegmentType.Text) {
                currentText += segment.content;
            }
            else {
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
//# sourceMappingURL=TextSegmenter.js.map