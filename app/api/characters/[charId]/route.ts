import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { charId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:       string;
    name?:           string;
    arc?:            string | null;
    arcStart?:       string | null;
    arcEnd?:         string | null;
    arcProgress?:    number;
    lack?:           string | null;
    want?:           string | null;
    weakness?:       string | null;
    trait?:          string | null;
    speechStyle?:    string | null;
    relationshipRole?: string | null;
    age?:            number | null;
  };
  const { projectId, ...data } = body;

  // 所有確認
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return Response.json({ error: '権限がありません' }, { status: 403 });
  }

  const character = await prisma.character.update({
    where: { id: params.charId },
    data,
  });

  return Response.json({ character });
}
