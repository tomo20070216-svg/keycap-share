# P6-1 0004 のSupabaseへの適用確認 (2026-09-29)

- 人間の承認を得て、人間が SQL Editor で `0004_edit_ratelimit_reports.sql` を実行し、成功。
- 適用後、データを変えずに権限を確認した(公開用キー = ブラウザと同じ権限 / secret key = サーバー側):

```
公開用キー: replace_layout_content → ERROR 42501 permission denied for function replace_layout_content
公開用キー: delete_layout_with_secret → ERROR 42501 permission denied for function delete_layout_with_secret
公開用キー: submission_events を読む → ERROR 42501 permission denied for table submission_events
公開用キー: reports を読む → ERROR 42501 permission denied for table reports
サーバー: 違う秘密キーで delete_layout_with_secret → OK false
サーバー: 違う秘密キーで replace_layout_content → ERROR P0001 invalid_edit_secret
工場出荷時配列のタイトル(変わっていないこと): Orca echo 工場出荷時配列
```
