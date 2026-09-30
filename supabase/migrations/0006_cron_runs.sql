-- 0006_cron_runs.sql — 定期実行の記録 (tasks.json P7-12)
--
-- Vercel の定期実行(/api/keepalive、1日1回)が動くたびに、日時と成否を1行書き込む。
-- /status ページで「最後に動いた日時」と最近の記録を表示するために使う。
-- - 書き込み・削除はサーバー側(secret key)からだけ。
-- - ブラウザ側(anon / authenticated)からは読み取りだけできる(中身は日時と成否だけなので、見られても問題ない)。
-- - 30日より古い記録は、書き込むときにサーバー側で消す。

create table public.cron_runs (
  id     bigint generated always as identity primary key,
  job    text not null check (job in ('keepalive')),
  ok     boolean not null,
  ran_at timestamptz not null default now()
);
create index cron_runs_job_ran_at_idx on public.cron_runs (job, ran_at desc);

-- ブラウザ側からは読み取りだけ
revoke all on public.cron_runs from anon, authenticated;
grant select on public.cron_runs to anon, authenticated;
alter table public.cron_runs enable row level security;
create policy "public read" on public.cron_runs for select to anon, authenticated using (true);
