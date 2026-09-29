# P4-3 メタタグ (2026-09-29、開発サーバーで確認。本番での確認は P4-7)

JavaScriptなしで取得したHTMLの <head> から、OGP・Xカード関連のタグを抜き出したもの。
手元では metadataBase が http://localhost:3123。本番では https://keycap-share.vercel.app になる(src/lib/site.ts の getSiteUrl、テスト3件)。

## /k/orca-echo-factory-default
```html
<meta name="description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<link rel="canonical" href="http://localhost:3123/k/orca-echo-factory-default"/>
<meta property="og:title" content="Orca echo 工場出荷時配列(Keychron Orca echo)"/>
<meta property="og:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta property="og:url" content="http://localhost:3123/k/orca-echo-factory-default"/>
<meta property="og:site_name" content="keycap-share"/>
<meta property="og:locale" content="ja_JP"/>
<meta property="og:image" content="http://localhost:3123/og/k/orca-echo-factory-default?v=1790603718961"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo)"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Orca echo 工場出荷時配列(Keychron Orca echo)"/>
<meta name="twitter:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta name="twitter:image" content="http://localhost:3123/og/k/orca-echo-factory-default?v=1790603718961"/>
<meta name="twitter:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo)"/>
<meta name="twitter:image:width" content="1200"/>
<meta name="twitter:image:height" content="630"/>
```

## /k/orca-echo-factory-default/1
```html
<meta name="description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<link rel="canonical" href="http://localhost:3123/k/orca-echo-factory-default/1"/>
<meta property="og:title" content="Orca echo 工場出荷時配列 — fn1(赤)(Keychron Orca echo)"/>
<meta property="og:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta property="og:url" content="http://localhost:3123/k/orca-echo-factory-default/1"/>
<meta property="og:site_name" content="keycap-share"/>
<meta property="og:locale" content="ja_JP"/>
<meta property="og:image" content="http://localhost:3123/og/k/orca-echo-factory-default/1?v=1790603718961"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo、fn1(赤))"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Orca echo 工場出荷時配列 — fn1(赤)(Keychron Orca echo)"/>
<meta name="twitter:description" content="Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。"/>
<meta name="twitter:image" content="http://localhost:3123/og/k/orca-echo-factory-default/1?v=1790603718961"/>
<meta name="twitter:image:alt" content="Orca echo 工場出荷時配列 のキー配置図(Keychron Orca echo、fn1(赤))"/>
<meta name="twitter:image:width" content="1200"/>
<meta name="twitter:image:height" content="630"/>
```

## og:image のURLを開いた結果
```
200 image/png cache-control: public, max-age=86400, s-maxage=31536000, immutable  /og/k/orca-echo-factory-default?v=1790603718961
200 image/png cache-control: public, max-age=86400, s-maxage=31536000, immutable  /og/k/orca-echo-factory-default/1?v=1790603718961
200 image/png cache-control: public, max-age=0, s-maxage=60  /og/k/orca-echo-factory-default?v=123   (古い・違う版は短いキャッシュ)
```
