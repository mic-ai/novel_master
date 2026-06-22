import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildConsistencyPrompt } from '@/lib/prompts/templates/consistency-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as { projectId: string };
  const { projectId } = body;

  const project = await prisma.project.findFirst({
    where:   { id: projectId, userId: session.user.id },
    include: {
      characters:    true,
      foreshadowing: true,
      chapters: {
        orderBy: { number: 'asc' },
        select:  { number: true, summary: true, content: true },
      },
    },
  });

  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const prompt = buildConsistencyPrompt({
    chapters:      project.chapters,
    foreshadowing: project.foreshadowing,
    characters:    project.characters,
  });

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 2048,
    system:     prompt,
    messages:   [{ role: 'user', content: '整合性をチェックしてください。' }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  const raw = content.text;
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonText = match[1]?.trim() ?? raw.trim();

  prisma.usageLog.create({
    data: { userId: session.user.id, tokens: message.usage.output_tokens, feature: 'consistency' },
  }).catch(() => { /* ログ失敗は無視 */ });

  try {
    const result = JSON.parse(jsonText) as {
      issues: unknown[];
      overall: string;
      summary: string;
    };
    return Response.json({ result });
  } catch {
    return Response.json({ raw });
  }
}
