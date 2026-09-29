# P6-2 編集・削除の処理(サーバー側)の確認 (2026-09-29)

`src/lib/layout-edit.ts`(checkEditSecret・updateLayoutWithSecret・deleteLayoutWithSecret)。DBの関数(0004)を secret key で呼ぶ。
結合テストでは2つの異なる秘密キーで2件のテスト投稿(一覧に出さない)を作り、テストの最後に自動で削除した(人間の許可)。

## 結合テスト(npm run test:integration)
```
 RUN  v5.0.2 C:/Users/tomo2/OneDrive/Desktop/エンジニアリング/keycap-share

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > Orca echo の物理レイアウトを登録し、公開用キーで取得できる 502ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する
保存済みの配列を使用: slug=orca-echo-factory-default id=4e908a31-d157-449d-9f57-a25f52ad0bd3
取得: 3レイヤー / 割り当て76件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する 76ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 公開用キーでは存在しないslugは null になる 51ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する
保存済みの配列を使用: slug=orca-echo-combo-sample id=599f1200-8e04-44e1-850f-e4238d01d8c5
取得: コンボ3件(R-1-2+R-1-3→左クリック, R-1-3+R-1-4→右クリック, R-1-2+R-1-4→ホイールクリック) / マクロ1件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する 155ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > 工場出荷時配列(コンボ・マクロなし)は空の一覧で取得される 33ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > キー以外を含むコンボは保存前に拒否され、DBに何も残らない 66ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない
一覧: 2件 (Iywp3BUpM-g, orca-echo-factory-default)

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない 44ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 新しい順に並ぶ 39ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > ページ分け: 1ページ1件にすると、総数は変わらず1件ずつ返る 93ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 件数を大きく超えたページを指定しても、エラーにならず空の一覧と総数が返る 305ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > URLを直接開けば、一覧に出さない配列も取得できる 40ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > タグで絞り込むと、そのタグが付いた一覧に出す配列だけが返る。タグの一覧は絞り込まれない 309ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > エディタからの投稿の保存(Supabase、P5-1) > 正しい入力は一覧に出さないテスト投稿として保存され、秘密キーはハッシュだけがDBに残る
新規保存: slug=iU7-FKTKVrE(一覧に出さない。テストの最後に削除する)

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > エディタからの投稿の保存(Supabase、P5-1) > 正しい入力は一覧に出さないテスト投稿として保存され、秘密キーはハッシュだけがDBに残る 457ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > エディタからの投稿の保存(Supabase、P5-1) > 不正な入力はDBに何も書かずにエラーを返す 34ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない
テスト投稿: A=OVp66_gXQbw B=b93_wDiospM

stdout | src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない
A を A のキーで編集: OK(OGP画像の版 1790664999965 → 1790665000753)

stdout | src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない
A を B のキーで編集・削除: 拒否され、A は変わらない

stdout | src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない
B を B のキーで削除: OK

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない 1152ms

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  15:56:37
   Duration  4.01s (tests 92%, import 4%, transform 3%)

```

## テスト後にDBに残っている配列
```
DBに残っている配列: [{"slug":"orca-echo-factory-default","is_listed":true},{"slug":"orca-echo-combo-sample","is_listed":false},{"slug":"Iywp3BUpM-g","is_listed":true}]
```
