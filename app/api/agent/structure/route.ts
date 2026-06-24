import { auth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import { getGenreContext, getSceneWordRange } from '@/lib/agent/utils/get-genre-context';

export const maxDuration = 300;

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
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system:     `あなたは章構成の専門家です。プロット概要から各章の構成を作成します。

ジャンル: ${g.label}
視点ルール: デフォルト=${g.pov_rules['default']}

以下のJSON配列のみを返してください。説明文・コードブロック記号は不要です:
[
  {
    "chapterNumber": 章番号（整数）,
    "title": "章タイトル（20字以内）",
    "sceneType": "standard|emotional_peak|battle|mystery_reveal|sweet_scene|horror_peak|twist|setup|climax|epilogue|relief",
    "scenes": [
      { "summary": "シーンの概要（50字以内）", "povCharacter": "視点人物名" }
    ]
  }
]`,
    messages: [
      {
        role:    'user',
        content: `プロット概要:${JSON.stringify(plotOutline.chapters)}\n\nテンポ計画:${JSON.stringify(tempoPlan)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type !== 'text') {
    return Response.json({ error: 'AI応答エラー' }, { status: 500 });
  }

  try {
    let _raw = content.text.trim();
    const arrStart = _raw.indexOf('[');
    const arrEnd   = _raw.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) _raw = _raw.slice(arrStart, arrEnd + 1);
    const outlines = JSON.parse(_raw) as Array<{
      chapterNumber: number;
      title:         string;
      sceneType:     string;
      scenes:        unknown;
    }>;

    // tempoRole / targetWords / chapterEndingRule はコードで算出（AIに依存しない）
    const defaultEndingRule = g.chapter_ending_rules[0] ?? '';
    const created = await Promise.all(
      outlines.map((o) => {
        const range      = getSceneWordRange(project.genre, project.media as 'book' | 'web', o.sceneType);
        const tempoEntry = tempoPlan.find((t) => t.chapter === o.chapterNumber);
        return prisma.chapterOutline.create({
          data: {
            projectId,
            chapterNumber:     o.chapterNumber,
            title:             o.title,
            targetWords:       range.min,
            targetMin:         range.min,
            targetMax:         range.max,
            sceneType:         o.sceneType,
            tempoRole:         tempoEntry?.role ?? 'neutral',
            chapterEndingRule: defaultEndingRule,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            scenes:            o.scenes as any,
            foreshadowingIds:  [],
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
    console.error('[structure] JSON parse failed. raw[:300]:', content.text.slice(0, 300));
    return Response.json(
      { error: 'AIの応答を解析できませんでした。再試行してください。' },
      { status: 422 },
    );
  }
}
