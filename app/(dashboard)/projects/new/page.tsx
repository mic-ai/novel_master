'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GenreSelector from '@/components/wizard/GenreSelector';
import CharacterBuilder from '@/components/wizard/CharacterBuilder';
import WorldBuilder from '@/components/wizard/WorldBuilder';
import ConflictDesigner from '@/components/wizard/ConflictDesigner';

type Step = 1 | 2 | 3 | 4;

interface ProjectState {
  id: string;
  genre: string;
  media: string;
  title: string;
}

const STORAGE_KEY = 'novel_wizard_state';

function loadState(): { step: Step; project: ProjectState | null } {
  if (typeof window === 'undefined') return { step: 1, project: null };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { step: Step; project: ProjectState | null };
  } catch { /* ignore */ }
  return { step: 1, project: null };
}

const STEP_LABELS: Record<Step, string> = {
  1: 'ジャンル',
  2: 'キャラクター',
  3: '世界設定',
  4: '目標・障害',
};

export default function NewProjectPage() {
  const router = useRouter();
  const saved = loadState();
  const [step, setStep] = useState<Step>(saved.step);
  const [project, setProject] = useState<ProjectState | null>(saved.project);
  const [titleInput, setTitleInput] = useState(saved.project?.title ?? '');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, project }));
  }, [step, project]);

  const handleGenreConfirm = async (data: { genre: string; subgenre?: string; media: string }) => {
    setShowTitleInput(true);
    setProject((prev) => prev ? { ...prev, ...data } : { id: '', ...data, title: '' });
  };

  const handleCreateProject = async () => {
    if (!project || !titleInput.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:  titleInput,
          genre:  project.genre,
          media:  project.media,
        }),
      });
      const data = await res.json() as { project?: { id: string } };
      if (data.project) {
        setProject({ ...project, id: data.project.id, title: titleInput });
        setStep(2);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStep2Complete = () => setStep(3);
  const handleStep3Complete = () => setStep(4);

  const handleStep4Complete = async (data: { goal: string; obstacles: string[] }) => {
    if (!project?.id) return;
    void data;
    sessionStorage.removeItem(STORAGE_KEY);
    router.push(`/editor/${project.id}/structure`);
  };

  const progressPercent = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">
              ← ダッシュボード
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">新規プロジェクト</span>
          </div>

          {/* ステッパー */}
          <div className="flex items-center gap-2 mb-3">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s < step
                      ? 'bg-indigo-600 text-white'
                      : s === step
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                <span className={`text-xs hidden sm:block ${s === step ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                  {STEP_LABELS[s]}
                </span>
                {s < 4 && <div className="w-6 h-px bg-gray-200 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {step === 1 && (
          <div className="space-y-6">
            <GenreSelector onConfirm={handleGenreConfirm} />

            {showTitleInput && project && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">作品タイトル</h3>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="例: 桜色の約束"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !titleInput.trim()}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition text-sm"
                >
                  {creating ? 'プロジェクト作成中...' : 'プロジェクトを作成してSTEP 2へ →'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && project?.id && (
          <CharacterBuilder
            projectId={project.id}
            genre={project.genre}
            onComplete={handleStep2Complete}
          />
        )}

        {step === 3 && project?.id && (
          <WorldBuilder
            projectId={project.id}
            genre={project.genre}
            onComplete={handleStep3Complete}
          />
        )}

        {step === 4 && project?.id && (
          <ConflictDesigner
            projectId={project.id}
            genre={project.genre}
            onComplete={handleStep4Complete}
          />
        )}
      </div>
    </div>
  );
}
