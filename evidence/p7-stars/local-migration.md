# P7-5 0005_stars.sql の手元での確認(PostgreSQL 17、0001〜0005 を新しいDBに適用、2026-09-29)

```
INSERT 0 1
INSERT 0 2
----------
 
(1 �s)
SELECT 2
--- 1. 星を付ける: 1、同じ接続元の2回目: 1 のまま、別の接続元: 2
 first | again 
-------+-------
     1 |     1
(1 �s)
 other 
-------
     2
(1 �s)
--- 2. 外す: 1、外していない接続元が外しても変わらない: 1
 off | off_none 
-----+----------
   1 |        1
(1 �s)
--- 3. 星では更新日時が変わらない(false が正しい)
    slug     | star_count | changed 
-------------+------------+---------
 aaaaaaaaaaa |          1 | f
 bbbbbbbbbbb |          0 | f
(2 �s)
--- 4. 内容を変えたら更新日時は変わる(true が正しい)
UPDATE 1
    slug     | changed 
-------------+---------
 bbbbbbbbbbb | t
(1 �s)
--- 5. 存在しない配列: null
 is_null 
---------
 t
(1 �s)
--- 6. IPアドレスそのものは保存できない(失敗すべき)
test5.sql:19: ERROR:  リレーション"stars"の新しい行は検査制約"stars_ip_hash_check"に違反しています
DETAIL:  失敗した行は(00000000-0000-0000-0000-000000000001, 203.0.113.5, 2026-09-29 17:45:25.36669+09)を含みます
CONTEXT:  SQL文 "insert into public.stars (layout_id, ip_hash) values (v_layout_id, p_ip_hash)
    on conflict (layout_id, ip_hash) do nothing"
PL/pgSQL関数public.set_star(text,text,boolean)の11行目 - SQL ステートメント
--- 7. 人気順
 set_star | set_star 
----------+----------
        1 |        2
(1 �s)
    slug     | star_count 
-------------+------------
 bbbbbbbbbbb |          2
 aaaaaaaaaaa |          1
(2 �s)
--- 8. 記録の種類 star は入る、ほかは入らない(2つ目は失敗すべき)
INSERT 0 1
test5.sql:25: ERROR:  リレーション"submission_events"の新しい行は検査制約"submission_events_kind_check"に違反しています
DETAIL:  失敗した行は(22f220cf-32cb-4cfe-a3e4-100797df3ef6, like, 1111111111111111111111111111111111111111111111111111111111111111, null, 2026-09-29 17:45:25.377279+09)を含みます
--- 9. ブラウザ側の権限: 星の表は読めない・関数は使えない(失敗すべき)、star_count は読める
SET
test5.sql:28: ERROR:  テーブル stars へのアクセスが拒否されました
test5.sql:29: ERROR:  関数 set_star へのアクセスが拒否されました
    slug     | star_count 
-------------+------------
 aaaaaaaaaaa |          1
 bbbbbbbbbbb |          2
(2 �s)
RESET
--- 10. 配列を削除すると星も消える
DELETE 1
 stars_left_for_bbb 
--------------------
                  0
(1 �s)
```

テストのSQL:

```sql
\set ON_ERROR_STOP 0
insert into keyboards(id,name,elements) values ('orca-echo','Orca echo','[]');
insert into layouts(id,slug,keyboard_id,title) values ('00000000-0000-0000-0000-000000000001','aaaaaaaaaaa','orca-echo','A'),('00000000-0000-0000-0000-000000000002','bbbbbbbbbbb','orca-echo','B');
select pg_sleep(0.05);
create temp table before as select slug, updated_at from layouts;
\echo '--- 1. 星を付ける: 1、同じ接続元の2回目: 1 のまま、別の接続元: 2'
select set_star('aaaaaaaaaaa', repeat('1',64), true) as first, set_star('aaaaaaaaaaa', repeat('1',64), true) as again;
select set_star('aaaaaaaaaaa', repeat('2',64), true) as other;
\echo '--- 2. 外す: 1、外していない接続元が外しても変わらない: 1'
select set_star('aaaaaaaaaaa', repeat('2',64), false) as off, set_star('aaaaaaaaaaa', repeat('3',64), false) as off_none;
\echo '--- 3. 星では更新日時が変わらない(false が正しい)'
select l.slug, l.star_count, l.updated_at <> b.updated_at as changed from layouts l join before b using (slug) order by 1;
\echo '--- 4. 内容を変えたら更新日時は変わる(true が正しい)'
update layouts set title = 'B2' where slug = 'bbbbbbbbbbb';
select slug, updated_at <> (select updated_at from before where slug='bbbbbbbbbbb') as changed from layouts where slug='bbbbbbbbbbb';
\echo '--- 5. 存在しない配列: null'
select set_star('nope', repeat('1',64), true) is null as is_null;
\echo '--- 6. IPアドレスそのものは保存できない(失敗すべき)'
select set_star('aaaaaaaaaaa', '203.0.113.5', true);
\echo '--- 7. 人気順'
select set_star('bbbbbbbbbbb', repeat('4',64), true), set_star('bbbbbbbbbbb', repeat('5',64), true);
select slug, star_count from layouts order by star_count desc, created_at desc, id;
\echo '--- 8. 記録の種類 star は入る、ほかは入らない(2つ目は失敗すべき)'
insert into submission_events(kind, ip_hash) values ('star', repeat('1',64));
insert into submission_events(kind, ip_hash) values ('like', repeat('1',64));
\echo '--- 9. ブラウザ側の権限: 星の表は読めない・関数は使えない(失敗すべき)、star_count は読める'
set role anon;
select * from stars;
select set_star('aaaaaaaaaaa', repeat('9',64), true);
select slug, star_count from layouts order by 1;
reset role;
\echo '--- 10. 配列を削除すると星も消える'
delete from layouts where slug='bbbbbbbbbbb';
select count(*) as stars_left_for_bbb from stars where layout_id='00000000-0000-0000-0000-000000000002';
```
