'use client';

import { useState } from 'react';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';

const GENRE_ICONS: Record<string, string> = {
  romance: '💕',
  mystery: '🔍',
  fantasy: '⚔️',
  sf:      '🚀',
  horror:  '👻',
};

const MEDIA_OPTIONS = [
  { value: 'book', label: '書籍', desc: '印刷・電子書籍向け' },
  { value: 'web',  label: 'ウェブ小説', desc: 'カクヨム・なろう向け' },
];

interface GenreSelectorProps {
  onConfirm: (data: { genre: string; subgenre?: string; media: string }) => void;
}

export default function GenreSelector({ onConfirm }: GenreSelectorProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<string>('book');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ genre: string; reasoning: string } | null>(null);

  const handleAiSuggest = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/agent/genre', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userInput: aiInput }),
      });
      const data = await res.json() as { genre?: string; media?: string; reasoning?: string };
      if (data.genre) {
        setSelectedGenre(data.genre);
        if (data.media) setSelectedMedia(data.media);
        setAiResult({ genre: data.genre, reasoning: data.reasoning ?? '' });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedGenre) return;
    onConfirm({ genre: selectedGenre, media: selectedMedia });
  };

  const selectedRule = selectedGenre ? GENRE_RULES[selectedGenre] : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">STEP 1：ジャンルを選択</h2>
        <p className="text-gray-600">書きたい小説のジャンルを選んでください</p>
      </div>

      {/* AIに提案してもらう */}
      <div className="bg-blue-50 rounded-xl p-5 space-y-3">
        <p className="font-semibold text-blue-800">AIに提案してもらう</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="例: 学校を舞台にした青春ストーリーを書きたい"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading || !aiInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {aiLoading ? '提案中...' : '提案'}
          </button>
        </div>
        {aiResult && (
          <p className="text-sm text-blue-700 bg-white rounded-lg p-3 border border-blue-200">
            提案: <strong>{GENRE_RULES[aiResult.genre]?.label ?? aiResult.genre}</strong>
            {aiResult.reasoning && <span className="ml-2 text-gray-600">— {aiResult.reasoning}</span>}
          </p>
        )}
      </div>

      {/* ジャンルグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(GENRE_RULES).map(([key, rule]) => (
          <button
            key={key}
            onClick={() => setSelectedGenre(key)}
            className={`rounded-xl p-5 text-left border-2 transition-all hover:shadow-md ${
              selectedGenre === key
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
          >
            <div className="text-3xl mb-2">{GENRE_ICONS[key]}</div>
            <div className="font-bold text-gray-900 text-sm">{rule.label}</div>
            <div className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
              {rule.core_principle}
            </div>
          </button>
        ))}
      </div>

      {/* 選択中ジャンルの詳細 */}
      {selectedRule && (
        <div className="bg-indigo-50 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-indigo-900">
            {GENRE_ICONS[selectedGenre]} {selectedRule.label}
          </h3>
          <p className="text-sm text-indigo-800">{selectedRule.core_principle}</p>
          <div className="flex flex-wrap gap-2">
            {selectedRule.keywords.map((kw) => (
              <span key={kw} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 媒体選択 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">媒体を選択</h3>
        <div className="flex gap-3">
          {MEDIA_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMedia(m.value)}
              className={`flex-1 rounded-lg p-4 border-2 text-left transition-all ${
                selectedMedia === m.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{m.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 確定ボタン */}
      <button
        onClick={handleConfirm}
        disabled={!selectedGenre}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition text-sm"
      >
        {selectedGenre
          ? `「${GENRE_RULES[selectedGenre]?.label}」で進む →`
          : 'ジャンルを選択してください'}
      </button>
    </div>
  );
}
