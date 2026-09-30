# フェーズ8 Cornix への対応の確認(実行役、開発サーバー http://localhost:3123 、2026-09-30)

## 単体テスト
- `src/keyboards/__tests__/cornix.test.ts`: 左右24キーずつ・ダイヤル左右1つずつ・id の重複なし・要素が重ならない(斜めの親指キーも含む)・左右対称・工場出荷時配列が投稿の検証を通る・通常レイヤーとダイヤルの割り当てが出典と一致・QWERTY のおすすめ・ダイヤルの回す操作の文字が左右の内側に出て、左右でぶつからない・対応機種の一覧
- `key-palette.test.ts`: Vial のキーの一覧(Bluetooth・タップダンス・Vial のレイヤーキーがあり、Launcher だけのものはない)
- `layout-page-utils.test.ts`: ?keyboard= の読み取り(不正な値は 404)、一覧のURLに機種を付けて並べ替え・ページ送りでも保つ
- `label-fit.test.ts`: 英単語の途中で分けない(Bluetooth / 1)、開きかっこの前で分ける(レイヤー1 / (押している間))
- Orca echo の表示が変わらないこと: 左右の間隔を自動で広げる処理を入れる前後で、Orca echo の6つのレイヤーの図の大きさ・右手の位置が同じ
- `npm test` 20ファイル163件、`tsc`・`eslint` 成功

## 結合テスト(本番と同じ Supabase)
```
新規保存: slug=cornix-factory-default id=ccb9721b-d5ee-4fe5-aec4-c7f2c1257fc2
Cornix: 4レイヤー / 割り当て94件。絞り込み: Cornix 1件、Orca echo 2件
```

## 画面(開発サーバー)
```
1. 機種を選ぶ画面: /new?keyboard=orca-echo Keychron Orca echo | /new?keyboard=cornix Cornix
2. Cornix の投稿画面: 見出し「配列を投稿する(Cornix)」、キーの一覧の種類「よく使う 日本語入力 英字 数字 記号 編集・移動 ファンクション テンキー マウス メディア レイヤー Bluetooth・接続 マクロ タップダンス」
3. ダイヤルに置く: 操作の選択肢「押す(押し込み) / 右回し / 左回し」
5. Cornix の配列ページ: Cornix 工場出荷時配列(Cornix) | KeyMap Hub、#Cornix の共有文: true
6. 機種で絞り込み(Orca echo): 大西配列 仮 | Orca echo 工場出荷時配列 / 絞り込みのリンク: すべて [Keychron Orca echo] Cornix
```
- 状態コード: /new 200、/new?keyboard=cornix 200、/k/cornix-factory-default 200、/?keyboard=cornix 200、/?keyboard=bogus 404、/og/k/cornix-factory-default 200。
  /new?keyboard=corne は「This page could not be found」の表示(投稿画面は loading.tsx があるため状態コードは 200。以前からの決まり)
- スクリーンショット: `1-chooser.png`、`2-editor-cornix.png`、`3-knob-chooser.png`、`4-editor-cornix-mobile.png`(スマホの幅、左手・右手)、`5-layout-page.png`、`6-filter-orca.png`、`og-cornix.png`(X用の画像)

## 本番の障害と応急処置
- 結合テストで Cornix の機種と工場出荷時配列(一覧に出す)を本番のDBに保存した直後、本番で動いている古いコードが押し込めるダイヤル(`knob`)を読めず、トップ・人気順が 500 になった。
- 応急処置として cornix-factory-default を「一覧に出さない」にし、トップ・人気順・タグの一覧・既存の配列ページがすべて 200 に戻ることを確認した(データは削除していない)。
- push で新しいコードが本番に出たあと、「一覧に出す」に戻す(docs/operations.md 6章)。

## 本番での確認(評価役、push 5480fa0..2cefa03 のあと)
- 新しいコードの反映を確認してから、cornix-factory-default を「一覧に出す」に戻した(`is_listed=true`)。
- トップ・人気順・?keyboard=cornix・?keyboard=orca-echo・タグの一覧・既存の配列ページがすべて 200。トップの説明「今は Keychron Orca echo と Cornix に対応しています。」、カードに「Cornix 工場出荷時配列」(`prod-home.png`)。
- 上の画面の確認 1〜6 を本番でも行い、同じ結果。結合テスト(Cornix)も本番のDBで成功。
- 気づいた点: 一覧の小さなカードでは、親指キーの「レイヤー1(押している間)」のような長い名前が、下の行で切れて見える。
