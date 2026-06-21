export function buildContinuationPrompt(ctx: {
  currentContent: string;
  genre:          string;
  media:          string;
  chapterSummary?: string;
}) {
  const summarySection = ctx.chapterSummary
    ? `\n## 章の概要（参考）\n${ctx.chapterSummary}\n`
    : '';

  const tailLength  = Math.min(ctx.currentContent.length, 600);
  const contentTail = ctx.currentContent.slice(-tailLength);

  return `あなたは「${ctx.genre}」ジャンル（${ctx.media === 'book' ? '書籍' : 'ウェブ小説'}）の小説執筆アシスタントです。
執筆が止まっているユーザーのために、以下の続きを300〜500字で提案してください。

## ルール
- 現在の文体・視点・トーンをそのまま引き継ぐ
- 会話・行動・感情のうち最も自然な展開を選ぶ
- 文末は次の文章につながる形で終える（完結させない）
- 提案テキストのみを返す（前置き・説明不要）
${summarySection}
## 現在の本文（末尾${tailLength}字）
${contentTail}`;
}
