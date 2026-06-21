import { describe, it, expect } from 'vitest';
import { buildPlotGeneratorPrompt } from '@/lib/prompts/templates/plot-generator';

const baseCtx = {
  genre: 'romance',
  media: 'book',
  targetWords: 60000,
  characters: [],
  worldSettings: {},
  goal: '主人公の目標',
  obstacles: [],
};

describe('buildPlotGeneratorPrompt variant support', () => {
  it('includes variantHint in the prompt when provided', () => {
    const prompt = buildPlotGeneratorPrompt({
      ...baseCtx,
      variantHint: 'ダーク・シリアスなトーンで展開してください',
    });
    expect(prompt).toContain('ダーク・シリアスなトーンで展開してください');
  });

  it('does not include variant section when variantHint is not provided', () => {
    const prompt = buildPlotGeneratorPrompt(baseCtx);
    expect(prompt).not.toContain('バリエーション指針');
  });

  it('still contains genre label and core information when variantHint is given', () => {
    const prompt = buildPlotGeneratorPrompt({
      ...baseCtx,
      genre: 'fantasy',
      variantHint: 'ライト・コミカルに',
    });
    expect(prompt).toContain('ファンタジー');
    expect(prompt).toContain('ライト・コミカルに');
  });
});
