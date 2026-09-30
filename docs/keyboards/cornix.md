# docs/keyboards/cornix.md — Cornix(Jezail Funder)の情報

調べた日: 2026-09-30(人間の許可を得て、インターネットの公開情報を調べた。人間は実物を持っていない)。

## 概要

- 市販の完成品の分割キーボード。左右とも無線(Bluetooth)の薄型(ロープロファイル)。Cornix LP とも呼ばれる。
- キー: 片手24キー(合計48)。3段×6列の縦ずらし(Corne と同じ並び)+ 外側の下に3つ + 親指3つ(弧を描いて並ぶ)。
- ダイヤル: 左右に1つずつ。押し込める(押し込みも1つのキーとして割り当てられる)。
- キーマップを変えるツール: **Vial**(公式のファームウェアは RMK で、Vial に対応)。

## キーの位置(`src/keyboards/cornix.ts`)

- 公式の定義ファイルは公開されていない。
- 有志が公開している Cornix 用 RMK ファームウェアの Vial 定義(`vial.json` の KLE 形式の配置)から作った。
  次の3つで、キーの位置はすべて一致していた(違うのは表示の書き方だけ)。
  - https://github.com/adong660/rmk-cornix (「公式のファームウェアとだいたい同じ Vial の配置」と説明あり)
  - https://github.com/ryotan/rmk-cornix
  - https://github.com/cffnpwr/cornix-prospector-rmk
- Vial のマトリクスの (2,6)・(5,6) がダイヤルの押し込み(https://github.com/oklahomer/cornix-keymap の説明「an encoder whose shaft doubles as a push-button」)。ダイヤルはこの位置に置いた。
- Vial の画面に表示するための配置なので、実物と少し違う可能性がある。実物での確認が取れるまで「仮の値」(`isProvisional: true`)。
- 作り方: `docs/keyboards/cornix-gen.py`(KLE の回転を含めた中心を求めて、左上の位置に直す)。

## 工場出荷時配列(`src/keyboards/cornix-factory-default.ts`)

- 出典: Cornix を持っている人が工場出荷時の状態を Vial で書き出して公開しているファイル
  (https://github.com/oklahomer/cornix-keymap の `vendor/cornix-default-keymap.vil`。「the untouched factory export」と説明あり)。
- レイヤー0 通常(QWERTY)、1(数字・Esc・Delete・記号)、2・3(Bluetooth の接続先1〜3の切り替え)。レイヤー4 以降は空。
- `USER00`〜`USER02` は RMK の Bluetooth の接続先の切り替え(User0〜 = BT0〜。https://rmk.rs/docs/features/wireless)。表示名は「Bluetooth 1〜3」。
- ダイヤル: 左は回すと音量・押すとミュート、右は回すとスクロール・押すと中クリック(全レイヤー共通)。

## その他の出典

- レビュー: https://kbd.news/Cornix-review-2715.html 、https://green-keys.info/en/cornix-review%EF%BD%9C40-low-profile-mechanical-keyboard-with-full-wireless-support/
- 説明書(Vial で設定できること): https://pandakb.com/guides/cornix-wireless-split-ergonomic-keyboard-user-manual/
