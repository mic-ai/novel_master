import Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildPlotRefinerPrompt } from '@/lib/prompts/templates/plot-refiner';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:   string;
    editRequest: string;
  };
  const { projectId, editRequest } = body;

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true, genre: true, media: true, plotOutline: true },
  });

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }
  if (!project.plotOutline) {
    return Response.json({ error: 'プロットがまだ生成されていません' }, { status: 400 });
  }

  const prompt = buildPlotRefinerPrompt({
    currentPlot:  project.plotOutline as Parameters<typeof buildPlotRefinerPrompt>[0]['currentPlot'],
    editRequest,
    genre:        project.genre,
    media:        project.media,
  });

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 4096,
    system:     prompt,
    messages:   [{ role: 'user', content: 'プロットを修正してください。' }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  const raw = content.text.trim();
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonText = (match[1] ?? raw).trim();

  try {
    const plotOutline = JSON.parse(jsonText) as Prisma.InputJsonObject;

    await prisma.project.update({
      where: { id: projectId },
      data:  { plotOutline },
    });

    prisma.usageLog.create({
      data: { userId: session.user.id, tokens: message.usage.output_tokens, feature: 'refine' },
    }).catch(() => { /* ログ失敗は無視 */ });

    return Response.json({ plotOutline });
  } catch {
    return Response.json({ raw }, { status: 422 });
  }
}
