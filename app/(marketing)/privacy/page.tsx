export const metadata = { title: 'プライバシーポリシー | NovelAgent' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
      <p className="mb-10 text-sm text-gray-500">最終更新: 2026年6月</p>

      <Section title="1. 収集する情報">
        <p>本サービスは以下の情報を収集します：</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>アカウント情報（メールアドレス・氏名・プロフィール画像）— OAuth プロバイダーから取得</li>
          <li>プロジェクトデータ（小説テキスト・プロット・キャラクター設定・章情報）</li>
          <li>AIとのやり取りの記録（エージェントセッション）</li>
          <li>AIトークン使用量ログ（課金管理・上限管理のため）</li>
          <li>著作権証明レコード（改ざん防止のためアカウント削除後も5年間保持）</li>
          <li>エクスポート記録（日時・形式・IPアドレス・ウォーターマークID）</li>
        </ul>
      </Section>

      <Section title="2. 情報の利用目的">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>サービスの提供・AI機能の動作</li>
          <li>課金・プラン管理（Stripe経由）</li>
          <li>著作権証明記録の保全</li>
          <li>サービスの改善・不正利用の防止</li>
          <li>法的義務の履行</li>
        </ul>
      </Section>

      <Section title="3. 原稿テキストの取り扱い">
        <p>
          ユーザーが作成した小説テキストはデータベースに保存されます。
          Anthropic Claude APIへの送信はAI機能（執筆支援・添削・プロット生成等）の動作に必要な場合のみ行われます。
          Anthropicのデータポリシーについては
          <a href="https://www.anthropic.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Anthropic プライバシーポリシー
          </a>
          をご参照ください。
        </p>
      </Section>

      <Section title="4. ウォーターマーク機能">
        <p>
          ウォーターマーク（ゼロ幅文字によるユーザーID埋め込み）は、ユーザーが明示的に同意した場合のみエクスポートファイルに適用されます。
          同意なしにウォーターマークが埋め込まれることはありません。
          ウォーターマークIDはエクスポート記録テーブルに保存され、盗用調査の補助に利用できます。
        </p>
      </Section>

      <Section title="5. 著作権証明レコードの保持">
        <p>
          著作権証明レコード（SHA-256ハッシュ・HMAC署名・タイムスタンプ）は証拠保全の観点から
          <strong>アカウント削除後も最低5年間保持</strong>されます。
          これはユーザーの権利保護のためであり、プライバシーポリシーの一部として明示します。
        </p>
      </Section>

      <Section title="6. 第三者への提供">
        <p>以下の場合を除き、個人情報を第三者に提供しません：</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく開示義務がある場合</li>
          <li>サービス運営に必要なサービスプロバイダー（Stripe・Supabase・Vercel等）への提供</li>
        </ul>
      </Section>

      <Section title="7. Cookie・解析">
        <p>
          セッション管理にCookieを使用します。Vercel Analyticsによるページビュー計測を行う場合があります（個人を特定しない集計データのみ）。
        </p>
      </Section>

      <Section title="8. ユーザーの権利">
        <p>
          ユーザーはアカウント設定からプロジェクトデータの削除・エクスポートを行うことができます。
          著作権証明レコードは上記の保持ポリシーにより即時削除ができない場合があります。
          その他のデータ削除・開示請求については運営者までご連絡ください。
        </p>
      </Section>

      <Section title="9. セキュリティ">
        <p>
          データはSSL/TLS暗号化通信で送受信されます。
          著作権署名鍵（COPYRIGHT_SIGNING_KEY）と暗号化鍵（CONTENT_ENCRYPTION_KEY）は別々の値を使用し、
          定期的なローテーションを実施します。
        </p>
      </Section>

      <Section title="10. 準拠法">
        <p>
          本ポリシーは日本法に準拠します。個人情報の取り扱いについては個人情報保護法を遵守します。
        </p>
      </Section>

      <p className="mt-10 text-xs text-gray-400">
        本プライバシーポリシーは予告なく変更される場合があります。
        重要な変更がある場合はサービス内でお知らせします。
      </p>
    </div>
  );
}
