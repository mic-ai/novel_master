'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlotChapter {
  number: number;
  title: string;
  summary: string;
  emotion_score: number;
  scene_type: string;
  tempo_role: string;
}

interface PlotOutline {
  total_chapters: number;
  chapters: PlotChapter[];
}

interface Project {
  id: string;
  title: string;
  genre: string;
  media: string;
  targetWords: number;
  plotOutline: PlotOutline | null;
  tempoPlan: Array<{ chapter: number; role: string; sceneTypeHint: string }> | null;
  chapterOutlines: Array<{ chapterNumber: number; title?: string; sceneType?: string; tempoRole?: string }>;
  characters: Array<{ id: string; name: string; role: string }>;
}

const TEMPO_ICONS: Record<string, string> = {
  tension: '⚡',
  release: '💧',
  neutral: '○',
};

export default function StructurePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plotError, setPlotError] = useState('');
  const [structuring, setStructuring] = useState(false);
  const [refining, setRefining]       = useState(false);
  const [showRefine, setShowRefine]   = useState(false);
  const [refineRequest, setRefineRequest] = useState('');
  const [activeTab, setActiveTab] = useState<'plot' | 'structure'>('plot');
  const [variants, setVariants]           = useState<(PlotOutline | null)[] | null>(null);
  const [variantLabels, setVariantLabels] = useState<string[]>([]);
  const [variantTab, setVariantTab]       = useState(0);
  const [variantLoading, setVariantLoading] = useState(false);
  const [adoptingVariant, setAdoptingVariant] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d: { project: Project }) => {
        setProject(d.project);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleGeneratePlot = async () => {
    if (!project) return;
    setGenerating(true);
    setPlotError('');
    try {
      const res = await fetch('/api/agent/plot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json() as { plotOutline?: PlotOutline; error?: string };
      if (!res.ok || data.error) {
        setPlotError(data.error ?? 'プロット生成に失敗しました');
        return;
      }
      if (data.plotOutline) {
        setProject((prev) => prev ? { ...prev, plotOutline: data.plotOutline ?? null } : prev);
        setActiveTab('plot');
      }
    } catch {
      setPlotError('通信エラーが発生しました。しばらくしてから再試行してください。');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!project || !refineRequest.trim()) return;
    setRefining(true);
    try {
      const res = await fetch('/api/agent/refine', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id, editRequest: refineRequest }),
      });
      const data = await res.json() as { plotOutline?: PlotOutline };
      if (data.plotOutline) {
        setProject(prev => prev ? { ...prev, plotOutline: data.plotOutline ?? null } : prev);
        setRefineRequest('');
        setShowRefine(false);
      }
    } finally {
      setRefining(false);
    }
  };

  const handleGenerateVariants = async () => {
    if (!project) return;
    setVariantLoading(true);
    setVariants(null);
    try {
      const res = await fetch('/api/agent/plot/variants', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json() as { variants?: (PlotOutline | null)[]; labels?: string[] };
      if (data.variants) {
        setVariants(data.variants);
        setVariantLabels(data.labels ?? ['王道', 'ダーク', 'ライト']);
        setVariantTab(0);
      }
    } finally {
      setVariantLoading(false);
    }
  };

  const handleAdoptVariant = async (variant: PlotOutline) => {
    if (!project) return;
    setAdoptingVariant(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plotOutline: variant }),
      });
      setProject((prev) => prev ? { ...prev, plotOutline: variant } : prev);
      setVariants(null);
      setActiveTab('plot');
    } finally {
      setAdoptingVariant(false);
    }
  };

  const handleGenerateStructure = async () => {
    if (!project) return;
    setStructuring(true);
    try {
      const res = await fetch('/api/agent/structure', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json() as {
        chapterOutlines?: Array<{ chapterNumber: number; title?: string; sceneType?: string; tempoRole?: string }>;
      };
      if (data.chapterOutlines) {
        setProject((prev) => prev ? { ...prev, chapterOutlines: data.chapterOutlines ?? [] } : prev);
        setActiveTab('structure');
      }
    } finally {
      setStructuring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">プロジェクトが見つかりません</div>
      </div>
    );
  }

  const plotOutline = project.plotOutline;
  const chapterOutlines = project.chapterOutlines ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← プロジェクト一覧
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-900">{project.title}</h1>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link href={`/editor/${project.id}/characters`} className="rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
              キャラクター
            </Link>
            <Link href={`/editor/${project.id}/foreshadowing`} className="rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
              伏線
            </Link>
            <Link href={`/editor/${project.id}/copyright`} className="rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
              著作権
            </Link>
            {chapterOutlines.length > 0 && (
              <button
                onClick={() => router.push(`/editor/${project.id}/write/1`)}
                className="ml-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-white font-medium hover:bg-indigo-700 transition"
              >
                執筆を開始 →
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* プロジェクト情報 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex gap-6">
          <div>
            <div className="text-xs text-gray-400 mb-1">ジャンル</div>
            <div className="font-medium text-gray-800">{project.genre}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">媒体</div>
            <div className="font-medium text-gray-800">{project.media === 'book' ? '書籍' : 'ウェブ小説'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">目標文字数</div>
            <div className="font-medium text-gray-800">{project.targetWords.toLocaleString()}字</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">キャラクター数</div>
            <div className="font-medium text-gray-800">{project.characters.length}人</div>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2">
          {(['plot', 'structure'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {tab === 'plot' ? 'STEP 5〜6：プロット' : 'STEP 7：章構成'}
            </button>
          ))}
        </div>

        {/* プロットタブ */}
        {activeTab === 'plot' && (
          <div className="space-y-5">
            {!plotOutline ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">プロットを生成します</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  STEP 1〜4で設定した情報をもとに、AIがプロット概要を生成します
                </p>
                <button
                  onClick={handleGeneratePlot}
                  disabled={generating}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  {generating ? 'プロット生成中...' : 'AIでプロットを生成'}
                </button>
                {plotError && (
                  <p className="text-sm text-red-500 mt-3">{plotError}</p>
                )}
              </div>
            ) : (
              <>
                {/* 感情曲線 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">感情曲線</h3>
                  <div className="flex items-end gap-1 h-20">
                    {plotOutline.chapters.map((ch) => (
                      <div
                        key={ch.number}
                        className="flex-1 bg-indigo-400 rounded-t transition-all hover:bg-indigo-600"
                        style={{ height: `${(ch.emotion_score / 10) * 100}%` }}
                        title={`第${ch.number}章: ${ch.title}（感情スコア: ${ch.emotion_score}）`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>第1章</span>
                    <span>第{plotOutline.total_chapters}章</span>
                  </div>
                </div>

                {/* 章リスト */}
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {plotOutline.chapters.map((ch) => (
                    <div key={ch.number} className="p-4 flex gap-4 items-start hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {ch.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{ch.title}</span>
                          <span className="text-xs text-gray-400">{TEMPO_ICONS[ch.tempo_role] ?? '○'}</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{ch.summary}</p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        感情: {ch.emotion_score}/10
                      </div>
                    </div>
                  ))}
                </div>

                {/* STEP 6: プロット修正 */}
                {showRefine ? (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                    <p className="text-sm font-medium text-indigo-800">プロット修正の指示を入力してください</p>
                    <textarea
                      value={refineRequest}
                      onChange={e => setRefineRequest(e.target.value)}
                      rows={3}
                      placeholder="例: 第3章をもっと感情的な展開にしてほしい / クライマックスを第8章ではなく第10章にしたい"
                      className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefine}
                        disabled={refining || !refineRequest.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
                      >
                        {refining ? 'AI修正中...' : 'AIで修正する'}
                      </button>
                      <button
                        onClick={() => { setShowRefine(false); setRefineRequest(''); }}
                        className="text-sm text-gray-400 hover:text-gray-600"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleGeneratePlot}
                    disabled={generating}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-indigo-300 transition"
                  >
                    再生成
                  </button>
                  <button
                    onClick={() => setShowRefine(v => !v)}
                    className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50 transition"
                  >
                    ✏️ プロットを修正
                  </button>
                  <button
                    onClick={handleGenerateVariants}
                    disabled={variantLoading}
                    className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition disabled:opacity-50"
                  >
                    {variantLoading ? '生成中...' : '🎲 3パターン比較'}
                  </button>
                  <button
                    onClick={handleGenerateStructure}
                    disabled={structuring}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition ml-auto"
                  >
                    {structuring ? '章構成生成中...' : '章構成を生成 →'}
                  </button>
                </div>

                {/* 3パターン比較パネル */}
                {variants && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-purple-800 text-sm">3パターン比較</h3>
                      <button
                        onClick={() => setVariants(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        閉じる
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {variantLabels.map((label, i) => (
                        <button
                          key={i}
                          onClick={() => setVariantTab(i)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            variantTab === i
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const v = variants[variantTab];
                      if (!v) return <p className="text-sm text-gray-500">このバリアントの生成に失敗しました</p>;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-end gap-0.5 h-12 bg-white rounded-lg p-2">
                            {v.chapters.map((ch) => (
                              <div
                                key={ch.number}
                                className="flex-1 bg-purple-400 rounded-t"
                                style={{ height: `${(ch.emotion_score / 10) * 100}%` }}
                                title={`第${ch.number}章: ${ch.title}`}
                              />
                            ))}
                          </div>
                          <div className="bg-white rounded-lg border border-purple-100 divide-y divide-purple-50 max-h-64 overflow-y-auto">
                            {v.chapters.map((ch) => (
                              <div key={ch.number} className="px-3 py-2 flex gap-3 text-xs">
                                <span className="text-purple-400 font-bold w-4 flex-shrink-0">{ch.number}</span>
                                <div>
                                  <span className="font-medium text-gray-800">{ch.title}</span>
                                  <p className="text-gray-500 mt-0.5 leading-relaxed">{ch.summary}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAdoptVariant(v)}
                            disabled={adoptingVariant}
                            className="w-full py-2 bg-purple-600 text-white font-medium rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            {adoptingVariant ? '採用中...' : `「${variantLabels[variantTab]}」案を採用する`}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 章構成タブ */}
        {activeTab === 'structure' && (
          <div className="space-y-5">
            {chapterOutlines.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">章構成を生成します</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  プロット概要から各章の詳細構成を生成します
                </p>
                <button
                  onClick={handleGenerateStructure}
                  disabled={structuring || !plotOutline}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  {structuring ? '生成中...' : '章構成を生成'}
                </button>
                {!plotOutline && (
                  <p className="text-sm text-red-500 mt-3">先にプロットを生成してください</p>
                )}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {chapterOutlines.map((outline) => (
                    <div
                      key={outline.chapterNumber}
                      className="p-4 flex gap-4 items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/editor/${project.id}/write/${outline.chapterNumber}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {outline.chapterNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {outline.title ?? `第${outline.chapterNumber}章`}
                          </span>
                          <span className="text-xs text-gray-400">
                            {TEMPO_ICONS[outline.tempoRole ?? ''] ?? '○'}
                          </span>
                          {outline.sceneType && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {outline.sceneType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-indigo-400 text-sm flex-shrink-0">執筆 →</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push(`/editor/${project.id}/write/1`)}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  執筆を開始する →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
