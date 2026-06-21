'use client';

import { useState } from 'react';

type Foreshadowing = {
  id:             string;
  description:    string;
  plantedChapter: number | null;
  resolveChapter: number | null;
  isPlanted:      boolean;
  isResolved:     boolean;
  isFake:         boolean;
};

type Column = 'unplanted' | 'planted' | 'resolved';

type Props = {
  projectId:     string;
  initialItems:  Foreshadowing[];
  totalChapters: number;
};

function badge(item: Foreshadowing) {
  if (item.isFake)      return { label: 'フェイク', cls: 'bg-purple-100 text-purple-700' };
  if (item.isResolved)  return { label: '回収済', cls: 'bg-green-100 text-green-700' };
  if (item.isPlanted)   return { label: '設置済', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: '未設置', cls: 'bg-gray-100 text-gray-600' };
}

function columnOf(item: Foreshadowing): Column {
  if (item.isResolved) return 'resolved';
  if (item.isPlanted)  return 'planted';
  return 'unplanted';
}

const COLUMNS: { key: Column; label: string; color: string }[] = [
  { key: 'unplanted', label: '未設置',  color: 'bg-gray-50 border-gray-200' },
  { key: 'planted',   label: '設置済み', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'resolved',  label: '回収済み', color: 'bg-green-50 border-green-200' },
];

export function ForeshadowingBoard({ projectId, initialItems, totalChapters }: Props) {
  const [items, setItems]   = useState<Foreshadowing[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newPlanted, setNewPlanted] = useState('');
  const [newResolve, setNewResolve] = useState('');
  const [newFake, setNewFake]       = useState(false);
  const [error, setError]   = useState('');

  async function move(id: string, to: Column) {
    const patch: Partial<Foreshadowing> = {
      isPlanted:  to === 'planted' || to === 'resolved',
      isResolved: to === 'resolved',
    };
    setItems(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
    const res = await fetch(`/api/foreshadowing/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ projectId, ...patch }),
    });
    if (!res.ok) {
      setError('更新に失敗しました');
      setItems(prev => prev.map(f => f.id === id ? { ...f, isPlanted: !patch.isPlanted, isResolved: !patch.isResolved } : f));
    }
  }

  async function addItem() {
    if (!newDesc.trim()) return;
    setError('');
    const res = await fetch('/api/foreshadowing', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        projectId,
        description:    newDesc.trim(),
        plantedChapter: newPlanted ? parseInt(newPlanted) : null,
        resolveChapter: newResolve ? parseInt(newResolve) : null,
        isFake:         newFake,
      }),
    });
    if (!res.ok) { setError('追加に失敗しました'); return; }
    const { foreshadowing } = await res.json() as { foreshadowing: Foreshadowing };
    setItems(prev => [...prev, foreshadowing]);
    setNewDesc(''); setNewPlanted(''); setNewResolve(''); setNewFake(false);
    setAdding(false);
  }

  async function toggleFake(id: string, current: boolean) {
    setItems(prev => prev.map(f => f.id === id ? { ...f, isFake: !current } : f));
    await fetch(`/api/foreshadowing/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ projectId, isFake: !current }),
    });
  }

  const byCol = (col: Column) => items.filter(f => columnOf(f) === col);

  return (
    <div>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Add button */}
      <div className="mb-6">
        {adding ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
            <h3 className="font-medium text-gray-800">伏線を追加</h3>
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="伏線の内容（例: 主人公の左手の傷）"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex gap-3">
              <label className="text-xs text-gray-600">
                設置予定章
                <input
                  type="number"
                  value={newPlanted}
                  onChange={e => setNewPlanted(e.target.value)}
                  min={1} max={totalChapters}
                  className="ml-2 w-16 rounded border px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                回収予定章
                <input
                  type="number"
                  value={newResolve}
                  onChange={e => setNewResolve(e.target.value)}
                  min={1} max={totalChapters}
                  className="ml-2 w-16 rounded border px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFake}
                  onChange={e => setNewFake(e.target.checked)}
                  className="accent-purple-600"
                />
                フェイク伏線
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addItem}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                追加
              </button>
              <button
                onClick={() => setAdding(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg border border-dashed border-indigo-300 px-4 py-2 text-sm text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50"
          >
            + 伏線を追加
          </button>
        )}
      </div>

      {/* Kanban columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className={`rounded-xl border-2 p-4 ${col.color}`}
          >
            <h3 className="mb-3 flex items-center justify-between font-semibold text-gray-700">
              {col.label}
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm">
                {byCol(col.key).length}
              </span>
            </h3>
            <div className="space-y-3">
              {byCol(col.key).map(item => {
                const b = badge(item);
                return (
                  <div key={item.id} className="rounded-lg border bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800 leading-relaxed">{item.description}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>
                        {b.label}
                      </span>
                    </div>
                    {(item.plantedChapter || item.resolveChapter) && (
                      <p className="mb-2 text-xs text-gray-400">
                        {item.plantedChapter && `設置: 第${item.plantedChapter}章`}
                        {item.plantedChapter && item.resolveChapter && ' → '}
                        {item.resolveChapter && `回収: 第${item.resolveChapter}章`}
                      </p>
                    )}
                    {/* Move buttons */}
                    <div className="flex flex-wrap gap-1">
                      {col.key !== 'unplanted' && (
                        <button
                          onClick={() => move(item.id, 'unplanted')}
                          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          ← 未設置に戻す
                        </button>
                      )}
                      {col.key !== 'planted' && (
                        <button
                          onClick={() => move(item.id, 'planted')}
                          className="rounded px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-50"
                        >
                          設置済みへ
                        </button>
                      )}
                      {col.key !== 'resolved' && (
                        <button
                          onClick={() => move(item.id, 'resolved')}
                          className="rounded px-2 py-0.5 text-xs text-green-700 hover:bg-green-50"
                        >
                          回収済みへ →
                        </button>
                      )}
                      <button
                        onClick={() => toggleFake(item.id, item.isFake)}
                        className="rounded px-2 py-0.5 text-xs text-purple-600 hover:bg-purple-50"
                      >
                        {item.isFake ? 'フェイク解除' : 'フェイクに設定'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {byCol(col.key).length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">なし</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
