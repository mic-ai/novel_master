import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { auth } from '@/lib/auth';
import SessionProvider from '@/components/SessionProvider';
import './globals.css';

const geistSans = localFont({
  src:      './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight:   '100 900',
});
const geistMono = localFont({
  src:      './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight:   '100 900',
});

export const metadata: Metadata = {
  title:       '小説制作サポートエージェント',
  description: 'AIがジャンル選択からキャラクター設計・プロット生成・執筆・添削まで一気通貫でサポート',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
