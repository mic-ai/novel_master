'use client';

interface WordCountBarProps {
  current: number;
  targetMin: number;
  targetMax: number;
}

export default function WordCountBar({ current, targetMin, targetMax }: WordCountBarProps) {
  const pct = Math.min((current / targetMax) * 100, 100);
  const inRange = current >= targetMin && current <= targetMax;
  const overRange = current > targetMax;

  let barColor = 'bg-gray-300';
  if (inRange) barColor = 'bg-emerald-400';
  else if (overRange) barColor = 'bg-amber-400';
  else if (current >= targetMin * 0.8) barColor = 'bg-blue-400';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        {/* targetMin marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
          style={{ left: `${(targetMin / targetMax) * 100}%` }}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
        <span className={`font-semibold ${inRange ? 'text-emerald-600' : overRange ? 'text-amber-600' : 'text-gray-700'}`}>
          {current.toLocaleString()}字
        </span>
        <span className="text-gray-400 mx-1">/</span>
        <span>{targetMin.toLocaleString()}〜{targetMax.toLocaleString()}字</span>
      </div>
    </div>
  );
}
