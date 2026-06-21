import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createCopyrightProof, verifyCopyrightProof } from '@/lib/copyright/proof';

export const dynamic = 'force-dynamic';

// GET /api/copyright/records?projectId=xxx — list records for a project
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId が必要です' }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });

  const records = await prisma.copyrightRecord.findMany({
    where: { projectId },
    orderBy: { timestamp: 'desc' },
  });

  return NextResponse.json({ records });
}

// POST /api/copyright/records — create a proof record for a chapter
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { projectId, chapterNumber, content, metadata } = await req.json() as {
    projectId: string;
    chapterNumber?: number;
    content: string;
    metadata?: import('@prisma/client').Prisma.InputJsonObject;
  };

  if (!projectId || !content) {
    return NextResponse.json({ error: 'projectId と content が必要です' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });

  const proof = await createCopyrightProof({
    content,
    userId: session.user.id,
    projectId,
    chapterNumber,
    metadata,
  });

  return NextResponse.json({ proof }, { status: 201 });
}

// PATCH /api/copyright/records — verify a record's signature
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { recordId } = await req.json() as { recordId: string };
  if (!recordId) return NextResponse.json({ error: 'recordId が必要です' }, { status: 400 });

  const result = await verifyCopyrightProof(recordId);
  return NextResponse.json(result);
}
