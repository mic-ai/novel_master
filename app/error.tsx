'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-3 p-8">
        <h2 className="text-xl font-semibold text-gray-900">エラーが発生しました</h2>
        <p className="text-sm text-gray-500">ページの読み込みに失敗しました。</p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
