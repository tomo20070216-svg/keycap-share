# P6-6 Supabaseの自動停止対策 (2026-09-29)

- `vercel.json` の crons で、毎日1回(03:00 UTC、Hobbyプランでは指定した時間帯のどこかで実行)`/api/keepalive` を呼ぶ。
- `/api/keepalive`(`src/app/api/keepalive/route.ts`)は、公開用キーで keyboards を1件読むだけの軽いアクセス。`CRON_SECRET` の合言葉(Authorization: Bearer)がない呼び出しは401。
- 仕様の出典: https://vercel.com/docs/cron-jobs/manage-cron-jobs(確認日 2026-09-29): CRON_SECRET は Authorization ヘッダーで送られる / Hobby は1日1回まで、指定した時間帯のどこかで実行 / 失敗しても再試行しない。

## 手元での確認(本番と同じビルドを CRON_SECRET=テスト用の値 で起動)
```
合言葉なし:
Unauthorized  �� HTTP 401
違う合言葉:
Unauthorized  �� HTTP 401
正しい合言葉(Vercelの定期実行と同じ形):
{"ok":true,"checkedAt":"2026-09-29T07:16:48.817Z"}  �� HTTP 200
```

単体テスト `cron-auth.test.ts` 3件成功(合言葉なし・違う合言葉・Bearer なし・CRON_SECRET 未設定は受け付けない)。

## 本番で必要なこと
- Vercel の環境変数 `CRON_SECRET`(16文字以上のランダムな文字列)を Production に設定する(人間)。設定後のデプロイから有効。
