# P3-5 一覧ページ(新着順)(2026-09-29)

## 0003 の適用
- 人間の承認を得て、人間が Supabase の SQL Editor で `supabase/migrations/0003_layouts_is_listed.sql` を実行し、成功。

## 結合テスト(`npm run test:integration`)
```
 RUN  v5.0.2 C:/Users/tomo2/OneDrive/Desktop/エンジニアリング/keycap-share

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > Orca echo の物理レイアウトを登録し、公開用キーで取得できる 310ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する
保存済みの配列を使用: slug=orca-echo-factory-default id=4e908a31-d157-449d-9f57-a25f52ad0bd3
取得: 3レイヤー / 割り当て76件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する 48ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 公開用キーでは存在しないslugは null になる 35ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する
保存済みの配列を使用: slug=orca-echo-combo-sample id=599f1200-8e04-44e1-850f-e4238d01d8c5
取得: コンボ3件(R-1-2+R-1-3→左クリック, R-1-3+R-1-4→右クリック, R-1-2+R-1-4→ホイールクリック) / マクロ1件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する 75ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > 工場出荷時配列(コンボ・マクロなし)は空の一覧で取得される 36ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない
一覧: 1件 (orca-echo-factory-default)

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > キー以外を含むコンボは保存前に拒否され、DBに何も残らない 92ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない 34ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 新しい順に並ぶ 30ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > ページ分け: 1ページ1件にすると、総数は変わらず1件ずつ返る 95ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > 件数を大きく超えたページを指定しても、エラーにならず空の一覧と総数が返る 261ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > URLを直接開けば、一覧に出さない配列も取得できる 29ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の一覧(Supabase、0003適用後) > タグで絞り込むと、そのタグが付いた一覧に出す配列だけが返る。タグの一覧は絞り込まれない 195ms

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  08:08:32
   Duration  1.60s (tests 84%, import 9%, transform 6%)

```

## ページの確認(開発サーバー)
- `/` 200、`/?page=1` 200、`/?page=2`・`/?page=100`・`/?page=abc` 404、`/k/orca-echo-combo-sample` 200(一覧には出ないが、URLを直接開けば見られる)。
- スクリーンショット: `home-desktop.png`(幅1100px)、`home-mobile-390.png`(幅390pxのiframe)。一覧は工場出荷時配列の1件だけ。

## 作業中に見つけて直した不具合
- 件数を超えたページ(`/?page=2`)が500になった。Supabase(PostgREST)は範囲外の指定を「Requested range not satisfiable」(PGRST103)のエラーで返すため。空の一覧と総数を返すように直し、テストを追加した。最初のテストは「1件の次の1件目」という境目だけを試していて見逃していた。

## 限界
- 一覧に出る配列が現在1件のため、「新しい順」「ページ送り」の表示は実データでは確認できていない(テストの並び順の確認は自明に通る)。配列が増えるフェーズ5で改めて確認する。
