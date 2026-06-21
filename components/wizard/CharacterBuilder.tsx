'use client';

import { useState } from 'react';

interface CharacterForm {
  role: string;
  name: string;
  age: string;
  lack: string;
  want: string;
  weakness: string;
  arc: string;
  arcStart: string;
  arcEnd: string;
  trait: string;
}

const ROLES = [
  { value: 'protagonist', label: '主人公' },
  { value: 'heroine',     label: 'ヒロイン/ヒーロー' },
  { value: 'antagonist',  label: '敵対者' },
  { value: 'mentor',      label: 'メンター' },
  { value: 'sub',         label: 'サブキャラ' },
];

const ARCS = [
  { value: 'growth', label: '成長型' },
  { value: 'fall',   label: '堕落型' },
  { value: 'flat',   label: '平坦型' },
];

interface CharacterBuilderProps {
  projectId: string;
  genre: string;
  onComplete: () => void;
}

const emptyForm = (): CharacterForm => ({
  role: 'protagonist', name: '', age: '', lack: '', want: '',
  weakness: '', arc: 'growth', arcStart: '', arcEnd: '', trait: '',
});

export default function CharacterBuilder({ projectId, genre, onComplete }: CharacterBuilderProps) {
  const [characters, setCharacters] = useState<CharacterForm[]>([emptyForm()]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateCharacter = (index: number, field: keyof CharacterForm, value: string) => {
    setCharacters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCharacter = () => setCharacters((prev) => [...prev, emptyForm()]);

  const removeCharacter = (index: number) => {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/character', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, userInput: aiInput, genre }),
      });
      const data = await res.json() as { characters?: Array<Record<string, string>>; error?: string };
      if (data.error) { setError(data.error); return; }
      if (data.characters) {
        onComplete();
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const input = characters
        .map(
          (c) =>
            `${ROLES.find((r) => r.value === c.role)?.label ?? c.role}「${c.name}」:欠乏=${c.lack},欲求=${c.want},弱点=${c.weakness},アーク=${c.arcStart}→${c.arcEnd},口癖=${c.trait}`,
        )
        .join('\n');

      const res = await fetch('/api/agent/character', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, userInput: input, genre }),
      });
      const data = await res.json() as { characters?: unknown[]; error?: string };
      if (data.error) { setError(data.error); return; }
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">STEP 2：キャラクター設定</h2>
        <p className="text-gray-600">主人公や重要キャラクターを設計します</p>
      </div>

      {/* AIに生成してもらう */}
      <div className="bg-blue-50 rounded-xl p-5 space-y-3">
        <p className="font-semibold text-blue-800">AIにキャラクターを生成してもらう</p>
        <textarea
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          rows={3}
          placeholder="例: 高校生の内気な女の子が主人公。人と話すのが苦手だけど音楽が得意。幼馴染の男の子と再会して..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAiGenerate}
          disabled={aiLoading || !aiInput.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition"
        >
          {aiLoading ? '生成中...' : 'AIで生成して保存'}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-400">または手動で入力</span></div>
      </div>

      {/* キャラクター入力フォーム */}
      <div className="space-y-6">
        {characters.map((c, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">キャラクター {index + 1}</h3>
              {characters.length > 1 && (
                <button onClick={() => removeCharacter(index)} className="text-red-400 hover:text-red-600 text-sm">
                  削除
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">役割</label>
                <select
                  value={c.role}
                  onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">名前</label>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                  placeholder="例: 田中 桜"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">欠乏（何が欠けているか）</label>
                <input
                  type="text"
                  value={c.lack}
                  onChange={(e) => updateCharacter(index, 'lack', e.target.value)}
                  placeholder="例: 自己肯定感"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">欲求（何を求めているか）</label>
                <input
                  type="text"
                  value={c.want}
                  onChange={(e) => updateCharacter(index, 'want', e.target.value)}
                  placeholder="例: 誰かに認められたい"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">弱点</label>
                <input
                  type="text"
                  value={c.weakness}
                  onChange={(e) => updateCharacter(index, 'weakness', e.target.value)}
                  placeholder="例: 人前で話せない"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">アーク（成長の方向）</label>
                <select
                  value={c.arc}
                  onChange={(e) => updateCharacter(index, 'arc', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {ARCS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">物語開始時の状態</label>
                <input
                  type="text"
                  value={c.arcStart}
                  onChange={(e) => updateCharacter(index, 'arcStart', e.target.value)}
                  placeholder="例: 臆病で一人ぼっち"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">物語終了時の状態</label>
                <input
                  type="text"
                  value={c.arcEnd}
                  onChange={(e) => updateCharacter(index, 'arcEnd', e.target.value)}
                  placeholder="例: 自分を表現できる"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">口癖・特徴的行動</label>
                <input
                  type="text"
                  value={c.trait}
                  onChange={(e) => updateCharacter(index, 'trait', e.target.value)}
                  placeholder="例: 緊張すると耳を触る"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCharacter}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition text-sm"
      >
        + キャラクターを追加
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || characters.every((c) => !c.name)}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition text-sm"
      >
        {saving ? '保存中...' : 'キャラクターを保存して次へ →'}
      </button>
    </div>
  );
}
