import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildSummarizePrompt } from '@/lib/prompts/templates/summarize-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:     string;
    chapterNumber: number;
    chapterContent: string;
  };
  const { projectId, chapterNumber, chapterContent } = body;

  if (!chapterContent?.trim()) {
    return Response.json({ error: '本文が空です' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1024,
    system:     buildSummarizePrompt({ chapterContent, chapterNumber }),
    messages:   [{ role: 'user', content: '要約してください。' }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  const summary = content.text.trim().slice(0, 500);

  await prisma.chapter.update({
    where: { projectId_number: { projectId, number: chapterNumber } },
    data:  { summary },
  });

  prisma.usageLog.create({
    data: { userId: session.user.id, tokens: message.usage.output_tokens, feature: 'summarize' },
  }).catch(() => { /* ログ失敗は無視 */ });

  return Response.json({ summary });
}
