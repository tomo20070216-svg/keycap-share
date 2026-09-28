# P3-7 フェーズ3の確認(評価役、本番 https://keycap-share.vercel.app/ 、2026-09-29)

`evals/acceptance.md` フェーズ3の確認方法: `/k/[id]` と `/k/[id]/[layer]` のURLを実際に開き、配列とレイヤーが表示されること。一覧・新着・タグ絞り込みが動くこと。

人間の承認(push OK)を得て main に push(`7158540..c37e630`)し、Vercel の本番デプロイ後に確認した。

## ステータスコード(本番)
```
200 /
404 /?page=2
200 /k/orca-echo-factory-default
200 /k/orca-echo-factory-default/0
200 /k/orca-echo-factory-default/1
200 /k/orca-echo-factory-default/2
404 /k/orca-echo-factory-default/3
200 /k/orca-echo-combo-sample        (一覧には出ないが、URLを直接開けば見られる)
404 /k/no-such-slug
200 /tags/工場出荷時
404 /dev/keymap                      (開発用ページは本番で404)
```

## サーバーが返すHTML(JavaScriptなし)に含まれるもの(本番の /k/orca-echo-factory-default)
- `<title>Orca echo 工場出荷時配列…`、キーの文字 `>Esc<`、`レイヤー1: fn1`、`lang="ja"` を確認。

## スクリーンショット(本番)
| ファイル | 内容 |
|---|---|
| `prod-home.png` | 一覧(新着)。工場出荷時配列の1件 |
| `prod-k-factory-default.png` | 配列ページ(全3レイヤー) |
| `prod-k-factory-default-0.png`・`-1.png`・`-2.png` | レイヤーページ(選択中のレイヤーが強調) |
| `prod-k-combo-sample.png` | コンボのサンプル配列(コンボの番号・一覧、マクロ) |
| `prod-tag-factory.png` | タグ「工場出荷時」での絞り込み |
