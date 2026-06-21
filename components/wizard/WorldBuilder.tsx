'use client';

import { useState } from 'react';

interface WorldBuilderProps {
  projectId: string;
  genre: string;
  onComplete: () => void;
}

export default function WorldBuilder({ projectId, genre, onComplete }: WorldBuilderProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    console.log('[WorldBuilder] handleGenerate called, input:', input);
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/world', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, userInput: input, genre }),
      });
      const text = await res.text();
      console.log('[WorldBuilder] raw response:', text);
      const data = JSON.parse(text) as { worldSettings?: Record<string, unknown>; error?: string; raw?: string };
      if (data.error) { setError(data.error); return; }
      if (data.worldSettings) {
        setResult(data.worldSettings);
      } else {
        setError(`予期しないレスポンス: ${text.slice(0, 300)}`);
      }
    } catch (e) {
      setError(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">STEP 3：背景・舞台設定</h2>
        <p className="text-gray-600">物語の世界観を設計します</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          舞台について自由に書いてください
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="例: 現代の東京が舞台。主人公は大学生で、古い商店街に住んでいる。その商店街には不思議な噂があって..."
          className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          {loading ? '解析中...' : 'AIで世界設定を整理'}
        </button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-green-800">世界設定が保存されました</h3>
          {result['era'] != null && (
            <div className="text-sm"><span className="font-medium text-gray-600">時代：</span>{String(result['era'])}</div>
          )}
          {result['location'] != null && (
            <div className="text-sm"><span className="font-medium text-gray-600">舞台：</span>{String(result['location'])}</div>
          )}
          {result['atmosphere'] != null && (
            <div className="text-sm"><span className="font-medium text-gray-600">雰囲気：</span>{String(result['atmosphere'])}</div>
          )}
          {Array.isArray(result['secrets']) && result['secrets'].length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">伏線候補：</span>
              <ul className="mt-1 list-disc list-inside text-gray-700">
                {(result['secrets'] as string[]).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(result['consistency_warnings']) && result['consistency_warnings'].length > 0 && (
            <div className="text-sm bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <span className="font-medium text-yellow-700">整合性警告：</span>
              <ul className="mt-1 list-disc list-inside text-yellow-700">
                {(result['consistency_warnings'] as string[]).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={onComplete}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm"
          >
            次のステップへ →
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
