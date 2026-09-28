# P2-5 Supabaseへの適用と保存・取得の確認 (2026-09-29)

## 適用
- 人間の承認を得て、人間が Supabase の SQL Editor で `supabase/migrations/0002_combos_macros.sql` を実行し、成功。

## 結合テスト(`npm run test:integration`、1回目 = コンボのサンプル配列を新規保存した実行)
```
 RUN  v5.0.2 C:/Users/tomo2/OneDrive/Desktop/エンジニアリング/keycap-share

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > Orca echo の物理レイアウトを登録し、公開用キーで取得できる 872ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する
保存済みの配列を使用: slug=orca-echo-factory-default id=4e908a31-d157-449d-9f57-a25f52ad0bd3
取得: 3レイヤー / 割り当て76件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する 96ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 公開用キーでは存在しないslugは null になる 55ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する
新規保存: slug=orca-echo-combo-sample id=599f1200-8e04-44e1-850f-e4238d01d8c5
取得: コンボ3件(R-1-2+R-1-3→左クリック, R-1-3+R-1-4→右クリック, R-1-2+R-1-4→ホイールクリック) / マクロ1件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する 777ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > 工場出荷時配列(コンボ・マクロなし)は空の一覧で取得される 32ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > コンボ・マクロの保存・取得(Supabase) > キー以外を含むコンボは保存前に拒否され、DBに何も残らない 55ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  06:24:58
   Duration  2.26s (tests 89%, import 7%, transform 4%)

```

## 公開用キー(ブラウザと同じ権限)での確認
```
read combos: OK (3件)
read macros: OK (1件)
insert combos: ERROR 42501 permission denied for table combos
```
