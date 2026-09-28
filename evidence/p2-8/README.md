# P2-8 同じ部品からOGP用PNG(1200×630)を生成 (2026-09-29)

開発用ルート `/dev/og/[slug]`(`src/app/dev/og/[slug]/route.tsx`)。Supabaseから公開用キーで配列を取得し、
画面表示と同じ `KeymapDiagram` 部品を `ImageResponse`(next/og)で描いて、1200×630のPNGを返す。本番のOGP画像はフェーズ4で作る。

| ファイル | 内容 |
|---|---|
| `og-orca-echo-factory-default.png` | 工場出荷時配列の通常レイヤー(1200×630) |
| `og-orca-echo-combo-sample.png` | コンボのサンプル配列の通常レイヤー。コンボの番号・枠線、マクロ「署名」も描画 |

- どちらも HTTP 200 / `image/png` / 1200×630。存在しないslugは 404。
- タイトル(「Orca echo 工場出荷時配列」など)、キーの文字、コンボの番号がNoto Sans JPで正しく描画されている(文字化けなし)。

## 開発用ページを本番で出さない対応(人間の判断 A、2026-09-29)
- `src/lib/dev-pages.ts` と `src/app/dev/layout.tsx` で、Vercelの本番(`VERCEL_ENV=production`)では `/dev` 以下のページを404にした。ルート(route.tsx)にはレイアウトが効かないため、`/dev/og/[slug]` は個別に確認する。
- 手元で `VERCEL_ENV=production npm run build` → `next start` して確認: `/` 200、`/dev/keymap` 404、`/dev/layouts/orca-echo-factory-default` 404、`/dev/og/orca-echo-factory-default` 404。
