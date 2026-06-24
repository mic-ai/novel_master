import { describe, it, expect } from 'vitest';
import { buildConsistencyPrompt } from '@/lib/prompts/templates/consistency-agent';
import type { Character, Foreshadowing } from '@prisma/client';

type ChapterSnap = { number: number; summary: string | null; content: string | null };

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: 'char-1',
  projectId: 'proj-1',
  role: 'protagonist',
  name: '太郎',
  age: null,
  lack: null,
  want: null,
  weakness: null,
  arc: '成長型',
  arcStart: null,
  arcEnd: null,
  trait:           null,
  speechStyle:     null,
  relationshipRole: null,
  arcProgress:     30,
  ...overrides,
});

const makeFS = (overrides: Partial<Foreshadowing> = {}): Foreshadowing => ({
  id: 'fs-1',
  projectId: 'proj-1',
  description: '赤い薔薇',
  plantedChapter: 1,
  resolveChapter: 5,
  isPlanted: true,
  isResolved: false,
  isFake: false,
  ...overrides,
});

describe('buildConsistencyPrompt', () => {
  it('includes foreshadowing description', () => {
    const prompt = buildConsistencyPrompt({
      chapters: [],
      foreshadowing: [makeFS()],
      characters: [],
    });
    expect(prompt).toContain('赤い薔薇');
  });

  it('includes character name', () => {
    const prompt = buildConsistencyPrompt({
      chapters: [],
      foreshadowing: [],
      characters: [makeChar()],
    });
    expect(prompt).toContain('太郎');
  });

  it('flags unresolved foreshadowing', () => {
    const prompt = buildConsistencyPrompt({
      chapters: [{ number: 6, summary: '第6章の要約', content: null }],
      foreshadowing: [makeFS({ resolveChapter: 5, isResolved: false })],
      characters: [],
    });
    expect(prompt).toContain('未回収');
  });

  it('includes chapter summaries', () => {
    const chapters: ChapterSnap[] = [{ number: 1, summary: '序章の要約', content: null }];
    const prompt = buildConsistencyPrompt({ chapters, foreshadowing: [], characters: [] });
    expect(prompt).toContain('序章の要約');
  });

  it('instructs JSON output', () => {
    const prompt = buildConsistencyPrompt({ chapters: [], foreshadowing: [], characters: [] });
    expect(prompt).toContain('JSON');
  });

  it('handles empty inputs without throwing', () => {
    expect(() =>
      buildConsistencyPrompt({ chapters: [], foreshadowing: [], characters: [] })
    ).not.toThrow();
  });

  it('returns a non-empty string', () => {
    const prompt = buildConsistencyPrompt({ chapters: [], foreshadowing: [], characters: [] });
    expect(prompt.length).toBeGreaterThan(0);
  });
});
