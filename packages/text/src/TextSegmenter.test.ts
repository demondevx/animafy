import { test, expect } from 'vitest';
import { TextSegmenter, SegmentType } from './TextSegmenter.js';

test('segment standard text', () => {
    const segments = TextSegmenter.segment('Hello world');
    expect(segments.length).toBe(1);
    expect(segments[0].type).toBe(SegmentType.Text);
    expect(segments[0].content).toBe('Hello world');
});

test('segment custom emojis', () => {
    const segments = TextSegmenter.segment('Hello <:custom:123> <a:animated:456>');
    expect(segments.length).toBe(4); // Text, Custom, Text, Custom
    expect(segments[1].type).toBe(SegmentType.CustomEmoji);
    expect(segments[1].id).toBe('123');
    expect(segments[1].animated).toBe(false);
    
    expect(segments[3].type).toBe(SegmentType.CustomEmoji);
    expect(segments[3].id).toBe('456');
    expect(segments[3].animated).toBe(true);
});

test('segment complex ZWJ emojis', () => {
    const segments = TextSegmenter.segment('Family 👨‍👩‍👧‍👦 here');
    expect(segments.length).toBe(3);
    expect(segments[0].type).toBe(SegmentType.Text);
    expect(segments[1].type).toBe(SegmentType.UnicodeEmoji);
    expect(segments[1].content).toBe('👨‍👩‍👧‍👦');
    expect(segments[2].type).toBe(SegmentType.Text);
});
