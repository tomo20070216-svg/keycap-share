# P5-8 フェーズ5の確認(評価役、本番 https://keycap-share.vercel.app/ 、2026-09-29)

`evals/acceptance.md` フェーズ5の確認方法: 新規作成フォームから、機種・タイトル・基本レイヤーの割り当て・説明文を入力し、共有URLが発行されるまでの一連の操作を実際に行う。

## 人間による操作(本番)
- 人間が本番の `/new` で、実際に使う配列「大西配列の基準」を入力して保存した(サイトで最初の本物の投稿)。
- 1回目の保存は「保存に失敗しました」になった。人間が Vercel の環境変数 `SUPABASE_SECRET_KEY` を Production・Preview に設定し、次のデプロイ(4f8418d)の後に保存して成功した。
- 発行された共有URL: https://keycap-share.vercel.app/k/Iywp3BUpM-g(編集用URLは人間だけが保管。記録には残さない)

| ファイル | 内容 |
|---|---|
| `p5-8-before-save.png` | 保存する直前の画面(説明文・タグを入力済み)。人間のスクリーンショットからページ部分だけを切り出したもの |
| `p5-8-saved.png` | 保存後の画面(共有URL)。**編集用URL(秘密キー)は塗りつぶしている**。ページ部分だけを切り出したもの。元の画像は削除した |
| `prod-home.png` | 本番の一覧。「大西配列の基準」(2026/09/29)が「Orca echo 工場出荷時配列」(2026/09/28)より上 = 新しい順 |
| `prod-layout.png` | 本番の配列ページ |
| `prod-og.png` | 本番のOGP画像(1200×630。タイトル・機種名・投稿者名 detty・キー配置図) |

## 本番で確認したこと
```
一覧の並び(上から): ['Iywp3BUpM-g', 'orca-echo-factory-default']   ← 新しい順(フェーズ3で残っていた確認)
200 /k/Iywp3BUpM-g
200 /k/Iywp3BUpM-g/0
<meta property="og:title" content="大西配列の基準(Keychron Orca echo)"/>
<meta property="og:image" content="https://keycap-share.vercel.app/og/k/Iywp3BUpM-g?v=1790663815526"/>
<meta name="twitter:card" content="summary_large_image"/>
```

## 見つかった小さな問題(後で直す)
- 一覧の小さなカードのキー図で、「BackSpace」のような長い表示名がキーからはみ出して切れる(配列ページ・OGP画像では2行に分かれて問題ない)。
