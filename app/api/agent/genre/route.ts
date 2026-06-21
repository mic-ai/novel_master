import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { GENRE_RULES } from '@/lib/prompts/genre-rules';

const DUMMY_USER_ID = 'dummy-user-001';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as { userInput?: string; currentGenre?: string };
  const { userInput, currentGenre } = body;

  const genreList = Object.entries(GENRE_RULES)
    .map(([key, g]) => `- ${key}: ${g.label}（${g.core_principle}）`)
    .join('\n');

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: `あなたは小説ジャンルの専門アドバイザーです。
ユーザーが書きたい小説のジャンルを提案・確定します。

利用可能なジャンル:
${genreList}

ユーザーの入力を聞いて最適なジャンルを提案してください。
必ずJSONのみで返してください:
{
  "genre": "romance|mystery|fantasy|sf|horror のいずれか",
  "subgenre": "サブジャンル（任意）",
  "media": "book|web",
  "reasoning": "この提案の理由（100字以内）"
}`,
    messages: [
      {
        role: 'user',
        content: userInput ?? `現在のジャンル候補: ${currentGenre ?? 'なし'}。ジャンルを確定してください。`,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    const _raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(_raw) as {
      genre: string;
      subgenre?: string;
      media: string;
      reasoning: string;
    };
    void DUMMY_USER_ID;
    return Response.json(parsed);
  } catch {
    return Response.json({ raw: content.text });
  }
}
