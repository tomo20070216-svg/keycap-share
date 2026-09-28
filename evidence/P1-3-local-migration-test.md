# P1-3 ローカル検証ログ (2026-09-28, PostgreSQL 17.6 一時DB。Supabaseのanon/authenticatedロールを模擬)

## テストSQL
```sql
\set ON_ERROR_STOP 0
insert into keyboards(id,name,elements) values ('orca-echo','Orca echo','[]');
insert into layouts(id,slug,keyboard_id,title) values ('00000000-0000-0000-0000-000000000001','abc123','orca-echo','t');
insert into layout_secrets values ('00000000-0000-0000-0000-000000000001', repeat('a',64));
insert into layers(id,layout_id,layer_number,layer_name) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000001',0,'通常');
insert into assignments(layer_id,element_id,action,label) values ('00000000-0000-0000-0000-0000000000a1','L-R1C1','press','Esc');
\echo '--- 不正action (失敗すべき)'
insert into assignments(layer_id,element_id,action,label) values ('00000000-0000-0000-0000-0000000000a1','L-R1C1','bogus','x');
\echo '--- 平文キー (失敗すべき)'
insert into layout_secrets values ('00000000-0000-0000-0000-000000000001','plaintext');
set role anon;
\echo '--- anon: layouts 読める'
select count(*) from layouts;
\echo '--- anon: layout_secrets (失敗すべき)'
select * from layout_secrets;
\echo '--- anon: insert (失敗すべき)'
insert into tags(name) values ('x');
\echo '--- anon: update (0件になるべき/失敗)'
update layouts set title='hack';
reset role;
\echo '--- updated_at トリガー'
select created_at < updated_at as updated from (select created_at, updated_at from layouts) s;
update layouts set title='t2'; select created_at < updated_at as updated from layouts;
\echo '--- カスケード削除'
delete from layouts; select (select count(*) from layers) layers,(select count(*) from assignments) asg,(select count(*) from layout_secrets) sec;
```

## 結果
```
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
--- 不正action (失敗すべき)
test.sql:8: ERROR:  リレーション"assignments"の新しい行は検査制約"assignments_action_check"に違反しています
DETAIL:  失敗した行は(dd09b1da-024c-40be-a5fb-fc62a1c0ea86, 00000000-0000-0000-0000-0000000000a1, L-R1C1, bogus, x)を含みます
--- 平文キー (失敗すべき)
test.sql:10: ERROR:  リレーション"layout_secrets"の新しい行は検査制約"layout_secrets_edit_secret_hash_check"に違反しています
DETAIL:  失敗した行は(00000000-0000-0000-0000-000000000001, plaintext, 2026-09-28 22:38:56.629593+09)を含みます
SET
--- anon: layouts 読める
 count 
-------
     1
(1 行)

--- anon: layout_secrets (失敗すべき)
test.sql:15: ERROR:  テーブル layout_secrets へのアクセスが拒否されました
--- anon: insert (失敗すべき)
test.sql:17: ERROR:  テーブル tags へのアクセスが拒否されました
--- anon: update (0件になるべき/失敗)
test.sql:19: ERROR:  テーブル layouts へのアクセスが拒否されました
RESET
--- updated_at トリガー
 updated 
---------
 f
(1 行)

UPDATE 1
 updated 
---------
 t
(1 行)

--- カスケード削除
DELETE 1
 layers | asg | sec 
--------+-----+-----
      0 |   0 |   0
(1 行)

```
