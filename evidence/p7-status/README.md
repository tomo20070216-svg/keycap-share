# P7-12 定期実行の「最後に動いた日時」(実行役、2026-09-30)

## DB(0006)
- 手元の PostgreSQL での確認: `local-migration.md`
- 本番への適用: 人間が Supabase の SQL Editor で実行(「成功しました」)

## 結合テスト(本番と同じ Supabase)
```
定期実行の記録: 最新 {"id":5,"ok":true,"ranAt":"2026-09-30T05:08:02.672Z"} / ブラウザ側の権限での書き込み 42501
keepalive: 合言葉なし 401、合言葉付き 200 {"ok":true,"checkedAt":"2026-09-30T05:08:03.577Z"} → 記録 {"id":6,"ok":true,"ranAt":"2026-09-30T05:08:02.958Z"}
31日前の記録(id 7): 次の書き込みで削除された
テスト後の記録の件数: 0
```
- `/api/keepalive` の処理を、テストの中だけのテスト用の合言葉で直接呼んで確認した(手元の .env.local には CRON_SECRET がないため)。テストが作った記録は最後に削除した。

## /status の表示(開発サーバー)
```
1. 記録なし: 状態=never 最後=記録なし 記録=[] robots=noindex, nofollow
2. 27時間前の記録だけ: 状態=late 最後=2026/09/29 11:07(日本時間) 記録=["2026/09/29 11:07 成功"]
```
- `status-ok.png`: 2時間前・26時間前の記録を一時的に入れたときの表示(「✅ 正常」、最近の記録2件)。確認後に削除し、記録は0件。
- 単体テスト(`cron-status.test.ts`: never / ok / failed / 26時間を超えると late / 日本時間の表示)。`npm test` 19ファイル143件、`tsc`・`eslint`・`npm run build` 成功。

## 本番での確認(評価役、push f578c7f..ba08e59 のあと)
- 反映直後: /status は「記録なし」「まだ一度も動いていません」、robots は noindex, nofollow。/api/keepalive(合言葉なし)は 401。
- 人間が Vercel の Settings → Cron Jobs で /api/keepalive の Run を押したあと: 「最後に動いた日時: 2026/09/30 14:13(日本時間)」「✅ 正常」、最近の記録 2件(どちらも 14:13 成功。Run が2回動いたと考えられる)。
