import { describe, it, expect } from 'vitest';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { getGenreContext, getSceneWordRange } from '@/lib/agent/utils/get-genre-context';

const GENRES = ['romance', 'mystery', 'fantasy', 'sf', 'horror'] as const;

describe('GENRE_RULES', () => {
  it('has entries for all expected genres', () => {
    for (const genre of GENRES) {
      expect(GENRE_RULES[genre]).toBeDefined();
    }
  });

  it('each genre has required fields', () => {
    for (const genre of GENRES) {
      const rule = GENRE_RULES[genre]!;
      expect(rule.label).toBeTruthy();
      expect(rule.core_principle).toBeTruthy();
      expect(rule.total_words).toBeDefined();
      expect(rule.chapter_words).toBeDefined();
    }
  });
});

describe('getGenreContext', () => {
  it('returns context object with label and core_principle', () => {
    const ctx = getGenreContext('romance', 'web');
    expect(ctx).toBeDefined();
    expect(ctx.label).toBeTruthy();
    expect(ctx.core_principle).toBeTruthy();
  });

  it('returns total_words for book media', () => {
    const ctx = getGenreContext('fantasy', 'book');
    expect(ctx.total_words).toBeDefined();
  });

  it('throws for unknown genre', () => {
    expect(() => getGenreContext('unknown_genre', 'book')).toThrow();
  });
});

describe('getSceneWordRange', () => {
  it('returns a min/max range', () => {
    const range = getSceneWordRange('mystery', 'book', 'standard');
    expect(range.min).toBeGreaterThan(0);
    expect(range.max).toBeGreaterThanOrEqual(range.min);
  });

  it('falls back to standard when sceneType is unknown', () => {
    const standard = getSceneWordRange('romance', 'book', 'standard');
    const unknown  = getSceneWordRange('romance', 'book', 'nonexistent_scene_type');
    expect(unknown).toEqual(standard);
  });
});
