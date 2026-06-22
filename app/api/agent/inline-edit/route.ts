import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildInlineEditPrompt, type InlineInstruction } from '@/lib/prompts/templates/inline-edit-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId:    string;
    selectedText: string;
    instruction:  InlineInstruction;
    context?:     string;
  };
  const { projectId, selectedText, instruction, context } = body;

  if (!selectedText?.trim()) {
    return Response.json({ error: 'テキストが選択されていません' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId: session.user.id },
    select: { id: true, genre: true },
  });
  if (!project) {
    return Response.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 2048,
    system:     buildInlineEditPrompt({ selectedText, instruction, genre: project.genre, context }),
    messages:   [{ role: 'user', content: '実行してください。' }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  prisma.usageLog.create({
    data: { userId: session.user.id, tokens: message.usage.output_tokens, feature: 'inline_edit' },
  }).catch(() => { /* ログ失敗は無視 */ });

  return Response.json({ result: content.text.trim() });
}
