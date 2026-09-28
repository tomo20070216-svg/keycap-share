# P3-5 0003 のローカル検証ログ (2026-09-29, PostgreSQL 17.6 一時DB。0001・0002適用済み・データありの状態に0003を適用)

## テストSQL
```sql
\set ON_ERROR_STOP 0
insert into keyboards(id,name,elements) values ('orca-echo','Orca echo','[]');
insert into layouts(slug,keyboard_id,title) values ('orca-echo-factory-default','orca-echo','工場出荷時'),('orca-echo-combo-sample','orca-echo','コンボのサンプル');
\echo '--- 0003 を適用'
\i 0003.sql
select slug, is_listed from layouts order by slug;
\echo '--- 新しい配列は初期値で一覧に出る'
insert into layouts(slug,keyboard_id,title) values ('newlayout1','orca-echo','新規');
select slug, is_listed from layouts where slug='newlayout1';
set role anon;
\echo '--- anon: is_listed 列を読める'
select slug, is_listed from layouts where is_listed order by created_at desc;
\echo '--- anon: is_listed を書き換えられない (失敗すべき)'
update layouts set is_listed = true where slug = 'orca-echo-combo-sample';
reset role;
select slug, is_listed from layouts where slug='orca-echo-combo-sample';
```

## 結果
```
INSERT 0 1
INSERT 0 2
--- 0003 を適用
ALTER TABLE
CREATE INDEX
UPDATE 1
           slug            | is_listed 
---------------------------+-----------
 orca-echo-combo-sample    | f
 orca-echo-factory-default | t
(2 行)

--- 新しい配列は初期値で一覧に出る
INSERT 0 1
    slug    | is_listed 
------------+-----------
 newlayout1 | t
(1 行)

SET
--- anon: is_listed 列を読める
           slug            | is_listed 
---------------------------+-----------
 newlayout1                | t
 orca-echo-factory-default | t
(2 行)

--- anon: is_listed を書き換えられない (失敗すべき)
test3.sql:14: ERROR:  テーブル layouts へのアクセスが拒否されました
RESET
          slug          | is_listed 
------------------------+-----------
 orca-echo-combo-sample | f
(1 行)

```
