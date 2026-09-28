-- 0001_init.sql — keycap-share の初期テーブル (tasks.json P1-3)
--
-- 方針:
-- - ブラウザ(anon / authenticated)は公開情報の「読み取り」だけできる。
-- - 書き込みはすべて Next.js のサーバー側から secret key(RLSを通らない)で行い、
--   編集用秘密キーの照合もサーバー側で行う。
-- - 編集用秘密キーは平文で保存しない。SHA-256 ハッシュを layout_secrets に分けて保存し、
--   このテーブルはブラウザからは一切読めないようにする。

-- ---------------------------------------------------------------------------
-- keyboards(機種)
-- ---------------------------------------------------------------------------
create table public.keyboards (
  id             text primary key check (id ~ '^[a-z0-9][a-z0-9-]*$'), -- slug。例: 'orca-echo'
  name           text not null check (char_length(name) between 1 and 80),
  is_provisional boolean not null default true, -- true = 仮の値(実機確認待ち)
  elements       jsonb not null check (jsonb_typeof(elements) = 'array'), -- KeyboardElement[]
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- layouts(配列)
-- ---------------------------------------------------------------------------
create table public.layouts (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[A-Za-z0-9_-]{6,32}$'), -- 公開URL用
  keyboard_id           text not null references public.keyboards (id) on delete restrict,
  title                 text not null check (char_length(title) between 1 and 80),
  description           text check (char_length(description) <= 2000),
  author_name           text check (char_length(author_name) <= 40),
  forked_from_layout_id uuid references public.layouts (id) on delete set null, -- 「コピーして編集」の複製元
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index layouts_keyboard_id_idx on public.layouts (keyboard_id);
create index layouts_created_at_idx on public.layouts (created_at desc);

-- ---------------------------------------------------------------------------
-- layout_secrets(編集用秘密キーのハッシュ。ブラウザからは読めない)
-- ---------------------------------------------------------------------------
create table public.layout_secrets (
  layout_id        uuid primary key references public.layouts (id) on delete cascade,
  edit_secret_hash text not null check (edit_secret_hash ~ '^[0-9a-f]{64}$'), -- SHA-256 (hex)
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- layers(レイヤー)
-- ---------------------------------------------------------------------------
create table public.layers (
  id           uuid primary key default gen_random_uuid(),
  layout_id    uuid not null references public.layouts (id) on delete cascade,
  layer_number integer not null check (layer_number >= 0),
  layer_name   text not null check (char_length(layer_name) between 1 and 40),
  unique (layout_id, layer_number)
);

-- ---------------------------------------------------------------------------
-- assignments(割り当て: レイヤー内の、ある要素のある操作に対する表示名)
-- ---------------------------------------------------------------------------
create table public.assignments (
  id         uuid primary key default gen_random_uuid(),
  layer_id   uuid not null references public.layers (id) on delete cascade,
  element_id text not null check (char_length(element_id) >= 1),
  action     text not null check (action in (
               'press', 'hold', 'cw', 'ccw', 'up', 'down', 'left', 'right', 'tap', 'click'
             )), -- src/lib/schemas.ts の ActionSchema と一致させる
  label      text not null check (char_length(label) between 1 and 40),
  unique (layer_id, element_id, action)
);

-- ---------------------------------------------------------------------------
-- tags / layout_tags(配列とタグの多対多)
-- ---------------------------------------------------------------------------
create table public.tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 20)
);

create table public.layout_tags (
  layout_id uuid not null references public.layouts (id) on delete cascade,
  tag_id    uuid not null references public.tags (id) on delete cascade,
  primary key (layout_id, tag_id)
);

create index layout_tags_tag_id_idx on public.layout_tags (tag_id);

-- ---------------------------------------------------------------------------
-- updated_at の自動更新
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger keyboards_set_updated_at before update on public.keyboards
  for each row execute function public.set_updated_at();
create trigger layouts_set_updated_at before update on public.layouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 権限と RLS
-- ---------------------------------------------------------------------------
-- まずブラウザ用ロールの権限をすべて外し、必要な読み取りだけを明示的に与える。
revoke all on public.keyboards, public.layouts, public.layout_secrets, public.layers,
  public.assignments, public.tags, public.layout_tags from anon, authenticated;

grant select on public.keyboards, public.layouts, public.layers,
  public.assignments, public.tags, public.layout_tags to anon, authenticated;
-- layout_secrets には一切の権限を与えない。

alter table public.keyboards      enable row level security;
alter table public.layouts        enable row level security;
alter table public.layout_secrets enable row level security; -- ポリシーなし = 全拒否
alter table public.layers         enable row level security;
alter table public.assignments    enable row level security;
alter table public.tags           enable row level security;
alter table public.layout_tags    enable row level security;

create policy "public read" on public.keyboards   for select to anon, authenticated using (true);
create policy "public read" on public.layouts     for select to anon, authenticated using (true);
create policy "public read" on public.layers      for select to anon, authenticated using (true);
create policy "public read" on public.assignments for select to anon, authenticated using (true);
create policy "public read" on public.tags        for select to anon, authenticated using (true);
create policy "public read" on public.layout_tags for select to anon, authenticated using (true);
-- insert / update / delete のポリシーは作らない(ブラウザからの書き込みは全拒否)。
