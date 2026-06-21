import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { ForeshadowingBoard } from '@/components/editor/ForeshadowingBoard';

type Props = { params: { id: string } };

export default async function ForeshadowingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const project = await prisma.project.findFirst({
    where:  { id: params.id, userId: session.user.id },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  const [foreshadowing, chapterCount] = await Promise.all([
    prisma.foreshadowing.findMany({
      where:   { projectId: params.id },
      orderBy: { plantedChapter: 'asc' },
    }),
    prisma.chapter.count({ where: { projectId: params.id } }),
  ]);

  const serialized = foreshadowing.map(f => ({
    id:             f.id,
    description:    f.description,
    plantedChapter: f.plantedChapter,
    resolveChapter: f.resolveChapter,
    isPlanted:      f.isPlanted,
    isResolved:     f.isResolved,
    isFake:         f.isFake,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href={`/editor/${params.id}/structure`} className="hover:underline">
              {project.title}
            </Link>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">伏線ボード</h1>
        </div>
        <div className="text-sm text-gray-500">{serialized.length} 件</div>
      </div>

      <ForeshadowingBoard
        projectId={params.id}
        initialItems={serialized}
        totalChapters={chapterCount || 30}
      />
    </div>
  );
}
