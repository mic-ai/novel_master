import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    povCharacterId?: string | null;
    scenes?:         unknown;
  };

  const outline = await prisma.chapterOutline.findFirst({
    where: { id: params.id, project: { userId: session.user.id } },
  });

  if (!outline) {
    return Response.json({ error: '章構成が見つかりません' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if ('povCharacterId' in body) data['povCharacterId'] = body.povCharacterId;
  if ('scenes' in body)         data['scenes']         = body.scenes;

  const updated = await prisma.chapterOutline.update({
    where: { id: params.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:  data as any,
  });

  return Response.json({ outline: updated });
}
