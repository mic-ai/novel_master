export function buildSummarizePrompt(ctx: {
  chapterContent: string;
  chapterNumber: number;
}) {
  return `あなたは小説の編集者です。以下の第${ctx.chapterNumber}章を500字以内で要約してください。
要約は次章の執筆コンテキストとして自動注入されます。以下の情報を必ず含めてください：
- 章の主要な出来事（起きたこと・決まったこと）
- 登場キャラクターの心理変化・感情の動き
- 伏線として機能する描写や台詞
- 章末の状況（次章の起点となる場面）

## 対象テキスト（第${ctx.chapterNumber}章）
${ctx.chapterContent}

500字以内の要約テキストのみを返してください。JSONや前置きは不要です。`;
}
