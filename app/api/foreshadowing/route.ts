import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
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

  const foreshadowing = await prisma.foreshadowing.findMany({
    where:   { projectId },
    orderBy: { plantedChapter: 'asc' },
  });
  return Response.json({ foreshadowing });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json() as {
    projectId:      string;
    description:    string;
    plantedChapter?: number | null;
    resolveChapter?: number | null;
    isFake?:        boolean;
  };
  const { projectId, description, plantedChapter, resolveChapter, isFake } = body;

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return Response.json({ error: '権限がありません' }, { status: 403 });

  const foreshadowing = await prisma.foreshadowing.create({
    data: {
      projectId,
      description,
      plantedChapter: plantedChapter ?? null,
      resolveChapter: resolveChapter ?? null,
      isFake:         isFake ?? false,
    },
  });
  return Response.json({ foreshadowing }, { status: 201 });
}
