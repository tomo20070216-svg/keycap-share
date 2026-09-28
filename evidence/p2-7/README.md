# P2-7 Supabaseから取得した配列の全レイヤー表示 (2026-09-29)

確認ページ: `/dev/layouts/[slug]`(`src/app/dev/layouts/[slug]/page.tsx`。検索エンジンには載せない設定)。
配列と機種は `getLayoutBySlug` / `getKeyboard` で**公開用キー(ブラウザと同じ権限)**を使って Supabase から取得する。

| ファイル | 内容 |
|---|---|
| `orca-echo-factory-default.png` | 工場出荷時配列。レイヤー0(通常)・1(fn1)・2(fn2)の3レイヤー |
| `orca-echo-combo-sample.png` | コンボのサンプル配列。3レイヤー + コンボの番号・一覧 + マクロ一覧 |

## 確認
- 存在する2件のslugは HTTP 200、存在しないslug(`no-such-slug`)は 404。
- 全レイヤーが縦に並び、左右の間に隙間があって分割が分かる。
- `npm test` 52件、`npx tsc --noEmit`、eslint、`npm run build` 成功。
- 新しい動的ルートの型は `npx next typegen` で生成してから型チェックした。
