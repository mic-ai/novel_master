'use client';

import type { SimilarityStatus } from '@/lib/copyright/fingerprint';

type ChapterPairResult = {
  chapterA: number;
  chapterB: number;
  similarity: number;
  status: SimilarityStatus;
};

type Props = {
  results: ChapterPairResult[];
  overallStatus: SimilarityStatus;
  maxSimilarity: number;
  scannedChapters: number;
};

const STATUS_STYLES: Record<SimilarityStatus, { badge: string; text: string; label: string }> = {
  CLEAN:    { badge: 'bg-green-100 text-green-800',  text: 'text-green-700', label: 'クリーン' },
  WARNING:  { badge: 'bg-yellow-100 text-yellow-800', text: 'text-yellow-700', label: '注意' },
  FLAGGED:  { badge: 'bg-orange-100 text-orange-800', text: 'text-orange-700', label: '要確認' },
  CRITICAL: { badge: 'bg-red-100 text-red-800',      text: 'text-red-700',    label: '高類似' },
};

export function ScanResult({ results, overallStatus, maxSimilarity, scannedChapters }: Props) {
  const style = STATUS_STYLES[overallStatus];
  const flagged = results.filter(r => r.status === 'FLAGGED' || r.status === 'CRITICAL');

  return (
    <div className="space-y-4">
      {/* Overall result */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm text-gray-500">{scannedChapters} 章をスキャン</p>
          <p className="mt-1 text-lg font-semibold">
            最大類似度: {(maxSimilarity * 100).toFixed(1)}%
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Per-pair results */}
      {results.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">章間類似度</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results
              .sort((a, b) => b.similarity - a.similarity)
              .map((r, i) => {
                const s = STATUS_STYLES[r.status];
                return (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span className="text-gray-600">
                      第{r.chapterA}章 ↔ 第{r.chapterB}章
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${s.text}`}>
                        {(r.similarity * 100).toFixed(1)}%
                      </span>
                      <span className={`rounded px-2 py-0.5 text-xs ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {flagged.length > 0 && (
        <p className="rounded bg-orange-50 px-3 py-2 text-xs text-orange-700">
          {flagged.length} 件の章ペアで類似度が高くなっています。同じシーンや描写の繰り返しがないか確認してください。
        </p>
      )}

      <p className="text-xs text-gray-400">
        ※ 内部比較のみ。類似度が高い場合でも、独立した創作の可能性があります。
      </p>
    </div>
  );
}
