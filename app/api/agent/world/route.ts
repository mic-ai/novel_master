import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    userInput: string;
    genre: string;
  };
  const { projectId, userInput, genre } = body;

  const genreRule = GENRE_RULES[genre];
  const specific = genreRule ? JSON.stringify(genreRule['fantasy_specific'] ?? genreRule['sf_specific'] ?? {}) : '{}';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: `あなたは小説の世界観設計の専門家です。
ジャンル「${genreRule?.label ?? genre}」の世界設定を構築します。

ジャンル固有ルール: ${specific}

ユーザーの入力から世界設定を整理し、JSONのみで返してください:
{
  "era": "時代・時期",
  "location": "舞台・場所",
  "society": "社会構造・文明レベル",
  "rules": ["世界のルール1", "世界のルール2"],
  "secrets": ["舞台の秘密・謎（伏線候補）"],
  "atmosphere": "全体の雰囲気・トーン",
  "consistency_warnings": ["内部矛盾の警告（あれば）"]
}`,
    messages: [{ role: 'user', content: userInput }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    const cleaned = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const worldSettings = JSON.parse(cleaned) as Record<string, unknown>;

    await prisma.project.update({
      where: { id: projectId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { worldSettings: worldSettings as any, status: 'step_3' },
    });

    return Response.json({ worldSettings });
  } catch {
    return Response.json({ error: 'AI応答のJSON解析に失敗しました', raw: content.text }, { status: 500 });
  }
}
