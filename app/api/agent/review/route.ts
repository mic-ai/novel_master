import Anthropic from '@anthropic-ai/sdk';
import { buildReviewPrompt } from '@/lib/prompts/templates/review-agent';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import type { GenreRule } from '@/lib/prompts/genre-rules';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:      string;
    chapterNumber:  number;
    chapterContent: string;
  };
  const { projectId, chapterNumber, chapterContent } = body;

  if (!chapterContent?.trim()) {
    return Response.json({ error: '本文が空です' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { foreshadowing: true },
  });

  if (!project || !project.genreRulesSnapshot) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const outline = await prisma.chapterOutline.findFirst({
    where: { projectId, chapterNumber },
  });

  const prompt = buildReviewPrompt({
    genre:               project.genre,
    media:               project.media,
    chapterContent,
    genreRulesSnapshot:  project.genreRulesSnapshot as GenreRule,
    foreshadowingToPlant: project.foreshadowing.filter((f) =>
      (outline?.foreshadowingIds ?? []).includes(f.id),
    ),
  });

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 2048,
    system:     prompt,
    messages:   [{ role: 'user', content: '添削してください。' }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  // JSONブロックを抽出（```json ... ``` に包まれている場合を考慮）
  const raw = content.text;
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonText = match[1]?.trim() ?? raw.trim();

  try {
    const review = JSON.parse(jsonText) as {
      total_score: number;
      overall_feedback: string;
    };

    await prisma.chapter.upsert({
      where:  { projectId_number: { projectId, number: chapterNumber } },
      update: { reviewReport: review },
      create: {
        projectId,
        number:      chapterNumber,
        content:     chapterContent,
        actualWords: chapterContent.length,
        reviewReport: review,
        status:      'writing',
      },
    });

    // UsageLog を記録
    prisma.usageLog.create({
      data: { userId: session.user.id, tokens: message.usage.output_tokens, feature: 'review' },
    }).catch(() => { /* ログ失敗は無視 */ });

    return Response.json({ review });
  } catch {
    return Response.json({ raw });
  }
}
