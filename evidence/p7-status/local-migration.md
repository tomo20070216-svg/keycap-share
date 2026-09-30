# P7-12 0006_cron_runs.sql の手元での確認(PostgreSQL 17、0001〜0006 を新しいDBに適用、2026-09-30)

```
--- 1. サーバー側(postgres)は書き込める
INSERT 0 1
INSERT 0 1
    job    | ok | recent 
-----------+----+--------
 keepalive | t  | t
 keepalive | f  | f
(2 �s)
--- 2. 知らない種類は入らない(失敗すべき)
test6.sql:7: ERROR:  リレーション"cron_runs"の新しい行は検査制約"cron_runs_job_check"に違反しています
DETAIL:  失敗した行は(3, other, t, 2026-09-30 14:02:40.858342+09)を含みます
--- 3. 30日より古い記録を消す
DELETE 1
 left_rows 
-----------
         1
(1 �s)
--- 4. ブラウザ側の権限: 読めるが、書き込み・削除はできない(2つとも失敗すべき)
SET
    job    | ok 
-----------+----
 keepalive | t
(1 �s)
test6.sql:14: ERROR:  テーブル cron_runs へのアクセスが拒否されました
test6.sql:15: ERROR:  テーブル cron_runs へのアクセスが拒否されました
RESET
 still_rows 
------------
          1
(1 �s)
```

テストのSQL:

```sql
\set ON_ERROR_STOP 0
\echo '--- 1. サーバー側(postgres)は書き込める'
insert into cron_runs (job, ok) values ('keepalive', true);
insert into cron_runs (job, ok, ran_at) values ('keepalive', false, now() - interval '31 days');
select job, ok, ran_at > now() - interval '1 minute' as recent from cron_runs order by ran_at desc;
\echo '--- 2. 知らない種類は入らない(失敗すべき)'
insert into cron_runs (job, ok) values ('other', true);
\echo '--- 3. 30日より古い記録を消す'
delete from cron_runs where ran_at < now() - interval '30 days';
select count(*) as left_rows from cron_runs;
\echo '--- 4. ブラウザ側の権限: 読めるが、書き込み・削除はできない(2つとも失敗すべき)'
set role anon;
select job, ok from cron_runs;
insert into cron_runs (job, ok) values ('keepalive', true);
delete from cron_runs;
reset role;
select count(*) as still_rows from cron_runs;
```
