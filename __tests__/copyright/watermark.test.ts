import { describe, it, expect } from 'vitest';
import { embedWatermark, extractWatermark, stripWatermarks, buildCopyrightFooter } from '@/lib/copyright/watermark';

describe('embedWatermark / extractWatermark', () => {
  it('roundtrips a short ASCII watermark ID', () => {
    const text = 'これはテスト文章です。物語の冒頭にウォーターマークを埋め込みます。';
    const id   = 'abc12345';
    const watermarked = embedWatermark(text, id);
    expect(extractWatermark(watermarked)).toBe(id);
  });

  it('roundtrips a CUID-style watermark ID', () => {
    const text = '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。';
    const id   = 'clx1abc2-defg5678';
    const watermarked = embedWatermark(text, id);
    expect(extractWatermark(watermarked)).toBe(id);
  });

  it('returns null when no watermark is present', () => {
    expect(extractWatermark('普通のテキストです。ウォーターマークはありません。')).toBeNull();
  });

  it('does not visually alter the text (visible chars same)', () => {
    const text = '春はあけぼの。やうやう白くなりゆく山ぎは。';
    const watermarked = embedWatermark(text, 'id123456');
    expect(stripWatermarks(watermarked)).toBe(text);
  });

  it('inserts watermark at or after first sentence end', () => {
    const text = '第一文。第二文。';
    const watermarked = embedWatermark(text, 'test1234');
    // Watermark should be inserted after '。' at index 3
    expect(watermarked.startsWith('第一文。')).toBe(true);
  });
});

describe('stripWatermarks', () => {
  it('removes all zero-width characters', () => {
    const text = '普通のテキスト​‌‍ ​';
    expect(stripWatermarks(text)).toBe('普通のテキスト ');
  });
});

describe('buildCopyrightFooter', () => {
  it('includes author name and title', () => {
    const footer = buildCopyrightFooter({ authorName: '山田太郎', projectTitle: '猫の物語' });
    expect(footer).toContain('山田太郎');
    expect(footer).toContain('猫の物語');
  });

  it('includes proof ID when provided', () => {
    const footer = buildCopyrightFooter({
      authorName: '山田太郎',
      projectTitle: '猫の物語',
      proofId: 'clx1abc123',
    });
    expect(footer).toContain('clx1abc123');
  });

  it('includes the correct year', () => {
    const year = new Date().getFullYear();
    const footer = buildCopyrightFooter({ authorName: 'Author', projectTitle: 'Title' });
    expect(footer).toContain(`© ${year}`);
  });
});
