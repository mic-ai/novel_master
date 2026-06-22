import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildContinuationPrompt } from '@/lib/prompts/templates/continuation-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:      string;
    chapterNumber:  number;
    currentContent: string;
  };
  const { projectId, chapterNumber, currentContent } = body;

  if (!currentContent?.trim()) {
    return Response.json({ error: '本文が空です' }, { status: 400 });
  }

  const [project, chapter] = await Promise.all([
    prisma.project.findFirst({
      where:  { id: projectId, userId: session.user.id },
      select: { id: true, genre: true, media: true },
    }),
    prisma.chapter.findUnique({
      where:  { projectId_number: { projectId, number: chapterNumber } },
      select: { summary: true },
    }),
  ]);

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const prompt = buildContinuationPrompt({
    currentContent,
    genre:          project.genre,
    media:          project.media,
    chapterSummary: chapter?.summary ?? undefined,
  });

  const client = new Anthropic();
  const stream = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1024,
    system:     prompt,
    messages:   [{ role: 'user', content: '続きを提案してください。' }],
    stream:     true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let totalTokens = 0;
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
        if (event.type === 'message_delta') {
          totalTokens = event.usage.output_tokens;
        }
      }
      prisma.usageLog.create({
        data: { userId: session!.user!.id!, tokens: totalTokens, feature: 'continuation' },
      }).catch(() => { /* ログ失敗は無視 */ });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
