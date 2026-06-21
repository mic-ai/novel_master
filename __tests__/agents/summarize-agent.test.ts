import { describe, it, expect } from 'vitest';
import { buildSummarizePrompt } from '@/lib/prompts/templates/summarize-agent';

describe('buildSummarizePrompt', () => {
  it('includes chapter number in prompt', () => {
    const prompt = buildSummarizePrompt({ chapterContent: 'テスト内容', chapterNumber: 3 });
    expect(prompt).toContain('第3章');
  });

  it('includes chapter content in prompt', () => {
    const content = '主人公が魔王を倒した。仲間たちは歓声を上げた。';
    const prompt = buildSummarizePrompt({ chapterContent: content, chapterNumber: 1 });
    expect(prompt).toContain(content);
  });

  it('mentions 500 character limit', () => {
    const prompt = buildSummarizePrompt({ chapterContent: 'テスト', chapterNumber: 1 });
    expect(prompt).toContain('500');
  });

  it('instructs to include psychological changes', () => {
    const prompt = buildSummarizePrompt({ chapterContent: 'テスト', chapterNumber: 2 });
    expect(prompt).toContain('心理');
  });

  it('instructs to include foreshadowing info', () => {
    const prompt = buildSummarizePrompt({ chapterContent: 'テスト', chapterNumber: 2 });
    expect(prompt).toContain('伏線');
  });

  it('returns a string', () => {
    const prompt = buildSummarizePrompt({ chapterContent: 'テスト', chapterNumber: 1 });
    expect(typeof prompt).toBe('string');
  });

  it('handles empty content gracefully', () => {
    expect(() =>
      buildSummarizePrompt({ chapterContent: '', chapterNumber: 1 })
    ).not.toThrow();
  });
});
