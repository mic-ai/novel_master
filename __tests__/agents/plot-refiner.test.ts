import { describe, it, expect } from 'vitest';
import { buildPlotRefinerPrompt } from '@/lib/prompts/templates/plot-refiner';

const samplePlot = {
  total_chapters: 3,
  chapters: [
    { number: 1, title: '出会い', summary: '主人公が転校生と出会う', emotion_score: 5, scene_type: 'standard', tempo_role: 'neutral' },
    { number: 2, title: '衝突', summary: '二人が対立する', emotion_score: 7, scene_type: 'emotional_peak', tempo_role: 'tension' },
    { number: 3, title: '和解', summary: '友情が芽生える', emotion_score: 8, scene_type: 'climax', tempo_role: 'tension' },
  ],
};

describe('buildPlotRefinerPrompt', () => {
  it('includes the existing plot outline', () => {
    const prompt = buildPlotRefinerPrompt({
      currentPlot: samplePlot,
      editRequest: '第2章をもっとドラマチックにしてほしい',
      genre: 'romance',
      media: 'book',
    });
    expect(prompt).toContain('衝突');
  });

  it('includes the user edit request', () => {
    const prompt = buildPlotRefinerPrompt({
      currentPlot: samplePlot,
      editRequest: '第2章をもっとドラマチックにしてほしい',
      genre: 'romance',
      media: 'book',
    });
    expect(prompt).toContain('第2章をもっとドラマチックにしてほしい');
  });

  it('instructs to return JSON in same format', () => {
    const prompt = buildPlotRefinerPrompt({
      currentPlot: samplePlot,
      editRequest: 'プロローグを追加',
      genre: 'fantasy',
      media: 'web',
    });
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('total_chapters');
  });

  it('includes genre information', () => {
    const prompt = buildPlotRefinerPrompt({
      currentPlot: samplePlot,
      editRequest: 'テスト',
      genre: 'mystery',
      media: 'book',
    });
    expect(prompt).toContain('mystery');
  });

  it('handles empty edit request without throwing', () => {
    expect(() =>
      buildPlotRefinerPrompt({ currentPlot: samplePlot, editRequest: '', genre: 'sf', media: 'web' })
    ).not.toThrow();
  });

  it('returns a non-empty string', () => {
    const prompt = buildPlotRefinerPrompt({
      currentPlot: samplePlot,
      editRequest: 'テスト',
      genre: 'horror',
      media: 'book',
    });
    expect(prompt.length).toBeGreaterThan(0);
  });
});
