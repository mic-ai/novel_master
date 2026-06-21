import { describe, it, expect } from 'vitest';
import { buildInlineEditPrompt } from '@/lib/prompts/templates/inline-edit-agent';

const sample = '彼女は窓の外を見た。';

describe('buildInlineEditPrompt - rewrite', () => {
  it('includes selected text', () => {
    const p = buildInlineEditPrompt({ selectedText: sample, instruction: 'rewrite', genre: 'romance' });
    expect(p).toContain(sample);
  });

  it('instructs rewrite', () => {
    const p = buildInlineEditPrompt({ selectedText: sample, instruction: 'rewrite', genre: 'romance' });
    expect(p).toContain('書き直');
  });

  it('mentions genre', () => {
    const p = buildInlineEditPrompt({ selectedText: sample, instruction: 'rewrite', genre: 'mystery' });
    expect(p).toContain('mystery');
  });
});

describe('buildInlineEditPrompt - expand', () => {
  it('instructs expansion', () => {
    const p = buildInlineEditPrompt({ selectedText: sample, instruction: 'expand', genre: 'fantasy' });
    expect(p).toContain('膨らま');
  });

  it('includes selected text', () => {
    const p = buildInlineEditPrompt({ selectedText: sample, instruction: 'expand', genre: 'fantasy' });
    expect(p).toContain(sample);
  });
});

describe('buildInlineEditPrompt - general', () => {
  it('returns a non-empty string for all instructions', () => {
    const instructions = ['rewrite', 'expand'] as const;
    for (const instruction of instructions) {
      const p = buildInlineEditPrompt({ selectedText: sample, instruction, genre: 'sf' });
      expect(p.length).toBeGreaterThan(0);
    }
  });

  it('handles empty context without throwing', () => {
    expect(() =>
      buildInlineEditPrompt({ selectedText: sample, instruction: 'rewrite', genre: 'horror' })
    ).not.toThrow();
  });

  it('handles context when provided', () => {
    const p = buildInlineEditPrompt({
      selectedText: sample,
      instruction: 'expand',
      genre: 'romance',
      context: '前後の文章...',
    });
    expect(p).toContain('前後の文章');
  });
});
