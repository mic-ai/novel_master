import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import type { TempoPlanItem } from '@/lib/prompts/genre-rules';

export function generateTempoPlan(
  genre: string,
  media: 'book' | 'web',
  totalChapters: number,
): TempoPlanItem[] {
  return Array.from({ length: totalChapters }, (_, i) => {
    const ch = i + 1;

    if (genre === 'fantasy' && media === 'book') {
      const isBattle  = ch % 6 === 0;
      const isRelease = ch % 6 === 1;
      return {
        chapter:      ch,
        role:         isBattle ? 'tension' : isRelease ? 'release' : 'neutral',
        sceneTypeHint: isBattle ? 'battle' : 'daily',
      };
    }

    if (genre === 'romance' && media === 'web') {
      const isSweet = ch % 5 === 0;
      return {
        chapter:            ch,
        role:               'neutral',
        sceneTypeHint:      isSweet ? 'romance' : 'daily',
        sweetSceneRequired: isSweet,
      };
    }

    if (genre === 'horror') {
      const isHorror  = ch % 4 === 0;
      const isRelease = ch % 4 === 1;
      return {
        chapter:      ch,
        role:         isHorror ? 'tension' : isRelease ? 'release' : 'neutral',
        sceneTypeHint: isHorror ? 'horror_peak' : 'daily',
      };
    }

    if (genre === 'mystery') {
      const isReveal = ch % 4 === 0;
      return {
        chapter:      ch,
        role:         isReveal ? 'tension' : 'neutral',
        sceneTypeHint: isReveal ? 'investigation' : 'daily',
      };
    }

    // SF・その他
    void GENRE_RULES[genre]; // 存在確認のみ
    return { chapter: ch, role: 'neutral', sceneTypeHint: 'daily' };
  });
}
