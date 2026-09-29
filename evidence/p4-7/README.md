# P4-7 フェーズ4の確認(評価役、本番 https://keycap-share.vercel.app/ 、2026-09-29)

人間の承認(push OK)を得て main に push(`c37e630..9358b7b`)し、Vercel の本番デプロイ後に確認した。

## 1. HTMLソースのメタタグ(本番。Xのクローラーと同じ User-Agent「Twitterbot/1.0」で取得)
## /k/orca-echo-factory-default
```html
<meta name="description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<link rel="canonical" href="https://keycap-share.vercel.app/k/orca-echo-factory-default"/>
<meta property="og:title" content="Orca echo 工場出荷時配列(Keychron Orca echo)"/>
<meta property="og:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta property="og:url" content="https://keycap-share.vercel.app/k/orca-echo-factory-default"/>
<meta property="og:site_name" content="keycap-share"/>
<meta property="og:locale" content="ja_JP"/>
<meta property="og:image" content="https://keycap-share.vercel.app/og/k/orca-echo-factory-default?v=1790603718961"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo)"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Orca echo 工場出荷時配列(Keychron Orca echo)"/>
<meta name="twitter:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta name="twitter:image" content="https://keycap-share.vercel.app/og/k/orca-echo-factory-default?v=1790603718961"/>
<meta name="twitter:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo)"/>
<meta name="twitter:image:width" content="1200"/>
<meta name="twitter:image:height" content="630"/>
```
## /k/orca-echo-factory-default/1
```html
<meta name="description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<link rel="canonical" href="https://keycap-share.vercel.app/k/orca-echo-factory-default/1"/>
<meta property="og:title" content="Orca echo 工場出荷時配列 — fn1(赤)(Keychron Orca echo)"/>
<meta property="og:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta property="og:url" content="https://keycap-share.vercel.app/k/orca-echo-factory-default/1"/>
<meta property="og:site_name" content="keycap-share"/>
<meta property="og:locale" content="ja_JP"/>
<meta property="og:image" content="https://keycap-share.vercel.app/og/k/orca-echo-factory-default/1?v=1790603718961"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo、fn1(赤))"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Orca echo 工場出荷時配列 — fn1(赤)(Keychron Orca echo)"/>
<meta name="twitter:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta name="twitter:image" content="https://keycap-share.vercel.app/og/k/orca-echo-factory-default/1?v=1790603718961"/>
<meta name="twitter:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo、fn1(赤))"/>
<meta name="twitter:image:width" content="1200"/>
<meta name="twitter:image:height" content="630"/>
```

## 2. OGP画像(本番)
| ファイル | 内容 |
|---|---|
| `prod-og-factory-default.png` | og:image(配列ページ・通常レイヤー)。PNG 1200×630 |
| `prod-og-factory-default-1.png` | og:image(レイヤーページ・fn1)。PNG 1200×630 |

```
200 image/png 2.37s  Cache-Control: public, max-age=86400, immutable  X-Vercel-Cache: MISS  /og/k/orca-echo-factory-default?v=1790603718961
200 image/png 0.05s  Cache-Control: public, max-age=86400, immutable  X-Vercel-Cache: HIT   (同じURLの2回目。CDNから返る)
200 image/png 1.05s  Cache-Control: public, max-age=86400, immutable  X-Vercel-Cache: MISS  /og/k/orca-echo-factory-default/1?v=1790603718961
```

## 3. Xでのカードのプレビュー(人間が確認、2026-09-29)
- 人間が本番の配列ページの「Xで共有する」からXの投稿画面を開き、投稿せずにスクリーンショットを撮った。
- `x-card-preview.png`: 投稿画面のダイアログ部分だけを切り出したもの(元のスクリーンショットはタスクバーなど個人の画面が写っていたため、リポジトリには入れない)。
  - 文面の欄に初期値「Orca echo 工場出荷時配列 — Keychron Orca echoの配列を作りました #OrcaEcho #分割キーボード」と本番URLが入っている。
  - その下に、OGP画像(キー配置図・タイトル・機種名)つきのカードのプレビューと「keycap-share.vercel.appから」が表示されている。
