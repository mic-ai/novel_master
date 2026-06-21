import Anthropic from '@anthropic-ai/sdk';
import { buildWritingPrompt } from '@/lib/prompts/templates/writing-agent';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { checkMonthlyTokens, tokenLimitResponse } from '@/lib/plan-limits';
import type { GenreRule } from '@/lib/prompts/genre-rules';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const tokenCheck = await checkMonthlyTokens(session.user.id, session.user.plan ?? 'FREE');
  if (!tokenCheck.allowed) return tokenLimitResponse(tokenCheck);

  const body = await req.json() as { projectId: string; chapterNumber: number; sceneIndex?: number };
  const { projectId, chapterNumber, sceneIndex = 0 } = body;

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { characters: true, foreshadowing: true },
  });

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }
  if (!project.genreRulesSnapshot) {
    return Response.json({ error: 'ジャンルルールが未設定です' }, { status: 400 });
  }

  const outline = await prisma.chapterOutline.findFirst({
    where: { projectId, chapterNumber },
  });

  if (!outline) {
    return Response.json({ error: '章構成が見つかりません' }, { status: 404 });
  }

  const prevChapter = chapterNumber > 1
    ? await prisma.chapter.findUnique({
        where: { projectId_number: { projectId, number: chapterNumber - 1 } },
      })
    : null;

  const plotOutline = project.plotOutline as { total_chapters: number } | null;
  const scenes = outline.scenes as Array<{ index: number; summary: string; povCharacter?: string }> | null;
  const scene = scenes?.[sceneIndex];

  const prompt = buildWritingPrompt({
    genre:               project.genre,
    media:               project.media,
    chapterNumber,
    totalChapters:       plotOutline?.total_chapters ?? 20,
    sceneType:           outline.sceneType ?? 'daily',
    sceneSummary:        scene?.summary ?? outline.title ?? `第${chapterNumber}章`,
    povCharacter:        scene?.povCharacter ?? outline.povCharacterId ?? '主人公',
    targetWords:         outline.targetWords ?? 3000,
    characters:          project.characters,
    prevChapterSummary:  prevChapter?.summary ?? undefined,
    foreshadowingToPlant: project.foreshadowing.filter((f) =>
      (outline.foreshadowingIds ?? []).includes(f.id),
    ),
    genreRulesSnapshot: project.genreRulesSnapshot as GenreRule,
  });

  const client = new Anthropic();
  const stream = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 4096,
    stream:     true,
    system:     prompt,
    messages:   [{ role: 'user', content: '執筆を開始してください。' }],
  });

  const userId  = session.user.id;
  const encoder = new TextEncoder();
  let totalTokens = 0;

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
        if (event.type === 'message_delta' && event.usage) {
          totalTokens = event.usage.output_tokens;
        }
      }
      controller.close();

      // UsageLog を非同期で記録（ストリーム完了後）
      prisma.usageLog.create({
        data: { userId, tokens: totalTokens, feature: 'writing' },
      }).catch(() => { /* ログ失敗は無視 */ });
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':    'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
