export type InlineInstruction = 'rewrite' | 'expand';

const INSTRUCTION_TEXT: Record<InlineInstruction, string> = {
  rewrite: '選択されたテキストを書き直してください。同じ意味をより自然で魅力的な表現に変えてください。',
  expand:  '選択されたテキストを膨らませてください。感情描写・情景描写・キャラクターの内面を追加し、2〜4倍の長さにしてください。',
};

export function buildInlineEditPrompt(ctx: {
  selectedText: string;
  instruction:  InlineInstruction;
  genre:        string;
  context?:     string;
}) {
  const instructionText = INSTRUCTION_TEXT[ctx.instruction];
  const contextSection  = ctx.context
    ? `\n## 前後の文脈（参考）\n${ctx.context}\n`
    : '';

  return `あなたは「${ctx.genre}」ジャンルの小説執筆アシスタントです。
${instructionText}

ジャンルのトーンと文体を維持してください。
選択テキストの言語（日本語）を保ちつつ、明朝体の小説文体で書いてください。
結果のテキストのみを返してください。説明・前置き・引用符は不要です。
${contextSection}
## 対象テキスト
${ctx.selectedText}`;
}
