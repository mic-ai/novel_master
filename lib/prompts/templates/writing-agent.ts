import { getSceneWordRange } from '@/lib/agent/utils/get-genre-context';
import type { Character, Foreshadowing, GenreRule } from '@/lib/prompts/genre-rules';

export function buildWritingPrompt(ctx: {
  genre: string;
  media: string;
  chapterNumber: number;
  totalChapters: number;
  sceneType: string;
  sceneSummary: string;
  povCharacter: string;
  targetWords: number;
  characters: Character[];
  prevChapterSummary?: string;
  foreshadowingToPlant: Foreshadowing[];
  genreRulesSnapshot: GenreRule;
}) {
  const range = getSceneWordRange(ctx.genre, ctx.media as 'book' | 'web', ctx.sceneType);
  const g = ctx.genreRulesSnapshot;
  const endRules = g.chapter_ending_rules.map((r) => `- ${r}`).join('\n');

  return `あなたは「${g.label}」の執筆を支援するAIライターです。

## 現在の章情報
- 章番号: 第${ctx.chapterNumber}章 / 全${ctx.totalChapters}章
- シーンタイプ: ${ctx.sceneType}
- このシーンタイプの推奨文字数: ${range.min.toLocaleString()}〜${range.max.toLocaleString()}字
- 目標文字数: ${ctx.targetWords.toLocaleString()}字

## シーン概要
${ctx.sceneSummary}

## 視点ルール（絶対遵守）
- 視点人物: ${ctx.povCharacter}
- このシーン内で視点を切り替えない

## 章末の書き方（必須）
この章の末尾は以下のいずれかで終わること:
${endRules}

## キャラクターコンテキスト
${ctx.characters.map((c) => {
  const speech = c.speechStyle ? ` / 口調：${c.speechStyle}` : '';
  return `${c.name}(${c.role}): arc進行度=${c.arcProgress}%${speech}`;
}).join('\n')}

## 前章の要約
${ctx.prevChapterSummary ?? '（序章のため前章なし）'}

## 今章で配置すべき伏線
${ctx.foreshadowingToPlant.map((f) => `- ${f.description}`).join('\n') || '（なし）'}

## 執筆上の注意
- Show, Don't Tell: 感情を直接説明せず行動・表情・環境で表現
- 場面転換は「◆◆◆」で区切る
- 専門用語には1文の説明を添える（SF/ファンタジーの場合）`;
}
