import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CopyrightDashboard } from '@/components/copyright/CopyrightDashboard';

type Props = { params: { id: string } };

export default async function CopyrightPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const project = await prisma.project.findFirst({
    where:  { id: params.id, userId: session.user.id },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  const records = await prisma.copyrightRecord.findMany({
    where:   { projectId: params.id },
    orderBy: { timestamp: 'desc' },
    select: {
      id:            true,
      chapterNumber: true,
      contentHash:   true,
      timestamp:     true,
      isPublished:   true,
    },
  });

  const serialized = records.map(r => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <CopyrightDashboard
        projectId={project.id}
        projectTitle={project.title}
        initialRecords={serialized}
      />
    </div>
  );
}
