# P6-1 0004 のローカル検証ログ (2026-09-29, PostgreSQL 17.6 一時DB。0001〜0004を順に適用し、Supabaseの anon / authenticated / service_role を模擬)

## テストSQL
```sql
\set ON_ERROR_STOP 0
insert into keyboards(id,name,elements) values ('orca-echo','Orca echo','[]');
insert into layouts(id,slug,keyboard_id,title) values ('00000000-0000-0000-0000-000000000001','mine123','orca-echo','元のタイトル'),('00000000-0000-0000-0000-000000000002','other12','orca-echo','他人の配列');
insert into layout_secrets values ('00000000-0000-0000-0000-000000000001', repeat('a',64)), ('00000000-0000-0000-0000-000000000002', repeat('b',64));
insert into layers(layout_id,layer_number,layer_name) values ('00000000-0000-0000-0000-000000000001',0,'通常');
select pg_sleep(0.05);
\echo '--- 1. 正しい秘密キーで更新する'
select replace_layout_content('mine123', repeat('a',64), '新しいタイトル', '説明', '作者', array['タグA','タグB'],
  '[{"layerNumber":0,"layerName":"通常","assignments":[{"elementId":"L-0-0","action":"press","label":"Esc"}]},{"layerNumber":1,"layerName":"fn1","assignments":[]}]',
  '[{"elementIds":["R-1-2","R-1-3"],"label":"左クリック","layerNumbers":[1]}]', '[{"name":"署名","description":"挨拶"}]');
select title, description, author_name, updated_at > created_at as updated from layouts where slug='mine123';
select layer_number, layer_name, (select count(*) from assignments a where a.layer_id=l.id) as n from layers l where layout_id='00000000-0000-0000-0000-000000000001' order by 1;
select position, element_ids, label, layer_numbers from combos; select name, description from macros;
select t.name from layout_tags lt join tags t on t.id=lt.tag_id where lt.layout_id='00000000-0000-0000-0000-000000000001' order by 1;
\echo '--- 2. 違う秘密キー(他人の配列のキー)では更新できない (エラーになるべき)'
select replace_layout_content('mine123', repeat('b',64), '乗っ取り', null, null, '{}', '[]', '[]', '[]');
select title from layouts where slug='mine123';
\echo '--- 3. 途中で失敗したら全部元に戻る(存在しない操作 click を含む → エラー、タイトルも変わらない)'
select replace_layout_content('mine123', repeat('a',64), '途中で失敗するはず', null, null, '{}',
  '[{"layerNumber":0,"layerName":"通常","assignments":[{"elementId":"R-TRACKBALL","action":"click","label":"x"}]}]', '[]', '[]');
select title, (select count(*) from layers where layout_id='00000000-0000-0000-0000-000000000001') as layers, (select count(*) from combos) as combos from layouts where slug='mine123';
\echo '--- 4. 削除: 違う秘密キーでは false で何も消えない、正しいキーでは true で消える'
select delete_layout_with_secret('other12', repeat('a',64)) as wrong_key;
select delete_layout_with_secret('other12', repeat('b',64)) as right_key;
select slug from layouts order by 1;
\echo '--- 5. 記録と報告'
insert into submission_events(kind, ip_hash, content_hash) values ('layout_create', repeat('c',64), repeat('d',64));
insert into reports(layout_id, reason, ip_hash) values ('00000000-0000-0000-0000-000000000001','spam',repeat('c',64));
\echo '--- IPアドレスそのものは保存できない (失敗すべき)'
insert into submission_events(kind, ip_hash) values ('layout_create', '203.0.113.5');
set role anon;
\echo '--- 6. anon: 関数を実行できない (失敗すべき)'
select replace_layout_content('mine123', repeat('a',64), 'x', null, null, '{}', '[]', '[]', '[]');
select delete_layout_with_secret('mine123', repeat('a',64));
\echo '--- anon: 記録・報告を読めない (失敗すべき)'
select count(*) from submission_events;
select count(*) from reports;
reset role;
set role service_role;
\echo '--- 7. service_role(サーバー側): 関数を実行できる'
select delete_layout_with_secret('mine123', repeat('x',64)) as wrong_key_as_service;
reset role;
```

## 結果
```
INSERT 0 1
INSERT 0 2
INSERT 0 2
INSERT 0 1
 pg_sleep 
----------
 
(1 行)

--- 1. 正しい秘密キーで更新する
 replace_layout_content 
------------------------
 
(1 行)

     title      | description | author_name | updated 
----------------+-------------+-------------+---------
 新しいタイトル | 説明        | 作者        | t
(1 行)

 layer_number | layer_name | n 
--------------+------------+---
            0 | 通常       | 1
            1 | fn1        | 0
(2 行)

 position |  element_ids  |   label    | layer_numbers 
----------+---------------+------------+---------------
        0 | {R-1-2,R-1-3} | 左クリック | {1}
(1 行)

 name | description 
------+-------------
 署名 | 挨拶
(1 行)

 name  
-------
 タグA
 タグB
(2 行)

--- 2. 違う秘密キー(他人の配列のキー)では更新できない (エラーになるべき)
test4.sql:16: ERROR:  invalid_edit_secret
CONTEXT:  PL/pgSQL関数public.replace_layout_content(text,text,text,text,text,text[],jsonb,jsonb,jsonb)の16行目 - RAISE
     title      
----------------
 新しいタイトル
(1 行)

--- 3. 途中で失敗したら全部元に戻る(存在しない操作 click を含む → エラー、タイトルも変わらない)
test4.sql:20: ERROR:  リレーション"assignments"の新しい行は検査制約"assignments_action_check"に違反しています
DETAIL:  失敗した行は(13c44fdb-9918-48c1-9b8d-4956ff438738, 0391e04d-2213-4ddc-a4b0-acc7d3f212c6, R-TRACKBALL, click, x)を含みます
CONTEXT:  SQL文 "insert into public.assignments (layer_id, element_id, action, label)
    select v_layer_id, a->>'elementId', a->>'action', a->>'label'
    from jsonb_array_elements(coalesce(v_layer->'assignments', '[]'::jsonb)) a"
PL/pgSQL関数public.replace_layout_content(text,text,text,text,text,text[],jsonb,jsonb,jsonb)の34行目 - SQL ステートメント
     title      | layers | combos 
----------------+--------+--------
 新しいタイトル |      2 |      1
(1 行)

--- 4. 削除: 違う秘密キーでは false で何も消えない、正しいキーでは true で消える
 wrong_key 
-----------
 f
(1 行)

 right_key 
-----------
 t
(1 行)

  slug   
---------
 mine123
(1 行)

--- 5. 記録と報告
INSERT 0 1
INSERT 0 1
--- IPアドレスそのものは保存できない (失敗すべき)
test4.sql:30: ERROR:  リレーション"submission_events"の新しい行は検査制約"submission_events_ip_hash_check"に違反しています
DETAIL:  失敗した行は(db78da69-3b0b-4b4a-88cc-78198a3b5722, layout_create, 203.0.113.5, null, 2026-09-29 15:50:44.850593+09)を含みます
SET
--- 6. anon: 関数を実行できない (失敗すべき)
test4.sql:33: ERROR:  関数 replace_layout_content へのアクセスが拒否されました
test4.sql:34: ERROR:  関数 delete_layout_with_secret へのアクセスが拒否されました
--- anon: 記録・報告を読めない (失敗すべき)
test4.sql:36: ERROR:  テーブル submission_events へのアクセスが拒否されました
test4.sql:37: ERROR:  テーブル reports へのアクセスが拒否されました
RESET
SET
--- 7. service_role(サーバー側): 関数を実行できる
 wrong_key_as_service 
----------------------
 f
(1 行)

RESET
```
