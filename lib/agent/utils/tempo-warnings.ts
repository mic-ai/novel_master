import { GENRE_RULES } from '@/lib/prompts/genre-rules';

export interface TempoWarning {
  level:   'warning' | 'error';
  message: string;
}

export function getTempoWarnings({
  genre,
  media,
  currentChapterNumber,
  chapterOutlines,
}: {
  genre:                string;
  media:                string;
  currentChapterNumber: number;
  chapterOutlines:      Array<{ chapterNumber: number; sceneType?: string | null }>;
}): TempoWarning[] {
  const warnings: TempoWarning[] = [];
  const rule = GENRE_RULES[genre];
  if (!rule) return warnings;

  // romance/web: 直近 sweet_scene_interval 話に甘いシーンなし
  if (genre === 'romance' && media === 'web') {
    const webRules = rule.tempo_rules.web as { sweet_scene_interval?: number } | undefined;
    const interval = webRules?.sweet_scene_interval ?? 5;
    if (currentChapterNumber > interval) {
      const windowStart = currentChapterNumber - interval;
      const recentChapters = chapterOutlines.filter(
        (o) => o.chapterNumber >= windowStart && o.chapterNumber < currentChapterNumber,
      );
      const hasSweet = recentChapters.some(
        (o) => o.sceneType === 'romance' || o.sceneType === 'sweet_scene',
      );
      if (!hasSweet) {
        warnings.push({
          level:   'warning',
          message: `直近${interval}話に甘いシーンがありません（romance または sweet_scene シーンを配置してください）`,
        });
      }
    }
  }

  // fantasy/book: battle_interval.max 章以上バトルシーンなし
  if (genre === 'fantasy' && media === 'book') {
    const bookRules = rule.tempo_rules.book as { battle_interval?: { min: number; max: number } } | undefined;
    const maxInterval = bookRules?.battle_interval?.max ?? 7;
    const battleChapters = chapterOutlines
      .filter((o) => o.sceneType === 'battle' && o.chapterNumber < currentChapterNumber)
      .map((o) => o.chapterNumber);
    if (battleChapters.length > 0) {
      const lastBattle = Math.max(...battleChapters);
      const gap = currentChapterNumber - lastBattle;
      if (gap >= maxInterval) {
        warnings.push({
          level:   'warning',
          message: `第${lastBattle}章から${gap}章間バトルシーンがありません（${maxInterval}章以内を推奨）`,
        });
      }
    }
  }

  // horror: 恐怖ピーク直前に安心シーンなし（safety_before_horror ルール）
  if (genre === 'horror') {
    const bookRules = rule.tempo_rules.book as { safety_before_horror?: boolean } | undefined;
    if (bookRules?.safety_before_horror) {
      const currentOutline = chapterOutlines.find((o) => o.chapterNumber === currentChapterNumber);
      if (currentOutline?.sceneType === 'horror_peak') {
        const prevOutline = chapterOutlines.find((o) => o.chapterNumber === currentChapterNumber - 1);
        const reliefTypes = ['daily', 'slow_burn', 'daily_scene', 'worldbuild'];
        if (prevOutline && !reliefTypes.includes(prevOutline.sceneType ?? '')) {
          warnings.push({
            level:   'error',
            message: `恐怖ピーク直前（第${prevOutline.chapterNumber}章）に安心シーンがありません（horror setup_rule: 恐怖の直前に必ず安心感を置く）`,
          });
        }
      }
    }
  }

  return warnings;
}
