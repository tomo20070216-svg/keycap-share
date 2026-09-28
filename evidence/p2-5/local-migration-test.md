# P2-5 0002 のローカル検証ログ (2026-09-29, PostgreSQL 17.6 一時DB。0001を適用しデータを入れた状態で0002を適用)

## テストSQL
```sql
\set ON_ERROR_STOP 0
-- 0002 適用前に既存データがある状態を再現
insert into keyboards(id,name,elements) values ('orca-echo','Orca echo','[]');
insert into layouts(id,slug,keyboard_id,title) values ('00000000-0000-0000-0000-000000000001','abc123','orca-echo','t');
insert into layers(id,layout_id,layer_number,layer_name) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000001',0,'通常');
insert into assignments(layer_id,element_id,action,label) values ('00000000-0000-0000-0000-0000000000a1','L-0-0','press','Esc');
\echo '--- 0002 を適用'
\i 0002.sql
\echo '--- コンボ・マクロを保存'
insert into combos(layout_id,position,element_ids,label) values ('00000000-0000-0000-0000-000000000001',0,'{R-1-2,R-1-3}','左クリック');
insert into macros(layout_id,position,name,description) values ('00000000-0000-0000-0000-000000000001',0,'署名','テスト');
select position, element_ids, label, layer_numbers from combos;
\echo '--- キー1つだけのコンボ (失敗すべき)'
insert into combos(layout_id,position,element_ids,label) values ('00000000-0000-0000-0000-000000000001',1,'{R-1-2}','x');
\echo '--- 同じ表示順 (失敗すべき)'
insert into combos(layout_id,position,element_ids,label) values ('00000000-0000-0000-0000-000000000001',0,'{R-1-2,R-1-4}','x');
\echo '--- 21文字のマクロ名 (失敗すべき)'
insert into macros(layout_id,position,name) values ('00000000-0000-0000-0000-000000000001',1,repeat('あ',21));
\echo '--- click は保存できない (失敗すべき)'
insert into assignments(layer_id,element_id,action,label) values ('00000000-0000-0000-0000-0000000000a1','R-TRACKBALL','click','x');
\echo '--- 既存の割り当ては残っている'
select count(*) from assignments;
set role anon;
\echo '--- anon: combos・macros を読める'
select count(*) from combos; select count(*) from macros;
\echo '--- anon: combos に書き込み (失敗すべき)'
insert into combos(layout_id,position,element_ids,label) values ('00000000-0000-0000-0000-000000000001',5,'{a,b}','x');
reset role;
\echo '--- 配列を消すとコンボ・マクロも消える'
delete from layouts; select (select count(*) from combos) combos, (select count(*) from macros) macros;
```

## 結果
```
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
--- 0002 を適用
CREATE TABLE
CREATE TABLE
ALTER TABLE
ALTER TABLE
REVOKE
GRANT
ALTER TABLE
ALTER TABLE
CREATE POLICY
CREATE POLICY
--- コンボ・マクロを保存
INSERT 0 1
INSERT 0 1
 position |  element_ids  |   label    | layer_numbers 
----------+---------------+------------+---------------
        0 | {R-1-2,R-1-3} | 左クリック | {}
(1 行)

--- キー1つだけのコンボ (失敗すべき)
test2.sql:14: ERROR:  リレーション"combos"の新しい行は検査制約"combos_element_ids_check"に違反しています
DETAIL:  失敗した行は(c901f0f6-7ec0-411c-b93c-d5c5dd8a8a1c, 00000000-0000-0000-0000-000000000001, 1, {R-1-2}, x, {})を含みます
--- 同じ表示順 (失敗すべき)
test2.sql:16: ERROR:  重複したキー値は一意性制約"combos_layout_id_position_key"違反となります
DETAIL:  キー (layout_id, "position")=(00000000-0000-0000-0000-000000000001, 0) はすでに存在します。
--- 21文字のマクロ名 (失敗すべき)
test2.sql:18: ERROR:  リレーション"macros"の新しい行は検査制約"macros_name_check"に違反しています
DETAIL:  失敗した行は(883a65bb-ca32-4377-9625-e7e0ae6468bb, 00000000-0000-0000-0000-000000000001, 1, あああああああああああああああああああああ, )を含みます
--- click は保存できない (失敗すべき)
test2.sql:20: ERROR:  リレーション"assignments"の新しい行は検査制約"assignments_action_check"に違反しています
DETAIL:  失敗した行は(337af15f-c57d-4d84-98a0-d8d95bde2523, 00000000-0000-0000-0000-0000000000a1, R-TRACKBALL, click, x)を含みます
--- 既存の割り当ては残っている
 count 
-------
     1
(1 行)

SET
--- anon: combos・macros を読める
 count 
-------
     1
(1 行)

 count 
-------
     1
(1 行)

--- anon: combos に書き込み (失敗すべき)
test2.sql:27: ERROR:  テーブル combos へのアクセスが拒否されました
RESET
--- 配列を消すとコンボ・マクロも消える
DELETE 1
 combos | macros 
--------+--------
      0 |      0
(1 行)

```
