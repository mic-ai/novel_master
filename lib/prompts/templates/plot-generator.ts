import { getGenreContext } from '@/lib/agent/utils/get-genre-context';
import type { Character, WorldSettings, Obstacle } from '@/lib/prompts/genre-rules';

export function buildPlotGeneratorPrompt(ctx: {
  genre: string;
  media: string;
  targetWords: number;
  characters: Character[];
  worldSettings: WorldSettings;
  goal: string;
  obstacles: Obstacle[];
  variantHint?: string;
}) {
  const g = getGenreContext(ctx.genre, ctx.media as 'book' | 'web');

  const partLines = g.parts
    .map(
      (p) =>
        `${p.name}: ${(p.ratio * 100).toFixed(0)}% = 約${Math.round((ctx.targetWords * p.ratio) / 1000) * 1000}字 → ${p.focus}`,
    )
    .join('\n');

  const cw = g.chapter_words;
  const std = cw['standard'] as { min: number; max: number } | undefined;
  const totalChapters = cw['total_chapters'] as { min: number; max: number } | undefined;

  const variantSection = ctx.variantHint
    ? `\n## バリエーション指針（このプロット案限定）\n${ctx.variantHint}\n`
    : '';

  return `あなたは「${g.label}」専門の小説構成エディターです。${variantSection}

## ジャンルの核心原則
${g.core_principle}

## パート配分ルール（必ず遵守）
${partLines}

## 文字数・章数の目安
- 媒体: ${ctx.media === 'book' ? '書籍' : 'ウェブ小説'}
- 目標総文字数: ${ctx.targetWords.toLocaleString()}字
- 通常1章の目安: ${std ? `${std.min.toLocaleString()}〜${std.max.toLocaleString()}字` : '2000〜5000字'}
- 全体の章数目安: ${totalChapters ? `${totalChapters.min}〜${totalChapters.max}章` : '15〜30章'}

## 章末ルール（各章に適用）
${g.chapter_ending_rules.map((r) => `- ${r}`).join('\n')}

## 視点ルール
- デフォルト視点: ${g.pov_rules['default']}
- 切り替えルール: ${g.pov_rules['switching']}

## キャラクター情報
${ctx.characters
  .map(
    (c) =>
      `- ${c.name}（${c.role}）: 欠乏=${c.lack ?? 'なし'} / 欲求=${c.want ?? 'なし'} / 弱点=${c.weakness ?? 'なし'} / アーク=${c.arcStart ?? '—'}→${c.arcEnd ?? '—'}`,
  )
  .join('\n')}

## 世界設定
${JSON.stringify(ctx.worldSettings, null, 2)}

## 主人公の目標と障害
- 外的目標: ${ctx.goal}
- 障害: ${ctx.obstacles.map((o) => o.description).join(' / ')}

## 出力形式（JSON厳守）
以下のJSONスキーマに従い、JSONのみを返してください。マークダウンのコードブロックは不要です。

{
  "total_chapters": 整数,
  "parts": [
    {
      "name": "パート名",
      "chapter_range": [開始章番号, 終了章番号],
      "focus": "このパートの焦点"
    }
  ],
  "chapters": [
    {
      "number": 章番号,
      "title": "章タイトル",
      "summary": "この章で起こること（200字以内）",
      "emotion_score": 0から10の感情スコア,
      "scene_type": "シーンタイプ",
      "tempo_role": "tension|release|neutral",
      "key_events": ["主要イベント1", "主要イベント2"],
      "foreshadowing": ["この章で埋める伏線（あれば）"]
    }
  ],
  "foreshadowing_list": [
    {
      "description": "伏線の説明",
      "plant_chapter": 埋める章番号,
      "resolve_chapter": 回収する章番号,
      "is_fake": false
    }
  ]
}`;
}
