# P6-5 問題の報告 (2026-09-29)

- 配列ページ(と各レイヤーのページ)の下に「問題を報告する」。押すと理由(スパム・宣伝 / 不適切な内容 / 権利の侵害 / その他)と任意のコメントを入れる欄が開く(`src/components/ReportButton.tsx`)。
- 報告は `reports` に記録(`src/lib/reports.ts`、Server Function は `src/app/k/[slug]/report-actions.ts`)。ブラウザ側からは読めない。
- 同じ接続元から1時間5件・1日20件まで、同じ配列への報告は1日1回まで(`decideReport`、`checkReportAllowed`)。
- 報告の確認方法と、削除は毎回人間の承認を得る決まりは `docs/operations.md` に記載。

スクリーンショット: `report-link.png`(報告の欄を開いたところ。送信はしていない)。

## 結合テスト(npm run test:integration: 19件成功)の該当部分
```
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 問題の報告(Supabase、P6-5) > 報告は記録され、同じ配列への2回目は受け付けない。ブラウザ側の権限では報告を読めない
報告の記録: [{"reason":"other","comment":"(結合テストの報告)"}]
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 問題の報告(Supabase、P6-5) > 報告は記録され、同じ配列への2回目は受け付けない。ブラウザ側の権限では報告を読めない 517ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 問題の報告(Supabase、P6-5) > 存在しない配列・不正な理由の報告は受け付けない 30ms
 Test Files  1 passed (1)
      Tests  19 passed (19)
```
テストが作った報告と記録は、テストの最後に削除した。
