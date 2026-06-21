'use client';

interface TempoIndicatorProps {
  tempoRole: string | null | undefined;
  sceneType: string | null | undefined;
  chapterNumber: number;
}

const TEMPO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tension: { label: '緊張',    color: 'text-red-600',    bg: 'bg-red-50 border-red-200',    icon: '⚡' },
  release: { label: '弛緩',    color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',   icon: '💧' },
  neutral: { label: 'ニュートラル', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '○' },
};

const SCENE_LABELS: Record<string, string> = {
  battle:          '戦闘',
  romance:         'ロマンス',
  investigation:   '調査',
  emotional_peak:  '感情ピーク',
  daily:           '日常',
  climax:          'クライマックス',
  horror_peak:     '恐怖ピーク',
  tech_explain:    '技術説明',
  worldbuild:      '世界観描写',
  slow_burn:       'スローバーン',
  action_escape:   'アクション',
};

export default function TempoIndicator({ tempoRole, sceneType, chapterNumber }: TempoIndicatorProps) {
  const role   = tempoRole ?? 'neutral';
  const config = TEMPO_CONFIG[role] ?? TEMPO_CONFIG['neutral'] ?? { label: 'ニュートラル', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '○' };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${config.bg}`}>
      <span className="text-base leading-none">{config.icon}</span>
      <span className={`font-medium ${config.color}`}>{config.label}</span>
      {sceneType && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{SCENE_LABELS[sceneType] ?? sceneType}</span>
        </>
      )}
      <span className="text-gray-400 ml-auto">第{chapterNumber}章</span>
    </div>
  );
}
