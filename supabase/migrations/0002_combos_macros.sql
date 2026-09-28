-- 0002_combos_macros.sql — コンボ・マクロのテーブル追加 (tasks.json P2-5)
--
-- 方針は 0001 と同じ: ブラウザ(anon / authenticated)は読み取りだけ。書き込みはサーバー側(secret key)のみ。

-- ---------------------------------------------------------------------------
-- combos(コンボ: 複数のキーの同時押し)
-- ---------------------------------------------------------------------------
create table public.combos (
  id            uuid primary key default gen_random_uuid(),
  layout_id     uuid not null references public.layouts (id) on delete cascade,
  position      integer not null check (position >= 0), -- 表示順。キー図の番号①②…になる
  element_ids   text[] not null check (cardinality(element_ids) between 2 and 10),
  label         text not null check (char_length(label) between 1 and 40),
  layer_numbers integer[] not null default '{}', -- 空 = 全レイヤー共通
  unique (layout_id, position)
);

-- ---------------------------------------------------------------------------
-- macros(マクロ一覧: 名前と説明)
-- ---------------------------------------------------------------------------
create table public.macros (
  id          uuid primary key default gen_random_uuid(),
  layout_id   uuid not null references public.layouts (id) on delete cascade,
  position    integer not null check (position >= 0), -- 表示順
  name        text not null check (char_length(name) between 1 and 20),
  description text not null default '' check (char_length(description) <= 200),
  unique (layout_id, position)
);

-- ---------------------------------------------------------------------------
-- assignments の操作の種類から 'click' を外す
-- トラックボールに押し込み(クリック)はない(人間の確認、2026-09-29)。'click' を使う要素は他にない。
-- ---------------------------------------------------------------------------
alter table public.assignments drop constraint assignments_action_check;
alter table public.assignments add constraint assignments_action_check check (action in (
  'press', 'hold', 'cw', 'ccw', 'up', 'down', 'left', 'right', 'tap'
)); -- src/lib/schemas.ts の ActionSchema と一致させる

-- ---------------------------------------------------------------------------
-- 権限と RLS
-- ---------------------------------------------------------------------------
revoke all on public.combos, public.macros from anon, authenticated;
grant select on public.combos, public.macros to anon, authenticated;

alter table public.combos enable row level security;
alter table public.macros enable row level security;

create policy "public read" on public.combos for select to anon, authenticated using (true);
create policy "public read" on public.macros for select to anon, authenticated using (true);
