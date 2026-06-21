'use client';

import { useState } from 'react';

interface ConflictDesignerProps {
  projectId: string;
  genre: string;
  onComplete: (data: { goal: string; obstacles: string[] }) => void;
}

export default function ConflictDesigner({ projectId, genre, onComplete }: ConflictDesignerProps) {
  const [goal, setGoal] = useState('');
  const [obstacleInput, setObstacleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/conflict', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, goal, obstacleInput, genre }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (data['error']) { setError(String(data['error'])); return; }
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!goal) return;
    const obstacles = Array.isArray(result?.['obstacles'])
      ? (result['obstacles'] as Array<{ description: string }>).map((o) => o.description)
      : [obstacleInput];
    onComplete({ goal, obstacles });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">STEP 4：目標とハードル設定</h2>
        <p className="text-gray-600">主人公が何を目指し、何が立ちはだかるかを設定します</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            主人公の外的目標（物語を通じて達成したいこと）
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例: 幼馴染と再び仲直りしたい / 犯人を見つけて妹の汚名を晴らしたい"
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            障害・ハードル（目標を阻むもの、複数可）
          </label>
          <textarea
            value={obstacleInput}
            onChange={(e) => setObstacleInput(e.target.value)}
            rows={4}
            placeholder="例:&#10;・過去のトラウマで傷つけることへの恐怖&#10;・ライバルの存在&#10;・家族の反対"
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !goal.trim()}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          {loading ? '分析中...' : 'AIで三幕構成に分類'}
        </button>
      </div>

      {result && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-indigo-800">構成分析結果</h3>
          {result['inner_goal'] != null && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">内的目標：</span>
              <span className="text-gray-800">{String(result['inner_goal'])}</span>
            </div>
          )}
          {Array.isArray(result['obstacles']) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">障害の配置：</p>
              {(result['obstacles'] as Array<{ description: string; part: string; intensity: number }>).map(
                (o, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 text-sm border border-indigo-100">
                    <div className="font-medium text-gray-800">{o.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      配置：{o.part} / 強度：{'★'.repeat(Math.round(o.intensity / 2))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!goal}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition text-sm"
      >
        確定してプロット生成へ →
      </button>
    </div>
  );
}
