import { prisma } from '@/lib/db/prisma';
import { PLANS, FREE_PLAN } from '@/lib/plans';

interface LimitResult {
  allowed: boolean;
  used:    number;
  limit:   number;
}

function getPlanConfig(plan: string) {
  switch (plan) {
    case 'STARTER': return PLANS.STARTER;
    case 'PRO':     return PLANS.PRO;
    case 'TEAM':    return PLANS.TEAM;
    default:        return FREE_PLAN;
  }
}

export async function checkMonthlyTokens(
  userId: string,
  plan:   string,
): Promise<LimitResult> {
  const { tokensPerMonth: limit } = getPlanConfig(plan);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const agg = await prisma.usageLog.aggregate({
    where: { userId, createdAt: { gte: startOfMonth } },
    _sum:  { tokens: true },
  });

  const used = agg._sum.tokens ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function checkProjectLimit(
  userId: string,
  plan:   string,
): Promise<LimitResult> {
  const { projectLimit: limit } = getPlanConfig(plan);

  if (limit === -1) return { allowed: true, used: 0, limit: -1 };

  const used = await prisma.project.count({ where: { userId } });
  return { allowed: used < limit, used, limit };
}

export function tokenLimitResponse(result: LimitResult) {
  return Response.json(
    {
      error: `月間トークン上限（${result.limit.toLocaleString()}）に達しました。プランをアップグレードしてください。`,
      used:  result.used,
      limit: result.limit,
    },
    { status: 429 },
  );
}

export function projectLimitResponse(result: LimitResult) {
  return Response.json(
    {
      error: `プロジェクト数の上限（${result.limit}件）に達しました。プランをアップグレードしてください。`,
      used:  result.used,
      limit: result.limit,
    },
    { status: 429 },
  );
}
