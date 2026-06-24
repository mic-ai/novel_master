import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CharactersClient } from '@/components/editor/CharactersClient';

type Props = { params: { id: string } };

export default async function CharactersPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const project = await prisma.project.findFirst({
    where:   { id: params.id, userId: session.user.id },
    select:  { id: true, title: true, genre: true },
  });
  if (!project) notFound();

  const characters = await prisma.character.findMany({
    where:   { projectId: params.id },
    orderBy: { role: 'asc' },
    select: {
      id:              true,
      name:            true,
      role:            true,
      age:             true,
      lack:            true,
      want:            true,
      weakness:        true,
      arc:             true,
      arcStart:        true,
      arcEnd:          true,
      trait:           true,
      speechStyle:     true,
      relationshipRole: true,
      arcProgress:     true,
    },
  });

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
          <h1 className="text-2xl font-bold text-gray-900">キャラクター管理</h1>
        </div>
        <div className="text-sm text-gray-500">{characters.length} 人</div>
      </div>

      <CharactersClient projectId={params.id} initialCharacters={characters} />
    </div>
  );
}
