'use client';

import { useState } from 'react';

type Character = {
  id:              string;
  name:            string;
  role:            string;
  age:             number | null;
  lack:            string | null;
  want:            string | null;
  weakness:        string | null;
  arc:             string | null;
  arcStart:        string | null;
  arcEnd:          string | null;
  trait:           string | null;
  speechStyle:     string | null;
  relationshipRole: string | null;
  arcProgress:     number;
};

type Props = {
  character: Character;
  onSave: (updated: Partial<Character> & { id: string }) => Promise<void>;
};

const ARC_TYPES = ['成長型', '堕落型', '平坦型'] as const;
const ROLE_LABELS: Record<string, string> = {
  protagonist: '主人公',
  antagonist:  '拮抗役',
  mentor:      'メンター',
  ally:        '同盟者',
  mirror:      '鏡役',
  love:        '恋人役',
  comic:       'コメディリリーフ',
  other:       'その他',
};

export function CharacterCard({ character, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState<Character>({ ...character });
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  const progressColor =
    draft.arcProgress >= 80 ? 'bg-green-500' :
    draft.arcProgress >= 40 ? 'bg-yellow-400' : 'bg-blue-400';

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {editing ? (
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="text-lg font-bold w-40 border-b border-indigo-400 outline-none"
            />
          ) : (
            <h3 className="text-lg font-bold text-gray-900">{character.name}</h3>
          )}
          <p className="text-xs text-gray-500">
            {ROLE_LABELS[character.role] ?? character.role}
            {character.age != null && ` / ${character.age}歳`}
          </p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
        >
          {saving ? '保存中…' : editing ? '保存' : '編集'}
        </button>
      </div>

      {/* Arc progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">アーク進捗</span>
          <span className="text-xs font-medium text-gray-700">{draft.arcProgress}%</span>
        </div>
        {editing ? (
          <input
            type="range"
            min={0}
            max={100}
            value={draft.arcProgress}
            onChange={e => setDraft(d => ({ ...d, arcProgress: Number(e.target.value) }))}
            className="w-full accent-indigo-600"
          />
        ) : (
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full transition-all ${progressColor}`}
              style={{ width: `${character.arcProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Fields */}
      <dl className="space-y-2 text-sm">
        {[
          { label: 'アーク種別', key: 'arc' as const, type: 'select', options: ARC_TYPES },
          { label: '欠乏（lack）', key: 'lack' as const, type: 'text' },
          { label: '欲求（want）', key: 'want' as const, type: 'text' },
          { label: '弱点', key: 'weakness' as const, type: 'text' },
          { label: '口癖・特徴', key: 'trait' as const, type: 'text' },
          { label: 'アーク起点', key: 'arcStart' as const, type: 'text' },
          { label: 'アーク終点', key: 'arcEnd' as const, type: 'text' },
        ].map(({ label, key, type, options }) => (
          <div key={key} className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
            <dd className="flex-1 text-gray-800">
              {editing ? (
                type === 'select' && options ? (
                  <select
                    value={draft[key] ?? ''}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value || null }))}
                    className="w-full rounded border px-2 py-0.5 text-sm"
                  >
                    <option value="">—</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={draft[key] ?? ''}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value || null }))}
                    className="w-full rounded border px-2 py-0.5 text-sm"
                    placeholder="—"
                  />
                )
              ) : (
                <span>{character[key] ?? <span className="text-gray-300">—</span>}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* 口調・方言 専用セクション */}
      <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-indigo-700">口調・方言・口癖</span>
          <span className="text-xs text-indigo-400">AI執筆時に反映されます</span>
        </div>
        {editing ? (
          <textarea
            value={draft.speechStyle ?? ''}
            onChange={e => setDraft(d => ({ ...d, speechStyle: e.target.value || null }))}
            rows={3}
            placeholder={'例：関西弁。「〜やで」「〜ちゃう」を多用。\n語尾に「〜だぜ」をつける。乱暴な口調。\n丁寧語のみ。常に敬語を崩さない。'}
            className="w-full rounded border border-indigo-200 bg-white px-2 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed"
          />
        ) : (
          <p className="whitespace-pre-wrap text-xs text-gray-700 leading-relaxed">
            {character.speechStyle ?? <span className="text-gray-300">未設定</span>}
          </p>
        )}
      </div>

      {editing && (
        <button
          onClick={() => { setDraft({ ...character }); setEditing(false); }}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600"
        >
          キャンセル
        </button>
      )}
    </div>
  );
}
