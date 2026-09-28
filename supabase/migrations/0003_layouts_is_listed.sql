-- 0003_layouts_is_listed.sql — 一覧に出さない配列の印 (tasks.json P3-5)
--
-- テスト用の配列(コンボのサンプル配列)を、一覧・タグの絞り込みに出さないための印。
-- 印が false でも、URL(/k/[slug])を直接開けば見られる(人間の決定、2026-09-29)。

alter table public.layouts add column is_listed boolean not null default true;

-- 一覧(新着順)で使う索引。一覧に出す配列だけを作成日時の新しい順に並べる
create index layouts_listed_created_at_idx on public.layouts (created_at desc) where is_listed;

-- コンボのサンプル配列を一覧に出さない(存在しない場合は何もしない)
update public.layouts set is_listed = false where slug = 'orca-echo-combo-sample';
