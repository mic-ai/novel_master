'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WritingEditor from '@/components/editor/WritingEditor';
import WordCountBar from '@/components/editor/WordCountBar';
import TempoIndicator from '@/components/editor/TempoIndicator';
import AiAssistantPanel from '@/components/editor/AiAssistantPanel';
import PartProgressBar from '@/components/editor/PartProgressBar';
import { getTempoWarnings } from '@/lib/agent/utils/tempo-warnings';

interface ChapterOutline {
  id:               string;
  chapterNumber:    number;
  title?:           string;
  targetWords?:     number;
  targetMin?:       number;
  targetMax?:       number;
  sceneType?:       string;
  tempoRole?:       string;
  chapterEndingRule?: string;
  foreshadowingIds: string[];
}

interface ForeshadowingItem {
  id:             string;
  description:    string;
  isFake:         boolean;
  isPlanted:      boolean;
}

interface ReviewResult {
  total_score:      number;
  items:            Array<{ rule: string; score: number; max: number; passed: boolean; feedback: string }>;
  overall_feedback: string;
  chapter_ending_check?: { passed: boolean; current_ending: string; suggestion: string };
  foreshadowing_check?:  { planted: string[]; missing: string[] };
}

interface ProjectData {
  id:             string;
  title:          string;
  genre:          string;
  media:          string;
  chapterOutlines: ChapterOutline[];
  foreshadowing:  ForeshadowingItem[];
}

export default function WritePage({
  params,
}: {
  params: Promise<{ id: string; ch: string }>;
}) {
  const { id, ch } = use(params);
  const chapterNumber = parseInt(ch, 10);
  const router = useRouter();

  const [project, setProject]       = useState<ProjectData | null>(null);
  const [content, setContent]       = useState('');
  const [isSaving, setIsSaving]     = useState(false);
  const [savedAt, setSavedAt]       = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing]   = useState(false);
  const [review, setReview]         = useState<ReviewResult | null>(null);
  const [loading, setLoading]       = useState(true);
  const autoSaveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showContinuation, setShowContinuation] = useState(false);
  const [continuationText, setContinuationText] = useState('');
  const [isContinuing, setIsContinuing]         = useState(false);

  const outline = project?.chapterOutlines.find((o) => o.chapterNumber === chapterNumber) ?? null;
  const foreshadowingItems = (project?.foreshadowing ?? []).filter((f) =>
    (outline?.foreshadowingIds ?? []).includes(f.id),
  );
  const tempoWarnings = project
    ? getTempoWarnings({
        genre:                project.genre,
        media:                project.media,
        currentChapterNumber: chapterNumber,
        chapterOutlines:      project.chapterOutlines,
      })
    : [];

  // 初期データ取得
  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/chapters?projectId=${id}&number=${chapterNumber}`).then((r) => r.json()),
    ]).then(([projectRes, chapterRes]: [{ project: ProjectData }, { chapter?: { content?: string } }]) => {
      setProject(projectRes.project);
      setContent(chapterRes.chapter?.content ?? '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, chapterNumber]);

  // 自動保存（1.5秒のデバウンス）＋ idle タイマー（30秒）
  const handleContentChange = useCallback((v: string) => {
    setContent(v);
    setShowContinuation(false);
    setContinuationText('');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { save(v); }, 1500);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (v.trim().length > 50) {
      idleTimer.current = setTimeout(() => { setShowContinuation(true); }, 30_000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (text: string) => {
    if (!project) return;
    setIsSaving(true);
    try {
      await fetch('/api/chapters', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          projectId: project.id,
          number:    chapterNumber,
          content:   text,
          title:     outline?.title,
        }),
      });
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [project, chapterNumber, outline]);

  // AIで生成（ストリーミング）
  const handleGenerate = useCallback(async () => {
    if (!project) return;
    setIsGenerating(true);
    setContent('');
    setReview(null);
    try {
      const res = await fetch('/api/agent/write', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id, chapterNumber, sceneIndex: 0 }),
      });
      if (!res.ok || !res.body) { setIsGenerating(false); return; }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      // 生成完了後に保存
      await save(accumulated);
    } finally {
      setIsGenerating(false);
    }
  }, [project, chapterNumber, save]);

  // 添削
  const handleContinue = useCallback(async () => {
    if (!project || !content.trim()) return;
    setIsContinuing(true);
    setContinuationText('');
    try {
      const res = await fetch('/api/agent/continue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id, chapterNumber, currentContent: content }),
      });
      if (!res.ok || !res.body) { setIsContinuing(false); return; }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setContinuationText(acc);
      }
    } finally {
      setIsContinuing(false);
    }
  }, [project, chapterNumber, content]);

  function acceptContinuation() {
    onChange(content + continuationText);
    setShowContinuation(false);
    setContinuationText('');
  }

  function onChange(v: string) { handleContentChange(v); }

  const handleReview = useCallback(async () => {
    if (!project || !content.trim()) return;
    setIsReviewing(true);
    try {
      const res = await fetch('/api/agent/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id, chapterNumber, chapterContent: content }),
      });
      const data = await res.json() as { review?: ReviewResult };
      if (data.review) setReview(data.review);
    } finally {
      setIsReviewing(false);
    }
  }, [project, chapterNumber, content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">プロジェクトが見つかりません</div>
      </div>
    );
  }

  const targetMin = outline?.targetMin ?? 2000;
  const targetMax = outline?.targetMax ?? 5000;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* トップバー */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/editor/${project.id}/structure`)}
            className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
          >
            ← 構成
          </button>
          <span className="text-gray-200 flex-shrink-0">/</span>
          <span className="font-semibold text-gray-800 text-sm truncate">{project.title}</span>
          <span className="text-gray-300 flex-shrink-0">/</span>
          <span className="text-gray-500 text-sm flex-shrink-0">
            第{chapterNumber}章 {outline?.title ? `— ${outline.title}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isSaving && <span className="text-xs text-gray-400">保存中...</span>}
          {!isSaving && savedAt && (
            <span className="text-xs text-gray-400">
              {savedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 保存済み
            </span>
          )}
          <button
            onClick={() => save(content)}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
          >
            保存
          </button>
          <Link
            href={`/editor/${project.id}/characters`}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
          >
            キャラクター
          </Link>
          <Link
            href={`/editor/${project.id}/foreshadowing`}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
          >
            伏線
          </Link>
          <Link
            href={`/editor/${project.id}/copyright`}
            className="px-3 py-1.5 text-xs border border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
          >
            著作権
          </Link>
          <Link
            href={`/editor/${project.id}/export`}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition"
          >
            出力
          </Link>
        </div>
      </div>

      {/* 3ペインレイアウト */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左ペイン：章ナビゲーション */}
        <div className="w-52 border-r border-gray-100 overflow-y-auto flex-shrink-0 bg-gray-50">
          <div className="p-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 px-1">章一覧</div>
            {project.chapterOutlines.map((o) => (
              <button
                key={o.chapterNumber}
                onClick={() => router.push(`/editor/${project.id}/write/${o.chapterNumber}`)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs mb-0.5 transition ${
                  o.chapterNumber === chapterNumber
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 flex-shrink-0 w-5 text-right">{o.chapterNumber}</span>
                  <span className="truncate">{o.title ?? `第${o.chapterNumber}章`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 中央ペイン：執筆エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 bg-white border-b border-gray-100 flex-shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <TempoIndicator
                tempoRole={outline?.tempoRole}
                sceneType={outline?.sceneType}
                chapterNumber={chapterNumber}
              />
            </div>
            <PartProgressBar
              genre={project.genre}
              media={project.media}
              totalChapters={project.chapterOutlines.length}
              currentChapter={chapterNumber}
            />
            {tempoWarnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                  w.level === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span>{w.level === 'error' ? '⚠️' : '💡'}</span>
                <span>{w.message}</span>
              </div>
            ))}
          </div>
          <WordCountBar
            current={content.length}
            targetMin={targetMin}
            targetMax={targetMax}
          />
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <WritingEditor
              value={content}
              onChange={handleContentChange}
              disabled={isGenerating}
              projectId={project.id}
            />

            {/* ContinuationAgent サジェストバナー */}
            {showContinuation && !isGenerating && (
              <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                {!continuationText && !isContinuing && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-indigo-700">
                      続きを提案しましょうか？
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleContinue}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        提案を見る
                      </button>
                      <button
                        onClick={() => setShowContinuation(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}
                {isContinuing && (
                  <p className="text-xs text-indigo-500">AI が続きを考えています…</p>
                )}
                {continuationText && !isContinuing && (
                  <div className="space-y-3">
                    <p
                      className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed border-l-2 border-indigo-300 pl-3"
                      style={{ fontFamily: "'Hiragino Mincho ProN','Yu Mincho',Georgia,serif" }}
                    >
                      {continuationText}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={acceptContinuation}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        採用する
                      </button>
                      <button
                        onClick={handleContinue}
                        className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
                      >
                        別の案
                      </button>
                      <button
                        onClick={() => { setShowContinuation(false); setContinuationText(''); }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右ペイン：AIアシスタント */}
        <div className="w-72 border-l border-gray-100 overflow-y-auto flex-shrink-0 bg-white">
          <div className="p-4">
            <AiAssistantPanel
              projectId={project.id}
              chapterNumber={chapterNumber}
              outline={outline}
              foreshadowingItems={foreshadowingItems}
              content={content}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              review={review}
              isReviewing={isReviewing}
              onReview={handleReview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
