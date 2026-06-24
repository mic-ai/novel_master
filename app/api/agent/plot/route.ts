import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { buildPlotGeneratorPrompt } from '@/lib/prompts/templates/plot-generator';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { generateTempoPlan } from '@/lib/agent/utils/tempo-planner';
import { checkMonthlyTokens, tokenLimitResponse } from '@/lib/plan-limits';
import type { WorldSettings, Obstacle } from '@/lib/prompts/genre-rules';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
    name:        c.name,
    role:        c.role,
    lack:        c.lack,
    want:        c.want,
    weakness:    c.weakness,
    arcStart:    c.arcStart,
    arcEnd:      c.arcEnd,
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
  const stream = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    stream:     true,
    system:     prompt,
    messages:   [{ role: 'user', content: 'プロット概要を生成してください。' }],
  });

  const userId  = session.user.id;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullText    = '';
      let totalTokens = 0;

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`),
            );
          }
          if (event.type === 'message_delta' && event.usage) {
            totalTokens = event.usage.output_tokens;
          }
        }

        // フルテキストからJSONを抽出してDBに保存
        try {
          let raw = fullText.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();
          const jsonStart = raw.indexOf('{');
          const jsonEnd   = raw.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) raw = raw.slice(jsonStart, jsonEnd + 1);

          const plotOutline = JSON.parse(raw) as { total_chapters: number; [key: string]: unknown };
          const totalChapters = typeof plotOutline['total_chapters'] === 'number'
            ? plotOutline['total_chapters']
            : 20;

          const tempoPlan          = generateTempoPlan(genre, project.media as 'book' | 'web', totalChapters);
          const genreRulesSnapshot = GENRE_RULES[genre] ?? null;

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

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch {
          console.error('[plot] JSON parse failed. raw[:300]:', fullText.slice(0, 300));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'AIの応答を解析できませんでした。再試行してください。' })}\n\n`,
            ),
          );
        }

        prisma.usageLog.create({
          data: { userId, tokens: totalTokens, feature: 'plot' },
        }).catch(() => { /* ログ失敗は無視 */ });

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `プロット生成エラー: ${msg}` })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
