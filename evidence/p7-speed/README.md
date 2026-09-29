# P7-10、P7-11 画面の切り替えを速く・分かりやすく(実行役、2026-09-30)

## 原因
- 本番の応答の `x-vercel-id` が `kix1::iad1`: 入口は大阪、処理はアメリカ東部(ワシントン)。
- Supabase は日本から 20〜50ms で届く(東京)。1つの画面で DB への問い合わせが何回もあり、そのたびに日米を往復していた。
- 変更前の測定: `before.md`(DB を使わない /new は約 0.2 秒、DB を使う画面は 0.7〜1.9 秒)。

## P7-10 処理を東京で動かす
- `vercel.json` に `"regions": ["hnd1"]`。変更後の測定は push 後に `after.md` に記録する。

## P7-11 動きが見えるように(開発サーバー、通信の遅れ 2.5 秒を人為的に加えて確認)
```
押す前: バー {"phase":"idle","width":0,"opacity":"0"}、URL /
── 人気順を押す
100ms後: バー {"phase":"loading","width":137,"opacity":"1"}
1000ms後: バー {"phase":"loading","width":565,"opacity":"1"}
画面が変わった後: バー {"phase":"idle","width":0,"opacity":"0"}、URL /?sort=popular
── カードのタイトルを押す
100ms後: バー {"phase":"loading","width":144,"opacity":"1"}、読み込み中の表示「読み込み中…」
1000ms後: バー {"phase":"loading","width":568,"opacity":"1"}
画面が変わった後: バー {"phase":"idle","width":0,"opacity":"0"}、URL /k/Iywp3BUpM-g
```
- `p7-11-sort-pending.png`(上部のバーと、人気順のボタンの回る印)、`p7-11-card-pending.png`(上部のバーと、カードのタイトルの「読み込み中…」)
- 存在しないページ: `/k/no-such-slug` 404、`/?page=99` 404(loading.tsx を使っていないので変わらない)
- 単体テスト(バーを出すか: 別の画面・並べ替えでは出す / 同じ画面・# だけ・新しいタブ・中クリック・外部サイト・ダウンロードでは出さない)。`npm test` 18ファイル139件、`tsc`・`eslint`・`npm run build` 成功。新しいパッケージは追加していない。

## 本番での確認(評価役、push 67d9d6a..23ee19e のあと)
- 処理の場所: `kix1::hnd1`(変更前 `kix1::iad1`)。
- 最初の応答の中央値(ミリ秒、各5回): / 1099→165、/?sort=popular 677→112、/k/Iywp3BUpM-g 700→135、/k/Iywp3BUpM-g/1 1116→97、/tags/windows 1885→140、/new 184→44(`before.md`、`after.md`)。
- 進み具合のバー: 上の開発サーバーでの確認と同じ結果(押して100ms後に出る → 画面が変わると消える)。
- /k/no-such-slug 404、/?page=99 404、OGP画像 200(image/png)、/api/keepalive(合言葉なし)401。
