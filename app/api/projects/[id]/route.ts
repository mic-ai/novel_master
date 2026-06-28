import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where:   { id: params.id, userId: session.user.id },
    include: {
      characters:      true,
      chapters:        { orderBy: { number: 'asc' } },
      chapterOutlines: { orderBy: { chapterNumber: 'asc' } },
      foreshadowing:   true,
    },
  });

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  return Response.json({ project });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;

  // 所有確認を兼ねて更新
  const project = await prisma.project.updateMany({
    where: { id: params.id, userId: session.user.id },
    data:  body,
  });

  if (project.count === 0) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  return Response.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const deleted = await prisma.project.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  return Response.json({ success: true });
}
