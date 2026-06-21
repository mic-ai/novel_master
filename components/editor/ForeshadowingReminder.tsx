'use client';

interface ForeshadowingItem {
  id:          string;
  description: string;
  isFake:      boolean;
}

interface ForeshadowingReminderProps {
  items: ForeshadowingItem[];
}

export default function ForeshadowingReminder({ items }: ForeshadowingReminderProps) {
  if (items.length === 0) {
    return (
      <div className="text-xs text-gray-400 px-1">この章で配置すべき伏線はありません</div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 flex-shrink-0">
            {item.isFake ? (
              <span title="フェイク伏線" className="text-amber-500">★</span>
            ) : (
              <span className="text-indigo-400">◆</span>
            )}
          </span>
          <span className="text-gray-600 leading-relaxed">{item.description}</span>
        </li>
      ))}
    </ul>
  );
}
