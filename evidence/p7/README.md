# P7-1〜P7-3 の確認(実行役、開発サーバー http://localhost:3123 、2026-09-29)

## P7-1 サイト名「KeyMap Hub」
- トップ: `<title>KeyMap Hub</title>`、ヘッダーに「KeyMap Hub」
- 配列ページ(`/k/Iywp3BUpM-g`):
  ```
  <title>大西配列の基準(Keychron Orca echo) | KeyMap Hub</title>
  <meta property="og:site_name" content="KeyMap Hub"/>
  <meta property="og:image" content="http://localhost:3123/og/k/Iywp3BUpM-g?v=1790663815526-2"/>
  ```
- 画像URLの版が `1790663815526` → `1790663815526-2` に変わった。新しいURLは長く保存(`immutable`)、古いURL(`?v=1790663815526`)は `max-age=0, s-maxage=60` になり、古い名前の画像が長く残らない。
- OGP画像の右下が「KeyMap Hub」: `p7-1-og-image.png`

## P7-3 タップでの入れ替え(スマホの幅 390×844、タッチ操作)
```
1. 左手 L-0-0 を選び「ほかのキーと入れ替える」: Esc(キー)と入れ替える相手を、キー図でタップしてください(左手・右手どちらでも。スクロールしてから選べます)。やめる
2. 右手 R-0-1 をタップ: Esc(キー)とY(キー)の割り当てを入れ替えました(通常)。
   割り当て: L-0-0=Y  R-0-1=Esc
3. 元に戻す: L-0-0=Esc  R-0-1=Y
4. L-DIAL(ダイヤル)をタップ: …(待ちは続く)/ ダイヤルとは種類が違うので入れ替えられません。キーを選んでください。
5. 「やめる」: 入れ替えをやめました。  割り当て: L-0-0=Esc  R-0-1=Y
6. ダイヤルの編集欄に入れ替えボタンがあるか: false(同じ種類の相手がいないため出さない)
```
- `p7-3-1-swap-mode-mobile.png`(入れ替え元に紫の点線の枠とお知らせ)、`p7-3-2-swapped-mobile.png`(左手に Y、右手に Esc)、`p7-3-4-mismatch-mobile.png`(種類が違う相手)
- 単体テスト `decideTapSwap`(左右をまたいで入れ替え / 同じ要素でやめる / 種類が違う)を追加。`npm test` 16ファイル121件成功、`tsc`・`eslint`・`npm run build` 成功。

## P7-2 Orca echo の座標を確認済みに
- `src/keyboards/orca-echo.ts` の `isProvisional: false`、テスト「人間が実機と見比べて確認済み」成功。
- 本番DBの `keyboards.is_provisional` は人間が SQL Editor で変更する(未実施の時点の記録)。

## 本番での確認(評価役、https://keycap-share.vercel.app/ 、push 31b77cc..1492315 のあと)
```
<title>大西配列の基準(Keychron Orca echo) | KeyMap Hub</title>
<meta property="og:site_name" content="KeyMap Hub"/>
<meta property="og:image" content="https://keycap-share.vercel.app/og/k/Iywp3BUpM-g?v=1790663815526-2"/>
HTTP/1.1 200 OK / Cache-Control: public, max-age=86400, immutable(画像の右下は「KeyMap Hub」)
```
- タップでの入れ替え(本番の /new、390×844、タッチ): 上の 1〜6 と同じ結果。保存はしていない(本番に投稿は作っていない)。
- 本番DB(読み取りのみ): `[{"id":"orca-echo","is_provisional":false}]`(人間が SQL Editor で変更)
