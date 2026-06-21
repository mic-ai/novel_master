import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { checkProjectLimit, projectLimitResponse } from '@/lib/plan-limits';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where:   { userId: session.user.id },
    include: { characters: true, _count: { select: { chapters: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return Response.json({ projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const projectCheck = await checkProjectLimit(session.user.id, session.user.plan ?? 'FREE');
  if (!projectCheck.allowed) return projectLimitResponse(projectCheck);

  const body = await req.json() as {
    title:        string;
    genre:        string;
    subgenre?:    string;
    media:        string;
    targetWords?: number;
  };

  const genreRulesSnapshot = GENRE_RULES[body.genre] ?? null;

  const project = await prisma.project.create({
    data: {
      userId:             session.user.id,
      title:              body.title,
      genre:              body.genre,
      subgenre:           body.subgenre ?? null,
      media:              body.media,
      targetWords:        body.targetWords ?? 100000,
      status:             'step_1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      genreRulesSnapshot: (genreRulesSnapshot ?? null) as any,
    },
  });

  return Response.json({ project }, { status: 201 });
}
