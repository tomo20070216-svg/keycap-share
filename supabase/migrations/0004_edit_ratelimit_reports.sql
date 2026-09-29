-- 0004_edit_ratelimit_reports.sql — 編集・削除、投稿数の制限、問題の報告 (tasks.json P6-1)
--
-- 方針は 0001〜0003 と同じ: ブラウザ(anon / authenticated)からは使えない。サーバー側(secret key)からだけ使う。
-- - 配列の更新・削除は関数で行い、関数の中で編集用秘密キーのハッシュを照合する(合わなければ何もしない)。
--   更新は1つのトランザクションで行うので、途中で失敗しても中途半端な状態にならない。
-- - 投稿・報告の記録には、接続元のIPアドレスをそのまま保存せず、サーバー側でハッシュにした値を保存する。

-- ---------------------------------------------------------------------------
-- 配列の内容を置き換える(編集の保存)
-- p_layers:  [{"layerNumber":0,"layerName":"通常","assignments":[{"elementId":"L-0-0","action":"press","label":"Esc"}]}]
-- p_combos:  [{"elementIds":["R-1-2","R-1-3"],"label":"左クリック","layerNumbers":[]}]
-- p_macros:  [{"name":"署名","description":"..."}]
-- ---------------------------------------------------------------------------
create function public.replace_layout_content(
  p_slug text,
  p_edit_secret_hash text,
  p_title text,
  p_description text,
  p_author_name text,
  p_tags text[],
  p_layers jsonb,
  p_combos jsonb,
  p_macros jsonb
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_layout_id uuid;
  v_layer jsonb;
  v_layer_id uuid;
  v_tag text;
  v_tag_id uuid;
  i integer;
begin
  -- 秘密キーのハッシュが一致する配列だけを対象にする(一致しなければ、何も変えずにエラー)
  select l.id into v_layout_id
  from public.layouts l
  join public.layout_secrets s on s.layout_id = l.id
  where l.slug = p_slug and s.edit_secret_hash = p_edit_secret_hash;
  if v_layout_id is null then
    raise exception 'invalid_edit_secret' using errcode = 'P0001';
  end if;

  update public.layouts
  set title = p_title, description = p_description, author_name = p_author_name
  where id = v_layout_id;

  -- レイヤー(割り当てはカスケードで消える)・コンボ・マクロ・タグの紐付けを入れ替える
  delete from public.layers where layout_id = v_layout_id;
  delete from public.combos where layout_id = v_layout_id;
  delete from public.macros where layout_id = v_layout_id;
  delete from public.layout_tags where layout_id = v_layout_id;

  for v_layer in select * from jsonb_array_elements(p_layers) loop
    insert into public.layers (layout_id, layer_number, layer_name)
    values (v_layout_id, (v_layer->>'layerNumber')::integer, v_layer->>'layerName')
    returning id into v_layer_id;

    insert into public.assignments (layer_id, element_id, action, label)
    select v_layer_id, a->>'elementId', a->>'action', a->>'label'
    from jsonb_array_elements(coalesce(v_layer->'assignments', '[]'::jsonb)) a;
  end loop;

  i := 0;
  for v_layer in select * from jsonb_array_elements(p_combos) loop
    insert into public.combos (layout_id, position, element_ids, label, layer_numbers)
    values (
      v_layout_id,
      i,
      array(select jsonb_array_elements_text(v_layer->'elementIds')),
      v_layer->>'label',
      array(select (jsonb_array_elements_text(coalesce(v_layer->'layerNumbers', '[]'::jsonb)))::integer)
    );
    i := i + 1;
  end loop;

  i := 0;
  for v_layer in select * from jsonb_array_elements(p_macros) loop
    insert into public.macros (layout_id, position, name, description)
    values (v_layout_id, i, v_layer->>'name', coalesce(v_layer->>'description', ''));
    i := i + 1;
  end loop;

  foreach v_tag in array coalesce(p_tags, '{}') loop
    insert into public.tags (name) values (v_tag) on conflict (name) do nothing;
    select id into v_tag_id from public.tags where name = v_tag;
    insert into public.layout_tags (layout_id, tag_id) values (v_layout_id, v_tag_id) on conflict do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 配列を削除する(秘密キーのハッシュが一致するときだけ)。削除したら true
-- ---------------------------------------------------------------------------
create function public.delete_layout_with_secret(p_slug text, p_edit_secret_hash text) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_layout_id uuid;
begin
  select l.id into v_layout_id
  from public.layouts l
  join public.layout_secrets s on s.layout_id = l.id
  where l.slug = p_slug and s.edit_secret_hash = p_edit_secret_hash;
  if v_layout_id is null then
    return false;
  end if;
  delete from public.layouts where id = v_layout_id; -- 子の行はカスケードで消える
  return true;
end;
$$;

-- 関数は、既定ではだれでも実行できるので、ブラウザ側のロールからは外す(サーバー側の service_role だけが使う)
revoke execute on function public.replace_layout_content(text, text, text, text, text, text[], jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.delete_layout_with_secret(text, text) from public, anon, authenticated;
grant execute on function public.replace_layout_content(text, text, text, text, text, text[], jsonb, jsonb, jsonb) to service_role;
grant execute on function public.delete_layout_with_secret(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 投稿・報告の記録(投稿数の制限、同じ内容の連投の検知に使う)
-- ---------------------------------------------------------------------------
create table public.submission_events (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('layout_create', 'report')),
  ip_hash      text not null check (ip_hash ~ '^[0-9a-f]{64}$'),   -- IPアドレスそのものは保存しない
  content_hash text check (content_hash ~ '^[0-9a-f]{64}$'),       -- 同じ内容の連投の検知用
  created_at   timestamptz not null default now()
);
create index submission_events_ip_idx on public.submission_events (kind, ip_hash, created_at desc);
create index submission_events_content_idx on public.submission_events (kind, content_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- 問題の報告
-- ---------------------------------------------------------------------------
create table public.reports (
  id         uuid primary key default gen_random_uuid(),
  layout_id  uuid not null references public.layouts (id) on delete cascade,
  reason     text not null check (reason in ('spam', 'inappropriate', 'rights', 'other')),
  comment    text not null default '' check (char_length(comment) <= 500),
  ip_hash    text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index reports_layout_idx on public.reports (layout_id, created_at desc);

-- ブラウザ側からは一切アクセスできない(RLSを有効にし、ポリシーは作らない)
revoke all on public.submission_events, public.reports from anon, authenticated;
alter table public.submission_events enable row level security;
alter table public.reports enable row level security;
