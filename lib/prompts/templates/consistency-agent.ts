import type { Character, Foreshadowing } from '@prisma/client';

type ChapterSnap = { number: number; summary: string | null; content: string | null };

export function buildConsistencyPrompt(ctx: {
  chapters: ChapterSnap[];
  foreshadowing: Foreshadowing[];
  characters: Character[];
}) {
  const unresolvedFS = ctx.foreshadowing.filter(
    f => !f.isResolved && f.resolveChapter != null && ctx.chapters.some(c => c.number >= f.resolveChapter!)
  );

  const fsList = ctx.foreshadowing.map(f =>
    `- [${f.id.slice(0, 6)}] ${f.description} (埋: 第${f.plantedChapter ?? '?'}章 / 回収予定: 第${f.resolveChapter ?? '?'}章 / 回収済: ${f.isResolved ? 'はい' : '未回収'}${f.isFake ? ' / フェイク' : ''})`
  ).join('\n') || 'なし';

  const charList = ctx.characters.map(c =>
    `- ${c.name}（役割: ${c.role} / アーク: ${c.arc ?? '未設定'} / 進捗: ${c.arcProgress}%）`
  ).join('\n') || 'なし';

  const chapterList = ctx.chapters.map(c =>
    `- 第${c.number}章: ${c.summary ?? '（要約なし）'}`
  ).join('\n') || 'なし';

  const unresolvedAlert = unresolvedFS.length > 0
    ? `\n## ⚠️ 未回収伏線（回収予定章を過ぎているもの）\n${unresolvedFS.map(f => `- ${f.description}`).join('\n')}\n`
    : '';

  return `あなたは小説の整合性チェッカーです。以下の情報を分析し、矛盾・問題点をJSONで報告してください。

## キャラクター一覧
${charList}

## 伏線一覧
${fsList}
${unresolvedAlert}
## 章要約
${chapterList}

## 出力JSON形式
{
  "issues": [
    {
      "type": "foreshadowing_unresolved" | "character_inconsistency" | "plot_contradiction" | "arc_stagnation",
      "severity": "error" | "warning" | "info",
      "description": "問題の説明",
      "chapter": null または関連章番号,
      "suggestion": "改善提案"
    }
  ],
  "overall": "問題なし" | "要注意" | "重大な問題あり",
  "summary": "全体的な整合性コメント（100字以内）"
}

問題がない場合は issues を空配列にしてください。JSONのみを返してください。`;
}
