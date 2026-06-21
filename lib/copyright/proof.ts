import { createHmac, createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function signContent(hash: string, userId: string, timestamp: string): string {
  const key = process.env.COPYRIGHT_SIGNING_KEY;
  if (!key) throw new Error('COPYRIGHT_SIGNING_KEY が設定されていません');
  return createHmac('sha256', key)
    .update(`${hash}:${userId}:${timestamp}`)
    .digest('hex');
}

export async function createCopyrightProof(params: {
  content: string;
  userId: string;
  projectId: string;
  chapterNumber?: number;
  metadata?: Prisma.InputJsonObject;
}): Promise<{ id: string; contentHash: string; signature: string; timestamp: Date }> {
  const { content, userId, projectId, chapterNumber, metadata } = params;

  const contentHash = hashContent(content);
  const timestamp = new Date();

  const prevRecord = await prisma.copyrightRecord.findFirst({
    where: { projectId },
    orderBy: { timestamp: 'desc' },
    select: { contentHash: true },
  });

  const signature = signContent(contentHash, userId, timestamp.toISOString());

  const record = await prisma.copyrightRecord.create({
    data: {
      projectId,
      userId,
      chapterNumber: chapterNumber ?? null,
      contentHash,
      contentSize: Buffer.byteLength(content, 'utf8'),
      prevHash: prevRecord?.contentHash ?? null,
      signature,
      metadata: metadata ?? {},
      timestamp,
    },
  });

  return { id: record.id, contentHash, signature, timestamp };
}

export async function verifyCopyrightProof(recordId: string): Promise<{
  valid: boolean;
  record: { id: string; contentHash: string; timestamp: Date; userId: string } | null;
  reason?: string;
}> {
  const record = await prisma.copyrightRecord.findUnique({ where: { id: recordId } });
  if (!record) return { valid: false, record: null, reason: 'レコードが見つかりません' };

  const key = process.env.COPYRIGHT_SIGNING_KEY;
  if (!key) return { valid: false, record: null, reason: 'COPYRIGHT_SIGNING_KEY が未設定です' };

  const expected = signContent(record.contentHash, record.userId, record.timestamp.toISOString());
  if (expected !== record.signature) {
    return { valid: false, record: null, reason: '署名が一致しません（改ざんの可能性）' };
  }

  return {
    valid: true,
    record: {
      id: record.id,
      contentHash: record.contentHash,
      timestamp: record.timestamp,
      userId: record.userId,
    },
  };
}
