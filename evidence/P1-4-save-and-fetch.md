# P1-4 配列の保存・取得の確認 (2026-09-28)

## 方法
- `npm run test:integration`(`src/lib/__tests__/layout-repository.integration.test.ts`)
- 書き込みはサーバー専用クライアント(secret key)、読み取りは公開用クライアント(anon key = ブラウザと同じ権限)で行う。
- 工場出荷時配列は「最初の1件」としてDBに残す方針(人間の判断)。固定slug `orca-echo-factory-default` で保存し、2回目以降は保存済みのものを取得して検証する。

## 1回目の実行(新規保存)
- 22:55:17 JST の実行で新規保存し、3件のテストすべてに合格した(このときのログは画面出力を末尾だけ表示していたため残っていない)。
- 新規保存の分岐では「layout_secrets のハッシュ = 発行した秘密キーのSHA-256」かつ「ハッシュ ≠ 平文」も検証している。
- DB側の記録(secret keyで確認。ハッシュ値は表示していない):

```
layouts: [{"id":"4e908a31-d157-449d-9f57-a25f52ad0bd3","slug":"orca-echo-factory-default","title":"Orca echo 工場出荷時配列","created_at":"2026-09-28T13:55:18.961424+00:00"}]
layout_secrets: 4e908a31-d157-449d-9f57-a25f52ad0bd3 hash形式OK = true (値は非表示)
keyboards: 1件
layers: 3件
assignments: 76件
tags: 1件
layout_tags: 1件
```

## 2回目以降の実行(保存済みの配列を取得して元データと比較)
```
 RUN  v5.0.2 C:/Users/tomo2/OneDrive/Desktop/エンジニアリング/keycap-share

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > Orca echo の物理レイアウトを登録し、公開用キーで取得できる 350ms
stdout | src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する
保存済みの配列を使用: slug=orca-echo-factory-default id=4e908a31-d157-449d-9f57-a25f52ad0bd3
取得: 3レイヤー / 割り当て76件

 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する 55ms
 ✓ src/lib/__tests__/layout-repository.integration.test.ts > 配列の保存・取得(Supabase) > 公開用キーでは存在しないslugは null になる 48ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  22:56:57
   Duration  811ms (tests 66%, import 21%, transform 11%, setup 1%, worker 1%)

```

## 補足
- 元データ `src/keyboards/orca-echo-factory-default.ts` の割り当ては76件(`grep -c "elementId:"` で確認)。取得結果も76件で、並び順を揃えたうえで完全一致した。
- 以前の progress.md のエントリにある「63件」は数え間違い。正しくは76件。
