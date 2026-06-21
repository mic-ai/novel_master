'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface WritingEditorProps {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  disabled?:   boolean;
  projectId?:  string;
}

type MenuPos   = { x: number; y: number };
type EditState = 'idle' | 'loading' | 'done';

export default function WritingEditor({
  value,
  onChange,
  placeholder = '本文を入力するか、右パネルの「AIで生成」をクリックしてください...',
  disabled    = false,
  projectId,
}: WritingEditorProps) {
  const ref          = useRef<HTMLTextAreaElement>(null);
  const [menuPos, setMenuPos]       = useState<MenuPos | null>(null);
  const [selRange, setSelRange]     = useState<[number, number] | null>(null);
  const [editState, setEditState]   = useState<EditState>('idle');
  const [editError, setEditError]   = useState('');

  // 自動高さ調整
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-inline-menu]')) {
        setMenuPos(null);
        setSelRange(null);
        setEditState('idle');
        setEditError('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuPos]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const el = ref.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    if (start === end) { setMenuPos(null); setSelRange(null); return; }
    setSelRange([start, end]);
    setMenuPos({ x: e.clientX, y: e.clientY - 52 });
    setEditState('idle');
    setEditError('');
  }, [disabled]);

  const handleKeyUp = useCallback(() => {
    const el = ref.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    if (start === end) { setMenuPos(null); setSelRange(null); }
  }, [disabled]);

  async function applyInlineEdit(instruction: 'rewrite' | 'expand') {
    if (!selRange || !projectId) return;
    const [start, end] = selRange;
    const selectedText  = value.slice(start, end);
    const context       = value.slice(Math.max(0, start - 100), Math.min(value.length, end + 100));

    setEditState('loading');
    setEditError('');
    try {
      const res = await fetch('/api/agent/inline-edit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId, selectedText, instruction, context }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? '失敗しました');
      }
      const { result } = await res.json() as { result: string };
      onChange(value.slice(0, start) + result + value.slice(end));
      setMenuPos(null);
      setSelRange(null);
      setEditState('idle');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'エラーが発生しました');
      setEditState('idle');
    }
  }

  function applyDelete() {
    if (!selRange) return;
    const [start, end] = selRange;
    onChange(value.slice(0, start) + value.slice(end));
    setMenuPos(null);
    setSelRange(null);
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full min-h-[calc(100vh-220px)] resize-none border-none outline-none bg-transparent
          text-gray-800 leading-relaxed text-[15px]
          placeholder:text-gray-300
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif" }}
      />

      {/* フローティング インライン修正メニュー */}
      {menuPos && (
        <div
          data-inline-menu
          className="fixed z-50 flex flex-col gap-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          {editState === 'loading' ? (
            <span className="px-3 py-1.5 text-xs text-gray-500">AI処理中…</span>
          ) : (
            <>
              <button
                onClick={() => applyInlineEdit('rewrite')}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                ✏️ 書き直す
              </button>
              <button
                onClick={() => applyInlineEdit('expand')}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                🔍 膨らませる
              </button>
              <button
                onClick={applyDelete}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
              >
                🗑️ 削除
              </button>
            </>
          )}
          {editError && (
            <p className="px-3 pb-1 text-xs text-red-500">{editError}</p>
          )}
        </div>
      )}
    </div>
  );
}
