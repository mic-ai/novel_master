import { describe, it, expect } from 'vitest';
import { getTempoWarnings } from '@/lib/agent/utils/tempo-warnings';

describe('getTempoWarnings', () => {
  it('returns empty array when no tempo rules apply for mystery', () => {
    const warnings = getTempoWarnings({
      genre: 'mystery',
      media: 'book',
      currentChapterNumber: 3,
      chapterOutlines: [],
    });
    expect(warnings).toEqual([]);
  });

  it('romance/web: warns when no sweet scene in last 5 episodes', () => {
    const outlines = Array.from({ length: 8 }, (_, i) => ({
      chapterNumber: i + 1,
      sceneType: 'daily',
    }));
    const warnings = getTempoWarnings({
      genre: 'romance',
      media: 'web',
      currentChapterNumber: 8,
      chapterOutlines: outlines,
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]!.level).toBe('warning');
    expect(warnings[0]!.message).toContain('甘い');
  });

  it('romance/web: no warning when recent sweet scene exists', () => {
    const outlines = [
      { chapterNumber: 1, sceneType: 'daily' },
      { chapterNumber: 2, sceneType: 'daily' },
      { chapterNumber: 3, sceneType: 'romance' },
      { chapterNumber: 4, sceneType: 'daily' },
      { chapterNumber: 5, sceneType: 'daily' },
    ];
    const warnings = getTempoWarnings({
      genre: 'romance',
      media: 'web',
      currentChapterNumber: 6,
      chapterOutlines: outlines,
    });
    expect(warnings).toEqual([]);
  });

  it('fantasy/book: warns when battle gap exceeds 7 chapters', () => {
    const outlines = [
      { chapterNumber: 1, sceneType: 'battle' },
      ...Array.from({ length: 8 }, (_, i) => ({ chapterNumber: i + 2, sceneType: 'daily' })),
    ];
    const warnings = getTempoWarnings({
      genre: 'fantasy',
      media: 'book',
      currentChapterNumber: 10,
      chapterOutlines: outlines,
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]!.level).toBe('warning');
    expect(warnings[0]!.message).toContain('バトル');
  });

  it('fantasy/book: no warning when battle scene is recent', () => {
    const outlines = [
      { chapterNumber: 1, sceneType: 'daily' },
      { chapterNumber: 2, sceneType: 'battle' },
      { chapterNumber: 3, sceneType: 'daily' },
    ];
    const warnings = getTempoWarnings({
      genre: 'fantasy',
      media: 'book',
      currentChapterNumber: 4,
      chapterOutlines: outlines,
    });
    expect(warnings).toEqual([]);
  });

  it('horror: error when horror_peak chapter has no preceding relief scene', () => {
    const outlines = [
      { chapterNumber: 1, sceneType: 'horror_peak' },
      { chapterNumber: 2, sceneType: 'horror_peak' },
    ];
    const warnings = getTempoWarnings({
      genre: 'horror',
      media: 'book',
      currentChapterNumber: 2,
      chapterOutlines: outlines,
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]!.level).toBe('error');
    expect(warnings[0]!.message).toContain('安心');
  });

  it('horror: no error when horror_peak follows a daily scene', () => {
    const outlines = [
      { chapterNumber: 1, sceneType: 'daily' },
      { chapterNumber: 2, sceneType: 'horror_peak' },
    ];
    const warnings = getTempoWarnings({
      genre: 'horror',
      media: 'book',
      currentChapterNumber: 2,
      chapterOutlines: outlines,
    });
    expect(warnings).toEqual([]);
  });
});
