import { COMMON_RULES } from '@/lib/prompts/common-rules';
import type { Foreshadowing, GenreRule } from '@/lib/prompts/genre-rules';

export function buildReviewPrompt(ctx: {
  genre: string;
  media: string;
  chapterContent: string;
  genreRulesSnapshot: GenreRule;
  foreshadowingToPlant: Foreshadowing[];
}) {
  const g = ctx.genreRulesSnapshot;
  const allRubric = [...COMMON_RULES.writing_rubric, ...g.review_extra];
  const rubricLines = allRubric
    .map((r) => `- ${'rule' in r ? r.rule : r.item} [${r.weight}点]: ${r.pass}`)
    .join('\n');

  return `あなたは「${g.label}」専門の文章添削エディターです。
以下のルーブリックで採点し、JSONのみで返してください。

## ルーブリック（合計100点）
${rubricLines}

## 伏線チェックリスト
配置すべき伏線: ${ctx.foreshadowingToPlant.map((f) => f.description).join(' / ') || 'なし'}

## 章末チェック
適用すべき章末ルール:
${g.chapter_ending_rules.map((r) => `- ${r}`).join('\n')}

## 対象テキスト
${ctx.chapterContent}

## 出力JSON形式
{
  "total_score": 0から100の整数,
  "items": [
    {
      "rule": "ルール名",
      "score": 獲得点,
      "max": 最大点,
      "passed": true,
      "feedback": "具体的な改善提案"
    }
  ],
  "chapter_ending_check": {
    "passed": true,
    "current_ending": "章末の最後の文",
    "suggestion": "改善案"
  },
  "foreshadowing_check": {
    "planted": ["配置済みの伏線"],
    "missing": ["未配置の伏線"]
  },
  "overall_feedback": "総評（200字以内）"
}`;
}
