import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { COMMON_RULES } from '@/lib/prompts/common-rules';
import type { WordRange } from '@/lib/prompts/genre-rules';

export function getGenreContext(genre: string, media: 'book' | 'web') {
  const g = GENRE_RULES[genre];
  if (!g) throw new Error(`Unknown genre: ${genre}`);
  return {
    label:                g.label,
    core_principle:       g.core_principle,
    parts:                g.parts.book,
    total_words:          g.total_words[media],
    chapter_words:        g.chapter_words[media],
    chapter_ending_rules: g.chapter_ending_rules,
    pov_rules:            g.pov_rules,
    tempo_rules:          g.tempo_rules?.[media] ?? null,
    review_rubric:        [...COMMON_RULES.writing_rubric, ...g.review_extra],
    specific:             Object.fromEntries(
                            Object.entries(g).filter(([k]) => k.endsWith('_specific'))
                          ),
  };
}

export function getSceneWordRange(
  genre: string,
  media: 'book' | 'web',
  sceneType: string,
): WordRange {
  const cw = GENRE_RULES[genre]?.chapter_words?.[media];
  if (!cw) return { min: 2000, max: 5000 };

  const range = cw[sceneType];
  if (range && typeof range === 'object' && 'min' in range) {
    return range as WordRange;
  }

  const std = cw['standard'];
  if (std && typeof std === 'object' && 'min' in std) {
    return std as WordRange;
  }

  return { min: 2000, max: 5000 };
}
