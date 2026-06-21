import { describe, it, expect } from 'vitest';
import {
  generateFingerprints,
  calculateJaccardSimilarity,
  getSimilarityStatus,
  SIMILARITY_THRESHOLDS,
} from '@/lib/copyright/fingerprint';

describe('generateFingerprints', () => {
  it('returns empty array for text shorter than kgramSize', () => {
    expect(generateFingerprints('abc', 5)).toEqual([]);
  });

  it('returns at least one fingerprint for valid text', () => {
    const fps = generateFingerprints('吾輩は猫である。名前はまだ無い。');
    expect(fps.length).toBeGreaterThan(0);
  });

  it('produces the same fingerprints for identical text', () => {
    const text = 'この物語はフィクションです。全ての人物・団体は架空のものです。';
    expect(generateFingerprints(text)).toEqual(generateFingerprints(text));
  });

  it('produces different fingerprints for different text', () => {
    const fps1 = generateFingerprints('吾輩は猫である。名前はまだ無い。');
    const fps2 = generateFingerprints('春はあけぼの。やうやう白くなりゆく山ぎは。');
    expect(fps1).not.toEqual(fps2);
  });

  it('handles ASCII text', () => {
    const fps = generateFingerprints('the quick brown fox jumps over the lazy dog');
    expect(fps.length).toBeGreaterThan(0);
  });
});

describe('calculateJaccardSimilarity', () => {
  it('returns 1.0 for identical fingerprints', () => {
    const fps = generateFingerprints('吾輩は猫である。名前はまだ無い。');
    expect(calculateJaccardSimilarity(fps, fps)).toBe(1);
  });

  it('returns 0 for empty fingerprints', () => {
    expect(calculateJaccardSimilarity([], [1, 2, 3])).toBe(0);
    expect(calculateJaccardSimilarity([1, 2, 3], [])).toBe(0);
  });

  it('returns 0 for completely different fingerprints', () => {
    const fps1 = [1, 2, 3];
    const fps2 = [4, 5, 6];
    expect(calculateJaccardSimilarity(fps1, fps2)).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap (long text)', () => {
    // Use longer texts so multiple windows are generated, enabling partial overlap detection
    const base = '吾輩は猫である名前はまだ無いどこで生れたかとんと見当がつかぬ何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している';
    const fps1 = generateFingerprints(base + '猫の話です', 5, 4);
    const fps2 = generateFingerprints(base + '犬の話です', 5, 4);
    const sim = calculateJaccardSimilarity(fps1, fps2);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it('is symmetric', () => {
    const fps1 = [1, 2, 3, 4];
    const fps2 = [3, 4, 5, 6];
    expect(calculateJaccardSimilarity(fps1, fps2)).toBe(calculateJaccardSimilarity(fps2, fps1));
  });
});

describe('getSimilarityStatus', () => {
  it('returns CLEAN for low similarity', () => {
    expect(getSimilarityStatus(0)).toBe('CLEAN');
    expect(getSimilarityStatus(SIMILARITY_THRESHOLDS.CLEAN)).toBe('CLEAN');
  });

  it('returns WARNING for medium similarity', () => {
    expect(getSimilarityStatus(0.2)).toBe('WARNING');
  });

  it('returns FLAGGED for high similarity', () => {
    expect(getSimilarityStatus(0.5)).toBe('FLAGGED');
  });

  it('returns CRITICAL for very high similarity', () => {
    expect(getSimilarityStatus(0.9)).toBe('CRITICAL');
    expect(getSimilarityStatus(1)).toBe('CRITICAL');
  });
});
