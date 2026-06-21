import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { ExportPageClient } from '@/components/editor/ExportPageClient';

type Props = { params: { id: string } };

export default async function ExportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const project = await prisma.project.findFirst({
    where:  { id: params.id, userId: session.user.id },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  return <ExportPageClient projectId={project.id} projectTitle={project.title} />;
}
