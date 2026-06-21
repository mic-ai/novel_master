import { NextRequest, NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createCopyrightProof } from '@/lib/copyright/proof';
import { buildSummarizePrompt } from '@/lib/prompts/templates/summarize-agent';
import { buildConsistencyPrompt } from '@/lib/prompts/templates/consistency-agent';

export async function GET(req: NextRequest) {
  const url       = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const number    = url.searchParams.get('number');

  if (!projectId || !number) {
    return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({
    where: { projectId_number: { projectId, number: parseInt(number, 10) } },
  });

  return NextResponse.json({ chapter });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    projectId: string;
    number:    number;
    content?:  string;
    title?:    string;
    status?:   string;
  };
  const { projectId, number, content = '', title, status = 'writing' } = body;

  const chapter = await prisma.chapter.upsert({
    where:  { projectId_number: { projectId, number } },
    update: { content, title, actualWords: content.length, status },
    create: { projectId, number, content, title, actualWords: content.length, status },
  });

  return NextResponse.json({ chapter });
}

// 章を完了済みにする — 著作権証明を自動作成
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const body = await req.json() as {
    projectId: string;
    number:    number;
    summary?:  string;
    status?:   string;
  };
  const { projectId, number, summary, status } = body;

  const chapter = await prisma.chapter.update({
    where: { projectId_number: { projectId, number } },
    data:  { summary, status },
    select: { content: true },
  });

  // 章完了時: 要約自動生成 + 著作権証明（ユーザー認証済みの場合）
  if (status === 'completed' && session?.user?.id && chapter.content) {
    // SummarizationAgent — 500字要約を生成して DB に保存
    const autoSummary = await (async () => {
      try {
        const client = new Anthropic();
        const msg = await client.messages.create({
          model:      'claude-sonnet-4-5',
          max_tokens: 1024,
          system:     buildSummarizePrompt({ chapterContent: chapter.content!, chapterNumber: number }),
          messages:   [{ role: 'user', content: '要約してください。' }],
        });
        const c = msg.content[0];
        const text = c?.type === 'text' ? c.text.trim().slice(0, 500) : null;
        if (text) {
          await prisma.chapter.update({
            where: { projectId_number: { projectId, number } },
            data:  { summary: text },
          });
          prisma.usageLog.create({
            data: { userId: session!.user!.id!, tokens: msg.usage.output_tokens, feature: 'summarize' },
          }).catch(() => { /* ログ失敗は無視 */ });
        }
        return text;
      } catch {
        return null;
      }
    })();

    // 著作権証明（要約を metadata に含める）
    await createCopyrightProof({
      content: chapter.content,
      userId: session.user.id,
      projectId,
      chapterNumber: number,
      metadata: { triggeredBy: 'chapter_completion', summary: autoSummary ?? summary ?? null } as Prisma.InputJsonObject,
    }).catch(() => { /* 証明失敗はサイレントに無視 */ });

    // ConsistencyAgent — fire-and-forget で非同期バックグラウンド実行
    void (async () => {
      try {
        const [characters, foreshadowing, chapters] = await Promise.all([
          prisma.character.findMany({ where: { projectId } }),
          prisma.foreshadowing.findMany({ where: { projectId } }),
          prisma.chapter.findMany({
            where:   { projectId },
            orderBy: { number: 'asc' },
            select:  { number: true, summary: true, content: true },
          }),
        ]);
        const prompt = buildConsistencyPrompt({ chapters, foreshadowing, characters });
        const client = new Anthropic();
        const msg = await client.messages.create({
          model:      'claude-sonnet-4-5',
          max_tokens: 2048,
          system:     prompt,
          messages:   [{ role: 'user', content: '整合性をチェックしてください。' }],
        });
        const c = msg.content[0];
        if (c?.type === 'text') {
          const raw   = c.text;
          const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
          const json  = (match[1] ?? raw).trim();
          const result = JSON.parse(json) as { overall: string };
          // 重大な問題がある場合のみ章の reviewReport に追記
          if (result.overall === '重大な問題あり') {
            await prisma.chapter.update({
              where: { projectId_number: { projectId, number } },
              data:  { reviewReport: { consistencyAlert: result } as Prisma.InputJsonObject },
            });
          }
        }
        prisma.usageLog.create({
          data: { userId: session!.user!.id!, tokens: msg.usage.output_tokens, feature: 'consistency_bg' },
        }).catch(() => { /* ログ失敗は無視 */ });
      } catch { /* バックグラウンド失敗は無視 */ }
    })();
  }

  return NextResponse.json({ chapter });
}
