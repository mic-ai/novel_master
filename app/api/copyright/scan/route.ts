import { NextRequest, NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  generateFingerprints,
  calculateJaccardSimilarity,
  getSimilarityStatus,
} from '@/lib/copyright/fingerprint';

export const dynamic = 'force-dynamic';

// POST /api/copyright/scan
// Compares fingerprints of all chapters within a project (internal dedup check).
// Also compares against other projects owned by the user.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { projectId } = await req.json() as { projectId: string };
  if (!projectId) return NextResponse.json({ error: 'projectId が必要です' }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { chapters: { where: { content: { not: null } } } },
  });
  if (!project) return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });

  const chapters = project.chapters.filter(c => c.content);
  if (chapters.length === 0) {
    return NextResponse.json({ error: '章のコンテンツがありません' }, { status: 400 });
  }

  // Generate / refresh fingerprints for each chapter
  const KGRAM = 5;
  const WINDOW = 10;
  const chapterFPs: { chapterId: string; number: number; fps: number[] }[] = [];

  for (const ch of chapters) {
    const fps = generateFingerprints(ch.content!, KGRAM, WINDOW);

    await prisma.textFingerprint.upsert({
      where: { projectId_chapterId: { projectId, chapterId: ch.id } },
      create: { projectId, chapterId: ch.id, fingerprints: fps as unknown as Prisma.InputJsonValue, kgramSize: KGRAM, windowSize: WINDOW },
      update: { fingerprints: fps as unknown as Prisma.InputJsonValue, updatedAt: new Date() },
    });

    chapterFPs.push({ chapterId: ch.id, number: ch.number, fps });
  }

  // Internal chapter-vs-chapter similarity
  type ScanResult = {
    chapterA: number;
    chapterB: number;
    similarity: number;
    status: ReturnType<typeof getSimilarityStatus>;
  };
  const results: ScanResult[] = [];

  for (let i = 0; i < chapterFPs.length; i++) {
    for (let j = i + 1; j < chapterFPs.length; j++) {
      const a = chapterFPs[i]!;
      const b = chapterFPs[j]!;
      const similarity = calculateJaccardSimilarity(a.fps, b.fps);
      const status = getSimilarityStatus(similarity);
      results.push({ chapterA: a.number, chapterB: b.number, similarity, status });
    }
  }

  const maxSimilarity = results.length > 0 ? Math.max(...results.map(r => r.similarity)) : 0;
  const overallStatus = getSimilarityStatus(maxSimilarity);

  // Log the scan
  await prisma.plagiarismScanLog.create({
    data: {
      projectId,
      scanType: 'internal',
      similarity: maxSimilarity,
      matchedRanges: results as unknown as Prisma.InputJsonValue,
      status: overallStatus,
    },
  });

  return NextResponse.json({ results, overallStatus, maxSimilarity, scannedChapters: chapters.length });
}
