# P2-1 技術検証: OGP画像の仕組み(ImageResponse/Satori)でキー図の文字を描けるか (2026-09-28)

検証スクリプト: `evidence/p2-1/verify.mjs`(プロジェクト直下で `node evidence/p2-1/verify.mjs` を実行)。next 16.3.6 の `next/og` の `ImageResponse` を使用し、フォントは `public/fonts/NotoSansJP-Bold.ttf`。

| 方式 | 結果 |
|---|---|
| A: SVGの `<text>` で文字を描く | **失敗**。PNGは生成されず、次のエラーになる: `<text> nodes are not currently supported, please convert them to <path>` |
| B: SVGで図形を描き、文字はHTML(div)を絶対配置で重ねる | **成功**。`B-svg-plus-html.png`。日本語(変換・左クリック)・タップ/長押しの2段表示とも正しく描画 |
| C: Bの方式で傾いたキー(20度) | **成功**。`C-rotated-key.png`。SVGは `transform="rotate(...)"`、文字のdivは CSS `transform: rotate(...deg)` |

## 結論
方式B(SVGの図形 + HTMLの文字を重ねる)を採用する。

## 気づいた点
- 「左クリック」(5文字、18px)でキー幅ほぼいっぱいになる。長い表示名は文字を自動で小さくする処理が必要(P2-3で対応)。
