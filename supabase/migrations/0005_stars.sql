-- 0005_stars.sql — ⭐️(星)と人気順 (tasks.json P7-5)
--
-- 方針は 0004 と同じ: 星の記録(接続元のハッシュ)はブラウザ(anon / authenticated)からは読めない。
-- 星を付ける・外すのはサーバー側(secret key)から関数 set_star で行う。
-- 星の数は layouts.star_count に持ち、ブラウザからも読める(一覧の表示と人気順の並べ替えに使う)。

-- ---------------------------------------------------------------------------
-- 配列ごとの星の数
-- ---------------------------------------------------------------------------
alter table public.layouts
  add column star_count integer not null default 0 check (star_count >= 0);

-- 人気順(星の多い順 → 新しい順)の一覧用
create index layouts_popular_idx on public.layouts (is_listed, star_count desc, created_at desc, id);

-- 星の数が変わっただけのときは、更新日時(updated_at)を変えない。
-- (変えると「更新日」の表示が変わり、OGP画像のURLの版も変わってしまうため)
drop trigger layouts_set_updated_at on public.layouts;
create trigger layouts_set_updated_at before update on public.layouts
  for each row
  when (old.star_count is not distinct from new.star_count)
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 星の記録(同じ接続元からは、同じ配列に1つまで)
-- ---------------------------------------------------------------------------
create table public.stars (
  layout_id  uuid not null references public.layouts (id) on delete cascade,
  ip_hash    text not null check (ip_hash ~ '^[0-9a-f]{64}$'),   -- IPアドレスそのものは保存しない
  created_at timestamptz not null default now(),
  primary key (layout_id, ip_hash)
);

-- ブラウザ側からは一切アクセスできない(RLSを有効にし、ポリシーは作らない)
revoke all on public.stars from anon, authenticated;
alter table public.stars enable row level security;

-- 星が増減したら、配列の星の数を数え直す
create function public.stars_update_count() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.layouts set star_count = star_count + 1 where id = new.layout_id;
  elsif tg_op = 'DELETE' then
    -- 配列ごと削除されたとき(カスケード)は、配列がもうないので何も起きない
    update public.layouts set star_count = greatest(star_count - 1, 0) where id = old.layout_id;
  end if;
  return null;
end;
$$;
create trigger stars_update_count after insert or delete on public.stars
  for each row execute function public.stars_update_count();

-- ---------------------------------------------------------------------------
-- 星を付ける(p_on = true)・外す(false)。結果の星の数を返す。配列がなければ null を返す
-- ---------------------------------------------------------------------------
create function public.set_star(p_slug text, p_ip_hash text, p_on boolean) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_layout_id uuid;
  v_count integer;
begin
  select id into v_layout_id from public.layouts where slug = p_slug;
  if v_layout_id is null then
    return null;
  end if;
  if p_on then
    insert into public.stars (layout_id, ip_hash) values (v_layout_id, p_ip_hash)
    on conflict (layout_id, ip_hash) do nothing;
  else
    delete from public.stars where layout_id = v_layout_id and ip_hash = p_ip_hash;
  end if;
  select star_count into v_count from public.layouts where id = v_layout_id;
  return v_count;
end;
$$;

revoke execute on function public.set_star(text, text, boolean) from public, anon, authenticated;
grant execute on function public.set_star(text, text, boolean) to service_role;
revoke execute on function public.stars_update_count() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 回数の制限の記録に「星」を加える
-- ---------------------------------------------------------------------------
alter table public.submission_events drop constraint submission_events_kind_check;
alter table public.submission_events
  add constraint submission_events_kind_check check (kind in ('layout_create', 'report', 'star'));
