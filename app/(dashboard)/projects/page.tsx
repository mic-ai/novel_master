import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ProjectDeleteButton from '@/components/projects/ProjectDeleteButton';

export const dynamic = 'force-dynamic';

const GENRE_ICONS: Record<string, string> = {
  romance: '💕', mystery: '🔍', fantasy: '⚔️', sf: '🚀', horror: '👻',
};

const STATUS_LABELS: Record<string, string> = {
  step_1:    'ジャンル設定中',
  step_3:    '世界設定完了',
  step_5:    'プロット生成済',
  step_7:    '章構成完了',
  writing:   '執筆中',
  completed: '完成',
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await prisma.project.findMany({
    where:   { userId: session.user.id },
    include: { _count: { select: { chapters: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">マイプロジェクト</h1>
          <p className="text-gray-500 mt-1">{projects.length}件の作品</p>
        </div>
        <Link
          href="/projects/new"
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm"
        >
          + 新規作成
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">まだ作品がありません</h2>
          <p className="text-gray-500 mb-6">最初の小説を書き始めましょう</p>
          <Link
            href="/projects/new"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            作品を作成する
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <div key={p.id} className="relative group">
              <Link
                href={`/editor/${p.id}/structure`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-5 block"
              >
                <div className="text-4xl">{GENRE_ICONS[p.genre] ?? '📖'}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 text-lg truncate">{p.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{STATUS_LABELS[p.status] ?? p.status}</span>
                    <span>·</span>
                    <span>{p._count.chapters}章</span>
                    <span>·</span>
                    <span>{p.media === 'book' ? '書籍' : 'ウェブ小説'}</span>
                  </div>
                </div>
                <div className="text-gray-400 text-sm flex-shrink-0">
                  {new Date(p.updatedAt).toLocaleDateString('ja-JP')}
                </div>
              </Link>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ProjectDeleteButton projectId={p.id} projectTitle={p.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
