import Link from 'next/link';
import Image from 'next/image';
import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* グローバルナビゲーション */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/projects" className="flex items-center gap-2 font-bold text-gray-900 hover:text-indigo-600 transition">
            <span className="text-xl">📖</span>
            <span className="text-sm">NovelAgent</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/projects"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              プロジェクト
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              設定
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* ユーザーアバター */}
            <div className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? 'ユーザー'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {(user.name ?? user.email ?? 'U')[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-700 hidden sm:block max-w-[120px] truncate">
                {user.name ?? user.email}
              </span>
            </div>

            {/* サインアウト */}
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
