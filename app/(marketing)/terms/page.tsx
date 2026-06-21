import { LEGAL_NOTICES } from '@/lib/copyright/legal-notices';

export const metadata = { title: '著作権・免責事項 | NovelAgent' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">著作権・免責事項</h1>
      <p className="mb-10 text-sm text-gray-500">最終更新: 2026年6月</p>

      <Section title="1. サービスの位置づけ">
        <p className="whitespace-pre-line">{LEGAL_NOTICES.DISCLAIMER}</p>
      </Section>

      <Section title="2. ウォーターマーク機能について">
        <p className="whitespace-pre-line">{LEGAL_NOTICES.WATERMARK_CONSENT}</p>
      </Section>

      <Section title="3. 類似度チェック機能について">
        <p className="whitespace-pre-line">{LEGAL_NOTICES.SCAN_DISCLAIMER}</p>
      </Section>

      <Section title="4. 著作権について">
        <p>
          本サービスを通じて創作された小説・物語の著作権はユーザー自身に帰属します。
          本サービスが生成したAIテキストの著作権については、現行の著作権法解釈に基づき、
          ユーザーの創意工夫が加わった部分について著作権が認められる可能性があります。
          詳細は法律の専門家にご相談ください。
        </p>
      </Section>

      <Section title="5. 免責事項">
        <p>
          本サービスは現状有姿（as-is）で提供されます。
          本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
          著作権に関するトラブルが発生した場合は、ユーザー自身の責任で対処してください。
        </p>
      </Section>

      <p className="mt-10 text-xs text-gray-400">
        本利用規約は予告なく変更される場合があります。変更後も継続してサービスを利用した場合、
        変更後の規約に同意したものとみなします。
      </p>
    </div>
  );
}
