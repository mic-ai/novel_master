'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, name }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? '登録に失敗しました');
        return;
      }
      router.push('/login?registered=1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">📖</div>
          <h1 className="text-2xl font-bold text-gray-900">アカウント登録</h1>
          <p className="text-gray-500 text-sm">無料で始める</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">名前（任意）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ペンネームなど"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">パスワード（8文字以上）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8文字以上"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-indigo-600 hover:underline ml-1">ログイン</Link>
        </p>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          登録することで、
          <a href="/terms" className="text-indigo-500 hover:underline">利用規約</a>と
          <a href="/privacy" className="text-indigo-500 hover:underline">プライバシーポリシー</a>
          に同意したことになります。
        </p>
      </div>
    </div>
  );
}
