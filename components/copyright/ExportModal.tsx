'use client';

import { useState } from 'react';
import { LEGAL_NOTICES } from '@/lib/copyright/legal-notices';

type Props = {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
};

export function ExportModal({ projectId, projectTitle, onClose }: Props) {
  const [format, setFormat]     = useState<'txt' | 'md' | 'docx'>('txt');
  const [watermark, setWatermark] = useState(false);
  const [footer, setFooter]     = useState(true);
  const [consent, setConsent]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleExport() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/copyright/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          projectId,
          format,
          embedWatermarkFlag: watermark && consent,
          embedFooter:        footer,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'エクスポートに失敗しました');
      }

      let blob: Blob;
      let filename: string;

      if (format === 'docx') {
        blob     = await res.blob();
        filename = `${projectTitle}.docx`;
      } else {
        const data = await res.json() as { content: string; filename: string };
        blob       = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
        filename   = data.filename;
      }

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">「{projectTitle}」をエクスポート</h2>

        {/* Format */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">形式</label>
          <div className="flex gap-3">
            {(['txt', 'md', 'docx'] as const).map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="accent-indigo-600"
                />
                <span className="text-sm">.{f}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <label className="mb-3 flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={footer}
            onChange={e => setFooter(e.target.checked)}
            className="mt-0.5 accent-indigo-600"
          />
          <span className="text-sm text-gray-700">著作権フッターを追加する</span>
        </label>

        {/* Watermark consent */}
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="mb-2 text-xs text-orange-700 whitespace-pre-line">
            {LEGAL_NOTICES.WATERMARK_CONSENT}
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={watermark}
              onChange={e => { setWatermark(e.target.checked); if (!e.target.checked) setConsent(false); }}
              className="mt-0.5 accent-indigo-600"
            />
            <span className="text-sm text-gray-700">ウォーターマークを埋め込む</span>
          </label>
          {watermark && (
            <label className="mt-2 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 accent-orange-600"
              />
              <span className="text-xs text-orange-800 font-medium">同意します</span>
            </label>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={loading || (watermark && !consent)}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'エクスポート中...' : 'ダウンロード'}
          </button>
        </div>
      </div>
    </div>
  );
}
