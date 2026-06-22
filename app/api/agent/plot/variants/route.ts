import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { buildPlotGeneratorPrompt } from '@/lib/prompts/templates/plot-generator';
import { checkMonthlyTokens, tokenLimitResponse } from '@/lib/plan-limits';
import type { WorldSettings, Obstacle } from '@/lib/prompts/genre-rules';

const VARIANT_HINTS = [
  '通常のプロット構成で、ジャンルの王道展開を大切にしながら生成してください。',
  'より暗く・シリアスなトーンで、主人公が失敗や喪失を経験する場面を増やし、感情的な重厚さを出してください。',
  'より軽やかでポジティブなトーンで、ユーモアや心温まる場面を多めに取り入れながら展開してください。',
] as const;

const VARIANT_LABELS = ['王道', 'ダーク', 'ライト'] as const;

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const tokenCheck = await checkMonthlyTokens(session.user.id, session.user.plan ?? 'FREE');
  if (!tokenCheck.allowed) return tokenLimitResponse(tokenCheck);

  const body     = await req.json() as { projectId: string };
  const { projectId } = body;

  const project = await prisma.project.findFirst({
    where:   { id: projectId, userId: session.user.id },
    include: { characters: true },
  });

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

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

  const ctx = {
    genre:        project.genre,
    media:        project.media,
    targetWords:  project.targetWords,
    characters,
    worldSettings: (project.worldSettings ?? {}) as WorldSettings,
    goal:         '主人公の目標',
    obstacles:    [] as Obstacle[],
  };

  const client = new Anthropic();

  const results = await Promise.allSettled(
    VARIANT_HINTS.map((hint) => {
      const prompt = buildPlotGeneratorPrompt({ ...ctx, variantHint: hint });
      return client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system:     prompt,
        messages:   [{ role: 'user', content: 'プロット概要を生成してください。' }],
      });
    }),
  );

  const variants = results.map((result) => {
    if (result.status === 'rejected') return null;
    const content = result.value.content[0];
    if (content?.type !== 'text') return null;
    try {
      const raw = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  });

  prisma.usageLog.createMany({
    data: results
      .filter((r) => r.status === 'fulfilled')
      .map(() => ({ userId: session!.user!.id!, tokens: 0, feature: 'plot_variant' })),
  }).catch(() => { /* ログ失敗は無視 */ });

  return Response.json({ variants, labels: VARIANT_LABELS });
}
