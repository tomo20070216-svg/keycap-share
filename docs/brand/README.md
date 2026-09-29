# docs/brand — サイトのアイコン

- `keymap-hub-icon-original.png`: 人間が作ったアイコンの元の画像(2026-09-29、1254×1254、白い余白つき)。
- サイトで使うアイコンは、元の画像から `make_icons.py` で作る(Pillow を使う。サイトの依存パッケージではない)。
  - `src/app/icon.png`(512×512、角は透明): ブラウザのタブなど
  - `src/app/favicon.ico`(16・32・48): 古いブラウザ向けのタブのアイコン
  - `src/app/apple-icon.png`(180×180、透明なし。角は濃い青で埋める): iPhone のホーム画面
- 作り直すとき: リポジトリの一番上で `python docs/brand/make_icons.py docs/brand/keymap-hub-icon-original.png <作業用フォルダ>`
