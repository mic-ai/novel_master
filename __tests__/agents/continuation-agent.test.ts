import { describe, it, expect } from 'vitest';
import { buildContinuationPrompt } from '@/lib/prompts/templates/continuation-agent';

const sampleContent = '彼女は静かに窓の外を見つめていた。雨が降り始めていた。';

describe('buildContinuationPrompt', () => {
  it('includes current content', () => {
    const p = buildContinuationPrompt({
      currentContent: sampleContent,
      genre: 'romance',
      media: 'web',
    });
    expect(p).toContain(sampleContent);
  });

  it('includes genre', () => {
    const p = buildContinuationPrompt({
      currentContent: sampleContent,
      genre: 'mystery',
      media: 'book',
    });
    expect(p).toContain('mystery');
  });

  it('instructs to continue the story', () => {
    const p = buildContinuationPrompt({
      currentContent: sampleContent,
      genre: 'fantasy',
      media: 'web',
    });
    expect(p).toContain('続き');
  });

  it('includes chapter summary context when provided', () => {
    const p = buildContinuationPrompt({
      currentContent: sampleContent,
      genre: 'romance',
      media: 'book',
      chapterSummary: '主人公が恋人に再会した章',
    });
    expect(p).toContain('主人公が恋人に再会した章');
  });

  it('handles missing summary gracefully', () => {
    expect(() =>
      buildContinuationPrompt({ currentContent: sampleContent, genre: 'horror', media: 'web' })
    ).not.toThrow();
  });

  it('returns non-empty string', () => {
    const p = buildContinuationPrompt({
      currentContent: sampleContent,
      genre: 'sf',
      media: 'book',
    });
    expect(p.length).toBeGreaterThan(0);
  });
});
