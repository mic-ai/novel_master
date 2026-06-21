'use client';

import { useState } from 'react';
import { ExportModal } from '@/components/copyright/ExportModal';

type Props = { projectId: string; projectTitle: string };

export function ExportPageClient({ projectId, projectTitle }: Props) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-700">エクスポートが完了しました。</p>
        <button
          onClick={() => setDone(false)}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          再度エクスポート
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <ExportModal
        projectId={projectId}
        projectTitle={projectTitle}
        onClose={() => setDone(true)}
      />
    </div>
  );
}
