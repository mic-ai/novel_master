'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="ja">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-gray-900">予期しないエラーが発生しました</h1>
          <p className="text-gray-500">問題が続く場合はサポートにお問い合わせください。</p>
          {error.digest && (
            <p className="font-mono text-xs text-gray-400">エラーID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
