type PlotChapter = {
  number:       number;
  title:        string;
  summary:      string;
  emotion_score: number;
  scene_type:   string;
  tempo_role:   string;
};

type PlotOutline = {
  total_chapters: number;
  chapters:       PlotChapter[];
};

export function buildPlotRefinerPrompt(ctx: {
  currentPlot:  PlotOutline;
  editRequest:  string;
  genre:        string;
  media:        string;
}) {
  const plotJson = JSON.stringify(ctx.currentPlot, null, 2);

  return `あなたは「${ctx.genre}」ジャンル（${ctx.media === 'book' ? '書籍' : 'ウェブ小説'}）の小説構成エディターです。
以下の既存プロットをユーザーの指示に従って修正し、同じJSON形式で返してください。

## ユーザーの修正指示
${ctx.editRequest || '（指示なし — 全体的な改善をしてください）'}

## 既存プロット (JSON)
\`\`\`json
${plotJson}
\`\`\`

## 修正ルール
- total_chapters と chapters 配列の構造を維持する
- emotion_score は 0〜10 の整数
- scene_type は: standard / emotional_peak / battle / mystery_reveal / sweet_scene / horror_peak / twist / setup / climax / epilogue / relief のいずれか
- tempo_role は: tension / release / neutral のいずれか
- 修正指示に関係しない章は極力変更しない
- 整合性（伏線・感情曲線の自然な流れ）を保つ

## 出力形式
以下のJSON構造のみを返してください（コードブロック不要）:
{
  "total_chapters": 数値,
  "chapters": [
    {
      "number": 章番号,
      "title": "章タイトル",
      "summary": "章の概要（100字以内）",
      "emotion_score": 0〜10の整数,
      "scene_type": "シーンタイプ",
      "tempo_role": "tension|release|neutral"
    }
  ]
}`;
}
