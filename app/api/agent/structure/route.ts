import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { getGenreContext, getSceneWordRange } from '@/lib/agent/utils/get-genre-context';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as { projectId: string };
  const { projectId } = body;

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { foreshadowing: true },
  });

  if (!project?.plotOutline) {
    return Response.json({ error: 'プロットが未生成です' }, { status: 400 });
  }

  const g = getGenreContext(project.genre, project.media as 'book' | 'web');
  const tempoPlan = (project.tempoPlan ?? []) as Array<{
    chapter: number;
    role: string;
    sceneTypeHint: string;
  }>;

  const plotOutline = project.plotOutline as {
    total_chapters: number;
    chapters: Array<{
      number: number;
      title: string;
      summary: string;
      scene_type: string;
      foreshadowing?: string[];
    }>;
  };

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 4096,
    system:     `あなたは章構成の専門家です。プロット概要から各章の詳細な構成概要を作成します。

ジャンル: ${g.label}
章末ルール: ${g.chapter_ending_rules.join(' / ')}
視点ルール: デフォルト=${g.pov_rules['default']}

JSONのみで返してください（配列形式）:
[
  {
    "chapterNumber": 章番号,
    "title": "章タイトル",
    "targetWords": 目標文字数（整数）,
    "targetMin": 最小文字数,
    "targetMax": 最大文字数,
    "sceneType": "シーンタイプ",
    "tempoRole": "tension|release|neutral",
    "chapterEndingRule": "適用する章末ルール",
    "scenes": [
      {
        "index": 0,
        "summary": "シーンの概要",
        "povCharacter": "視点人物名"
      }
    ],
    "foreshadowingIds": []
  }
]`,
    messages: [
      {
        role:    'user',
        content: `プロット概要:\n${JSON.stringify(plotOutline.chapters, null, 2)}\n\nテンポ計画:\n${JSON.stringify(tempoPlan, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    const _raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const outlines = JSON.parse(_raw) as Array<{
      chapterNumber: number;
      title: string;
      targetWords: number;
      sceneType: string;
      tempoRole: string;
      chapterEndingRule: string;
      scenes: unknown;
    }>;

    // 各章のmin/maxをGENRE_RULESから取得
    const created = await Promise.all(
      outlines.map((o) => {
        const range = getSceneWordRange(project.genre, project.media as 'book' | 'web', o.sceneType);
        return prisma.chapterOutline.create({
          data: {
            projectId,
            chapterNumber:    o.chapterNumber,
            title:            o.title,
            targetWords:      o.targetWords,
            targetMin:        range.min,
            targetMax:        range.max,
            sceneType:        o.sceneType,
            tempoRole:        o.tempoRole,
            chapterEndingRule: o.chapterEndingRule,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            scenes:           o.scenes as any,
            foreshadowingIds: [],
          },
        });
      }),
    );

    await prisma.project.update({
      where: { id: projectId },
      data:  { status: 'step_7' },
    });

    return Response.json({ chapterOutlines: created });
  } catch {
    return Response.json({ raw: content.text });
  }
}
