import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';

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

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: `あなたは小説キャラクター設計の専門家です。
ジャンル「${genre}」に最適なキャラクターを設計します。

ユーザーの入力から以下のキャラクター情報を引き出し、JSONのみで返してください:
[
  {
    "role": "protagonist|heroine|antagonist|mentor|sub のいずれか",
    "name": "キャラクター名",
    "age": 年齢（数値）,
    "lack": "欠乏（何が欠けているか）",
    "want": "欲求（何を求めているか）",
    "weakness": "弱点",
    "arc": "growth|fall|flat のいずれか",
    "arcStart": "物語開始時の状態",
    "arcEnd": "物語終了時の状態",
    "trait": "口癖・特徴的行動"
  }
]`,
    messages: [{ role: 'user', content: userInput }],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    const _raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const characters = JSON.parse(_raw) as Array<{
      role: string;
      name: string;
      age?: number;
      lack?: string;
      want?: string;
      weakness?: string;
      arc?: string;
      arcStart?: string;
      arcEnd?: string;
      trait?: string;
    }>;

    const created = await Promise.all(
      characters.map((c) =>
        prisma.character.create({
          data: {
            projectId,
            role:     c.role,
            name:     c.name,
            age:      c.age ?? null,
            lack:     c.lack ?? null,
            want:     c.want ?? null,
            weakness: c.weakness ?? null,
            arc:      c.arc ?? null,
            arcStart: c.arcStart ?? null,
            arcEnd:   c.arcEnd ?? null,
            trait:    c.trait ?? null,
          },
        }),
      ),
    );

    return Response.json({ characters: created });
  } catch {
    return Response.json({ raw: content.text });
  }
}
