import { NextRequest, NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildCopyrightFooter, embedWatermark } from '@/lib/copyright/watermark';
import { createCopyrightProof } from '@/lib/copyright/proof';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const {
    projectId,
    format = 'txt',
    embedWatermarkFlag = false,
    embedFooter = true,
  } = await req.json() as {
    projectId: string;
    format?: 'txt' | 'md' | 'docx';
    embedWatermarkFlag?: boolean;
    embedFooter?: boolean;
  };

  if (!projectId) return NextResponse.json({ error: 'projectId が必要です' }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      chapters: { orderBy: { number: 'asc' }, where: { content: { not: null } } },
    },
  });
  if (!project) return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const authorName = user?.name ?? 'Unknown';

  const chapters = project.chapters.filter(c => c.content);
  const rawContent = chapters
    .map(c => `# 第${c.number}章${c.title ? ` ${c.title}` : ''}\n\n${c.content}`)
    .join('\n\n');

  const proof = await createCopyrightProof({
    content: rawContent,
    userId:  session.user.id,
    projectId,
    metadata: { format, chapterCount: chapters.length } as Prisma.InputJsonObject,
  });

  const watermarkId = `${proof.id.slice(0, 8)}-${session.user.id.slice(0, 8)}`;

  await prisma.exportRecord.create({
    data: {
      projectId,
      userId:     session.user.id,
      format,
      watermarkId,
      ipAddress:  req.headers.get('x-forwarded-for') ?? 'unknown',
    },
  });

  // ── DOCX 生成 ──────────────────────────────────────
  if (format === 'docx') {
    const footerText = embedFooter
      ? buildCopyrightFooter({ authorName, projectTitle: project.title, proofId: proof.id })
      : '';

    // docx は npm install 後に利用可能 (動的インポート)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = await import('docx') as any;

    const docChildren = [
      new Paragraph({
        text:      project.title,
        heading:   HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing:   { after: 400 },
      }),
      new Paragraph({
        children:  [new TextRun({ text: `著者: ${authorName}`, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing:   { after: 800 },
      }),
    ];

    for (const ch of chapters) {
      docChildren.push(
        new Paragraph({
          text:    `第${ch.number}章${ch.title ? ` ${ch.title}` : ''}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
        }),
      );
      for (const line of (ch.content ?? '').split('\n')) {
        docChildren.push(
          new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 120 } }),
        );
      }
    }

    if (footerText) {
      docChildren.push(
        new Paragraph({ text: '', spacing: { before: 800 } }),
        new Paragraph({
          children: [new TextRun({ text: footerText.trim(), size: 18, color: '888888' })],
        }),
      );
    }

    const doc    = new Document({ sections: [{ children: docChildren }] });
    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(project.title)}.docx"`,
        'X-Proof-Id':          proof.id,
      },
    });
  }

  // ── TXT / MD ─────────────────────────────────────
  let exportContent = rawContent;
  if (embedWatermarkFlag) exportContent = embedWatermark(exportContent, watermarkId);
  if (embedFooter) {
    exportContent += buildCopyrightFooter({ authorName, projectTitle: project.title, proofId: proof.id });
  }

  return NextResponse.json({
    content:      exportContent,
    proofId:      proof.id,
    filename:     `${project.title}.${format}`,
    chapterCount: chapters.length,
  });
}
