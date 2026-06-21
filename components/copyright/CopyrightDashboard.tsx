'use client';

import { useState } from 'react';
import { ScanResult } from './ScanResult';
import { ExportModal } from './ExportModal';
import type { SimilarityStatus } from '@/lib/copyright/fingerprint';

type ProofRecord = {
  id: string;
  chapterNumber: number | null;
  contentHash: string;
  timestamp: string;
  isPublished: boolean;
};

type ScanData = {
  results: { chapterA: number; chapterB: number; similarity: number; status: SimilarityStatus }[];
  overallStatus: SimilarityStatus;
  maxSimilarity: number;
  scannedChapters: number;
};

type Props = {
  projectId: string;
  projectTitle: string;
  initialRecords: ProofRecord[];
};

export function CopyrightDashboard({ projectId, projectTitle, initialRecords }: Props) {
  const [records, setRecords]     = useState<ProofRecord[]>(initialRecords);
  const [scanData, setScanData]   = useState<ScanData | null>(null);
  const [verifyId, setVerifyId]   = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [scanning, setScanning]   = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError]         = useState('');

  async function runScan() {
    setScanning(true);
    setError('');
    try {
      const res = await fetch('/api/copyright/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'スキャンに失敗しました');
      }
      setScanData(await res.json() as ScanData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setScanning(false);
    }
  }

  async function verifyRecord() {
    if (!verifyId.trim()) return;
    try {
      const res = await fetch('/api/copyright/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: verifyId.trim() }),
      });
      setVerifyResult(await res.json() as { valid: boolean; reason?: string });
    } catch {
      setVerifyResult({ valid: false, reason: '通信エラー' });
    }
  }

  async function refreshRecords() {
    const res = await fetch(`/api/copyright/records?projectId=${projectId}`);
    if (res.ok) {
      const data = await res.json() as { records: ProofRecord[] };
      setRecords(data.records);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">著作権保護ダッシュボード</h2>
        <button
          onClick={() => setShowExport(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          エクスポート
        </button>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Copyright records */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-800">証明レコード</h3>
          <button onClick={refreshRecords} className="text-xs text-indigo-600 hover:underline">
            更新
          </button>
        </div>
        {records.length === 0 ? (
          <p className="text-sm text-gray-500">まだ証明レコードがありません。章を確定すると自動作成されます。</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {records.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">
                    {r.chapterNumber != null ? `第${r.chapterNumber}章` : 'プロジェクト全体'}
                  </span>
                  <span className="ml-3 font-mono text-xs text-gray-400">
                    {r.contentHash.slice(0, 12)}…
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{new Date(r.timestamp).toLocaleString('ja-JP')}</p>
                  <p className="font-mono">{r.id.slice(0, 8)}…</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verify */}
      <section>
        <h3 className="mb-2 text-base font-medium text-gray-800">署名検証</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={verifyId}
            onChange={e => setVerifyId(e.target.value)}
            placeholder="証明ID を入力"
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={verifyRecord}
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
          >
            検証
          </button>
        </div>
        {verifyResult && (
          <p className={`mt-2 text-sm ${verifyResult.valid ? 'text-green-700' : 'text-red-700'}`}>
            {verifyResult.valid ? '✓ 署名が一致します（改ざんなし）' : `✗ ${verifyResult.reason ?? '無効'}`}
          </p>
        )}
      </section>

      {/* Plagiarism scan */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-800">類似度チェック</h3>
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {scanning ? 'スキャン中…' : 'スキャン実行'}
          </button>
        </div>
        {scanData ? (
          <ScanResult {...scanData} />
        ) : (
          <p className="text-sm text-gray-500">
            全章のフィンガープリントを比較して重複・類似箇所を検出します。
          </p>
        )}
      </section>

      {showExport && (
        <ExportModal
          projectId={projectId}
          projectTitle={projectTitle}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
