import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { fsId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json() as {
    projectId:      string;
    isPlanted?:     boolean;
    isResolved?:    boolean;
    isFake?:        boolean;
    plantedChapter?: number | null;
    resolveChapter?: number | null;
    description?:   string;
  };
  const { projectId, ...data } = body;

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return Response.json({ error: '権限がありません' }, { status: 403 });

  const foreshadowing = await prisma.foreshadowing.update({
    where: { id: params.fsId },
    data,
  });
  return Response.json({ foreshadowing });
}

export async function DELETE(
  req: Request,
  { params }: { params: { fsId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: '認証が必要です' }, { status: 401 });

  const url       = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) return Response.json({ error: 'projectId が必要です' }, { status: 400 });

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return Response.json({ error: '権限がありません' }, { status: 403 });

  await prisma.foreshadowing.delete({ where: { id: params.fsId } });
  return Response.json({ ok: true });
}
