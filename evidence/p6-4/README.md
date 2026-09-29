# P6-4 投稿数の制限と簡易的な不正検知 (2026-09-29)

- 判断: `src/lib/spam-rules.ts`(純粋な関数。テスト `spam-rules.test.ts`)。DBの読み書き: `src/lib/rate-limit.ts`(submission_events)。
- 新規投稿のとき、同じ接続元から1時間に5件・1日に20件まで。同じ内容を10分以内に続けて投稿すると拒否(別の接続元からでも)。
- 説明文にURLが3つ以上ある投稿は拒否(新規・編集とも。validateSubmission)。
- 接続元のIPアドレスはそのまま保存せず、サーバーだけが持つ salt(secret key から作る)を混ぜた SHA-256 にして保存。DBの制約でも64桁の16進数以外は保存できない(0004)。

## 単体テスト(npm test: 15ファイル112件成功)の該当部分
- URLの数・説明文のURL上限・投稿の検証での拒否 / 1時間5件・1日20件・同じ内容の連投の判断 / エラー文に次の行動と下書きが残っている旨 / 同じ内容のハッシュ / IPアドレスのハッシュ(IPを含まない、salt で変わる)

## 結合テスト(npm run test:integration: 17件成功)
```
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > Orca echo の物理レイアウトを登録し、公開用キーで取得できる 988ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する 72ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 公開用キーでは存在しないslugは null になる 300ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する 83ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > 工場出荷時配列(コンボ・マクロなし)は空の一覧で取得される 44ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > キー以外を含むコンボは保存前に拒否され、DBに何も残らない 75ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない 55ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 新しい順に並ぶ 43ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > ページ分け: 1ページ1件にすると、総数は変わらず1件ずつ返る 122ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 件数を大きく超えたページを指定しても、エラーにならず空の一覧と総数が返る 277ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > URLを直接開けば、一覧に出さない配列も取得できる 38ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > タグで絞り込むと、そのタグが付いた一覧に出す配列だけが返る。タグの一覧は絞り込まれない 241ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > エディタからの投稿の保存(Supabase、P5-1) > 正しい入力は一覧に出さないテスト投稿として保存され、秘密キーはハッシュだけがDBに残る 399ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > エディタからの投稿の保存(Supabase、P5-1) > 不正な入力はDBに何も書かずにエラーを返す 28ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 編集・削除(Supabase、P6-2)— 2つの異なる秘密キー > 自分の秘密キーでは編集・削除でき、他人の秘密キーではできない 1014ms
6件目: 短い時間に投稿が続いたため、いったん受け付けを止めています。1時間ほど時間をおいてから、もう一度投稿してください。入力内容はこのブラウザに下書きとして残っています。
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 投稿数の制限(Supabase、P6-4) > 同じ接続元から1時間に5件を超えると拒否される。IPアドレスはハッシュでだけ記録される 618ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 投稿数の制限(Supabase、P6-4) > 同じ内容を10分以内に続けて投稿すると、別の接続元からでも拒否される 129ms
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

テスト後、submission_events は0件(テストが作った架空の接続元の記録は最後に削除)。
