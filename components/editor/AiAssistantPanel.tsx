'use client';

import ForeshadowingReminder from './ForeshadowingReminder';

interface ReviewItem {
  rule:     string;
  score:    number;
  max:      number;
  passed:   boolean;
  feedback: string;
}

interface ReviewResult {
  total_score:       number;
  items:             ReviewItem[];
  overall_feedback:  string;
  chapter_ending_check?: { passed: boolean; current_ending: string; suggestion: string };
  foreshadowing_check?:  { planted: string[]; missing: string[] };
}

interface ForeshadowingItem {
  id:          string;
  description: string;
  isFake:      boolean;
}

interface Character {
  id:   string;
  name: string;
  role: string;
}

interface AiAssistantPanelProps {
  projectId:          string;
  chapterNumber:      number;
  outline:            { title?: string; sceneType?: string; tempoRole?: string; chapterEndingRule?: string } | null;
  foreshadowingItems: ForeshadowingItem[];
  content:            string;
  isGenerating:       boolean;
  onGenerate:         () => void;
  review:             ReviewResult | null;
  isReviewing:        boolean;
  onReview:           () => void;
  plotChapterSummary?: string;
  characters:          Character[];
  povCharId:           string;
  onPovChange:         (charId: string) => void;
  sceneMemo:           string;
  onSceneMemoChange:   (memo: string) => void;
  onAutoMemo:          () => void;
  isSavingOutline?:    boolean;
}

const SCORE_COLOR = (score: number, max: number) => {
  const pct = score / max;
  if (pct >= 0.8) return 'text-emerald-600';
  if (pct >= 0.5) return 'text-amber-600';
  return 'text-red-500';
};

export default function AiAssistantPanel({
  chapterNumber,
  outline,
  foreshadowingItems,
  content,
  isGenerating,
  onGenerate,
  review,
  isReviewing,
  onReview,
  plotChapterSummary,
  characters,
  povCharId,
  onPovChange,
  sceneMemo,
  onSceneMemoChange,
  onAutoMemo,
  isSavingOutline,
}: AiAssistantPanelProps) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      {/* 章情報 */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">章の情報</div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs text-gray-600">
          <div><span className="text-gray-400">タイトル:</span> {outline?.title ?? `第${chapterNumber}章`}</div>
          {outline?.sceneType && (
            <div><span className="text-gray-400">シーンタイプ:</span> {outline.sceneType}</div>
          )}
          {outline?.chapterEndingRule && (
            <div><span className="text-gray-400">章末ルール:</span> {outline.chapterEndingRule}</div>
          )}
          {plotChapterSummary && (
            <div className="pt-1.5 border-t border-gray-200">
              <div className="text-gray-400 mb-1">プロット内容</div>
              <p className="leading-relaxed text-gray-600">{plotChapterSummary}</p>
            </div>
          )}
        </div>
      </div>

      {/* 視点キャラクター */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">視点キャラクター</div>
        <select
          value={povCharId}
          onChange={(e) => onPovChange(e.target.value)}
          className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">（指定なし — AIが判断）</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}（{c.role}）
            </option>
          ))}
        </select>
      </div>

      {/* この章の進行 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">この章の進行</div>
          <button
            type="button"
            onClick={onAutoMemo}
            className="text-xs text-indigo-500 hover:text-indigo-700 transition"
            title="プロット概要からこの章の進行を自動入力します"
          >
            プロットから自動入力
          </button>
        </div>
        <textarea
          value={sceneMemo}
          onChange={(e) => onSceneMemoChange(e.target.value)}
          rows={4}
          placeholder="この章の大まかな流れを記入してください。AIで生成する際のヒントになります。&#10;例：主人公が敵と遭遇し、苦戦の末に仲間に救われる。"
          className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
        />
        {isSavingOutline && (
          <p className="text-xs text-gray-400 mt-1">保存中...</p>
        )}
      </div>

      {/* 伏線リマインダー */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          配置すべき伏線
        </div>
        <ForeshadowingReminder items={foreshadowingItems} />
      </div>

      {/* AI生成ボタン */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating || isReviewing}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium
            hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-pulse">●</span>
              生成中...
            </>
          ) : (
            '✦ AIで生成'
          )}
        </button>
        {content && (
          <button
            onClick={onReview}
            disabled={isGenerating || isReviewing}
            className="w-full mt-2 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm
              hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isReviewing ? '添削中...' : '添削する'}
          </button>
        )}
      </div>

      {/* 添削結果 */}
      {review && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">添削結果</div>
            <div className="text-lg font-bold text-indigo-600">{review.total_score}<span className="text-xs text-gray-400 font-normal">/100</span></div>
          </div>

          {/* スコアバー */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                review.total_score >= 80 ? 'bg-emerald-400' :
                review.total_score >= 60 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${review.total_score}%` }}
            />
          </div>

          {/* 各項目 */}
          <div className="space-y-2">
            {review.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={item.passed ? 'text-emerald-500 mt-0.5' : 'text-red-400 mt-0.5'}>
                  {item.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-700 font-medium">{item.rule}</span>
                    <span className={`ml-auto flex-shrink-0 font-semibold ${SCORE_COLOR(item.score, item.max)}`}>
                      {item.score}/{item.max}
                    </span>
                  </div>
                  {!item.passed && (
                    <p className="text-gray-400 leading-relaxed mt-0.5">{item.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 章末チェック */}
          {review.chapter_ending_check && !review.chapter_ending_check.passed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
              <div className="font-medium text-amber-700 mb-1">章末の改善提案</div>
              <p className="text-amber-600">{review.chapter_ending_check.suggestion}</p>
            </div>
          )}

          {/* 総評 */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 leading-relaxed">
            {review.overall_feedback}
          </div>
        </div>
      )}
    </div>
  );
}
