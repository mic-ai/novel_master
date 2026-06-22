import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';
import { prisma } from '@/lib/db/prisma';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    goal: string;
    obstacleInput: string;
    genre: string;
  };
  const { projectId, goal, obstacleInput, genre } = body;

  const genreRule = GENRE_RULES[genre];
  const parts = genreRule?.parts.book.map((p) => p.name).join('、') ?? '序章、第一部、第二部、終章';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: `あなたは小説のコンフリクト設計の専門家です。
ジャンル「${genreRule?.label ?? genre}」の主人公の目標と障害を三幕構成に分類します。

パート構成: ${parts}

以下のJSONのみで返してください:
{
  "goal": "外的目標",
  "inner_goal": "内的目標（感情・成長面）",
  "obstacles": [
    {
      "description": "障害の説明",
      "part": "配置するパート名",
      "type": "external|internal|interpersonal",
      "intensity": 1から10の強度
    }
  ]
}`,
    messages: [
      {
        role: 'user',
        content: `外的目標: ${goal}\n障害リスト: ${obstacleInput}`,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    const _raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const result = JSON.parse(_raw) as {
      goal: string;
      inner_goal: string;
      obstacles: Array<{ description: string; part: string; type: string; intensity: number }>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.project.updateMany as any)({
      where: { id: projectId, userId: session.user.id },
      data:  {
        goal:          result.goal,
        plotObstacles: result.obstacles,
      },
    });
    return Response.json(result);
  } catch {
    return Response.json({ raw: content.text });
  }
}
