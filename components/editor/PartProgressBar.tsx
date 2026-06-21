'use client';

import { GENRE_RULES } from '@/lib/prompts/genre-rules';

interface Props {
  genre:          string;
  media:          string;
  totalChapters:  number;
  currentChapter: number;
}

export default function PartProgressBar({ genre, media, totalChapters, currentChapter }: Props) {
  if (media !== 'book' || totalChapters === 0) return null;

  const rule = GENRE_RULES[genre];
  if (!rule) return null;

  const parts = rule.parts.book;
  if (!parts.length) return null;

  let cumulative = 0;
  const partBoundaries = parts.map((part) => {
    const startChapter = Math.round(totalChapters * cumulative) + 1;
    cumulative += part.ratio;
    const endChapter = Math.min(totalChapters, Math.round(totalChapters * cumulative));
    return { ...part, startChapter, endChapter };
  });

  const currentPart =
    partBoundaries.find(
      (p) => currentChapter >= p.startChapter && currentChapter <= p.endChapter,
    ) ?? partBoundaries[partBoundaries.length - 1];

  return (
    <div className="flex items-stretch gap-0.5 text-xs h-6 mt-1" title="パート別進捗">
      {partBoundaries.map((part, i) => {
        const isActive = part === currentPart;
        const isDone   = part.endChapter < currentChapter;
        return (
          <div
            key={i}
            style={{ flex: part.ratio }}
            title={`${part.name}（第${part.startChapter}〜${part.endChapter}章）: ${part.focus}`}
            className={`flex items-center justify-center px-1 rounded text-center overflow-hidden transition ${
              isActive
                ? 'bg-indigo-600 text-white font-medium'
                : isDone
                ? 'bg-indigo-200 text-indigo-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="truncate">
              {part.name.split('：')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
