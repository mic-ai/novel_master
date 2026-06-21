import { describe, it, expect } from 'vitest';
import { generateTempoPlan } from '@/lib/agent/utils/tempo-planner';

describe('generateTempoPlan', () => {
  it('returns a plan with the correct number of entries', () => {
    const plan = generateTempoPlan('fantasy', 'book', 12);
    expect(plan).toHaveLength(12);
  });

  it('each entry has a chapter number, role, and sceneTypeHint', () => {
    const plan = generateTempoPlan('romance', 'web', 10);
    for (const entry of plan) {
      expect(typeof entry.chapter).toBe('number');
      expect(['tension', 'release', 'neutral']).toContain(entry.role);
      expect(typeof entry.sceneTypeHint).toBe('string');
    }
  });

  it('chapter numbers are sequential from 1', () => {
    const plan = generateTempoPlan('horror', 'book', 8);
    plan.forEach((entry, i) => {
      expect(entry.chapter).toBe(i + 1);
    });
  });

  it('fantasy/book has tension at chapter 6', () => {
    const plan = generateTempoPlan('fantasy', 'book', 12);
    const ch6 = plan.find(e => e.chapter === 6);
    expect(ch6?.role).toBe('tension');
  });

  it('fantasy/book has release at chapter 7 (after battle)', () => {
    const plan = generateTempoPlan('fantasy', 'book', 12);
    const ch7 = plan.find(e => e.chapter === 7);
    expect(ch7?.role).toBe('release');
  });

  it('handles single chapter', () => {
    const plan = generateTempoPlan('mystery', 'book', 1);
    expect(plan).toHaveLength(1);
  });

  it('handles all genres without throwing', () => {
    const genres = ['romance', 'mystery', 'fantasy', 'sf', 'horror'];
    const media  = ['book', 'web'] as const;
    for (const genre of genres) {
      for (const m of media) {
        expect(() => generateTempoPlan(genre, m, 10)).not.toThrow();
      }
    }
  });
});
