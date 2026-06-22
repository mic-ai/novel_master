import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { buildPlotGeneratorPrompt } from '@/lib/prompts/templates/plot-generator';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { generateTempoPlan } from '@/lib/agent/utils/tempo-planner';
import { checkMonthlyTokens, tokenLimitResponse } from '@/lib/plan-limits';
import type { WorldSettings, Obstacle } from '@/lib/prompts/genre-rules';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '認証が必要です' }, { status: 401 });
    }

    const tokenCheck = await checkMonthlyTokens(session.user.id, session.user.plan ?? 'FREE');
    if (!tokenCheck.allowed) return tokenLimitResponse(tokenCheck);

    const body = await req.json() as { projectId: string };
    const { projectId } = body;

    const project = await prisma.project.findUnique({
      where:   { id: projectId },
      include: { characters: true },
    });

    if (!project) {
      return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
    }

    const validGenres = Object.keys(GENRE_RULES);
    const genre = validGenres.includes(project.genre) ? project.genre : 'romance';

    const characters = project.characters.map((c) => ({
      name:       c.name,
      role:       c.role,
      lack:       c.lack,
      want:       c.want,
      weakness:   c.weakness,
      arcStart:   c.arcStart,
      arcEnd:     c.arcEnd,
      arcProgress: c.arcProgress,
    }));

    const worldSettings = (project.worldSettings ?? {}) as WorldSettings;

    const p = project as typeof project & { goal?: string | null; plotObstacles?: unknown };
    const goal = p.goal ?? '';
    const obstacles = Array.isArray(p.plotObstacles)
      ? (p.plotObstacles as unknown as Obstacle[])
      : [];

    const prompt = buildPlotGeneratorPrompt({
      genre,
      media:        project.media,
      targetWords:  project.targetWords,
      characters,
      worldSettings,
      goal,
      obstacles,
    });

    const client = new Anthropic();
    const message = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 4096,
      system:     prompt,
      messages:   [{ role: 'user', content: 'プロット概要を生成してください。' }],
    });

    const content = message.content[0];
    if (content?.type !== 'text') {
      return Response.json({ error: 'AI応答エラー' }, { status: 500 });
    }

    try {
      const _raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const plotOutline = JSON.parse(_raw) as { total_chapters: number; [key: string]: unknown };
      const totalChapters = plotOutline['total_chapters'] ?? 20;

      const tempoPlan = generateTempoPlan(
        genre,
        project.media as 'book' | 'web',
        typeof totalChapters === 'number' ? totalChapters : 20,
      );

      const genreRulesSnapshot = GENRE_RULES[genre] ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      await prisma.project.update({
        where: { id: projectId },
        data:  {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plotOutline:        plotOutline as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tempoPlan:          tempoPlan as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          genreRulesSnapshot: (genreRulesSnapshot ?? null) as any,
          status:             'step_5',
        },
      });

      return Response.json({ plotOutline, tempoPlan });
    } catch {
      return Response.json({ raw: content.text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: `プロット生成エラー: ${message}` }, { status: 500 });
  }
}
