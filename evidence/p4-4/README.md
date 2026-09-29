# P4-4〜P4-6 共有パネル (2026-09-29、開発サーバーで確認)

部品: `src/components/SharePanel.tsx`(ブラウザで動く部品)。文面・Xの投稿画面のURLは `src/lib/share.ts`(テスト3件)。

## 見た目
- `share-panel-initial.png`: 初期状態。文面の初期値「Orca echo 工場出荷時配列 — Keychron Orca echoの配列を作りました / #OrcaEcho #分割キーボード」(docs/voice.md のテンプレートどおり。URLは投稿画面側で付く)、「Xで共有する」「画像をダウンロード」「画像をコピー」、キャッシュの注意書き。
- `share-panel-after-edit-headless.png`: 確認の途中(文面を書き換えた後。ヘッドレスでフォーカスがないためコピーが失敗した表示)。

## 動作の確認(ヘッドレスChromeを DevTools Protocol で操作。スクリプト: `cdp-share.mjs`・`cdp-copy3.mjs`)
```
X投稿画面のURL: https://x.com/intent/post
  text = "編集した文面のテスト #OrcaEcho" (編集した文面と一致)
  url  = http://localhost:3123/k/orca-echo-factory-default/1
ダウンロード: 完了 [ 'orca-echo-factory-default-1.png' ]   → PNG (1200, 630)
コピー(フォーカスなし): NotAllowedError: Document is not focused.   ← ヘッドレス特有(ページにフォーカスがない)
コピー(フォーカスあり)後の表示: 画像をコピーしました。Xの投稿画面などに貼り付けられます。
クリップボード: image/png 76491バイト 1200x630
非対応のときの表示(ClipboardItem を消して確認): お使いのブラウザは画像のコピーに対応していません。「画像をダウンロード」で保存してからお使いください。
```

## 未確認
- Xの投稿画面が実際に開いた状態のスクリーンショット(Xへのログインが必要)。本番反映後に人間が確認する(P4-7)。
