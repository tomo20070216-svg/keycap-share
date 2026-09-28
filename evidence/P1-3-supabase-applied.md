# P1-3 Supabaseへの適用確認 (2026-09-28)

## 適用
- 人間が Supabase ダッシュボードの SQL Editor で `supabase/migrations/0001_init.sql` を実行。
- 結果: `Success. No rows returned`

## 公開用キー(ブラウザと同じ権限)での確認
`@supabase/supabase-js` で `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を使って各テーブルにアクセスした結果:

```
read keyboards: OK (0件)
read layouts: OK (0件)
read layers: OK (0件)
read assignments: OK (0件)
read tags: OK (0件)
read layout_tags: OK (0件)
read layout_secrets: ERROR 42501 permission denied for table layout_secrets
insert tags: ERROR 42501 permission denied for table tags
```

- 公開テーブル6つはすべて存在し、読み取れる。
- 秘密キーのハッシュを保存する `layout_secrets` は読めない。
- ブラウザ側からの書き込みは拒否される。
