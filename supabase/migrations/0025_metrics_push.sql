-- =============================================================================
-- Frigolo - 0025: metriche inviate al progetto delle statistiche, Daniele escluso
--
-- Perché:
--   1. il cruscotto non deve chiedere una seconda password: con il captcha
--      attivo su Supabase Auth di Frigolo il login dal cruscotto non passa.
--      Ogni ora questo database calcola gli aggregati (lo stesso contenuto di
--      metrics_app) e li manda con pg_net al progetto delle statistiche
--      (RPC frigolo_app_ingest), dove il cruscotto li legge con l'accesso che
--      ha già. Nessun dato per utente esce da qui: solo conteggi;
--   2. le azioni di Daniele non devono finire nelle metriche.
--
-- Autenticazione tra i due progetti: un segreto casuale di 256 bit, salvato
-- nel Vault di questo progetto (nome frigolo_stats_push_secret) e, solo come
-- hash SHA-256, nel progetto delle statistiche. Con lui nel Vault c'è la chiave
-- pubblica (anon) del progetto delle statistiche (frigolo_stats_anon_key),
-- che serve solo a passare dal gateway. I due segreti si creano a mano,
-- fuori dal repo (vedi in fondo).
--
-- Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Account esclusi dalle metriche (da ora in poi; i contatori passati restano)
-- -----------------------------------------------------------------------------
create table if not exists metrics.excluded (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  added_at  timestamptz not null default now()
);
alter table metrics.excluded enable row level security;
revoke all on metrics.excluded from public, anon, authenticated;

comment on table metrics.excluded is 'Account le cui azioni non entrano nelle metriche (Daniele). Si riempie a mano.';

-- chi legge le metriche non le sporca
insert into metrics.excluded (user_id)
select user_id from metrics.admins
on conflict do nothing;

-- i suoi giorni attivi passati non servono
delete from metrics.active_days d
using metrics.excluded e
where e.user_id = d.user_id;

create or replace function metrics.is_excluded()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from metrics.excluded where user_id = (select auth.uid()));
$$;

create or replace function metrics.bump(p_metric text, p_n integer default 1)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into metrics.daily_counts as c (day, metric, n)
  select metrics.today(), p_metric, p_n
  where not metrics.is_excluded()
  on conflict (day, metric) do update set n = c.n + excluded.n;
$$;

create or replace function metrics.touch_active()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into metrics.active_days (user_id, day)
  select (select auth.uid()), metrics.today()
  where (select auth.uid()) is not null
    and not metrics.is_excluded()
  on conflict do nothing;
$$;

-- -----------------------------------------------------------------------------
-- 2. Il calcolo degli aggregati, senza controllo d'accesso, solo per uso
--    interno (job e metrics_app). Stesso corpo della 0024.
-- -----------------------------------------------------------------------------
create or replace function metrics.app_data(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from  date := least(p_from, p_to);
  v_to    date := greatest(p_from, p_to);
  v_today date := metrics.today();
  v_out   jsonb;
begin
  if v_from is null or v_to - v_from > 400 then
    raise exception 'Periodo non valido (massimo 400 giorni).' using errcode = '22023', hint = 'bad_period';
  end if;

  with
  giorni as (
    select g::date as day from generate_series(v_from, v_to, interval '1 day') g
  ),
  conti as (
    select day, metric, n from metrics.daily_counts where day between v_from and v_to
  ),
  attivi_g as (
    select g.day,
           (select count(*) from metrics.active_days a where a.day = g.day) as dau,
           (select count(distinct a.user_id) from metrics.active_days a
             where a.day between g.day - 6 and g.day) as wau,
           (select count(distinct a.user_id) from metrics.active_days a
             where a.day between g.day - 29 and g.day) as mau
    from giorni g
  ),
  serie as (
    select jsonb_agg(jsonb_build_object(
      'giorno',        g.day,
      'registrazioni', coalesce((select sum(n) from conti c where c.day = g.day and c.metric = 'signups'), 0),
      'prodotti',      coalesce((select sum(n) from conti c where c.day = g.day and c.metric = 'items_added'), 0),
      'spese',         coalesce((select sum(n) from conti c where c.day = g.day and c.metric in ('trips_manual', 'trips_auto')), 0),
      'liste',         coalesce((select sum(n) from conti c where c.day = g.day and c.metric = 'lists_created'), 0),
      'inviti',        coalesce((select sum(n) from conti c where c.day = g.day and c.metric = 'invites_used'), 0),
      'inviti_falliti', coalesce((select d.failed from public.invite_attempts_daily d where d.day = g.day), 0),
      'attivi',        a.dau,
      'attivi_7g',     a.wau
    ) order by g.day) as v
    from giorni g join attivi_g a on a.day = g.day
  ),
  -- coorte: chi si è registrato nel periodo ed è ancora iscritto
  coorte as (
    select p.id, (p.created_at at time zone 'Europe/Rome')::date as d0
    from public.profiles p
    where (p.created_at at time zone 'Europe/Rome')::date between v_from and v_to
  ),
  ret as (
    select
      count(*) filter (where d0 + 1  <= v_today - 1)  as r1_base,
      count(*) filter (where d0 + 1  <= v_today - 1 and exists (
        select 1 from metrics.active_days a where a.user_id = c.id and a.day = d0 + 1)) as r1,
      count(*) filter (where d0 + 13 <= v_today - 1)  as r7_base,
      count(*) filter (where d0 + 13 <= v_today - 1 and exists (
        select 1 from metrics.active_days a where a.user_id = c.id and a.day between d0 + 7 and d0 + 13)) as r7,
      count(*) filter (where d0 + 59 <= v_today - 1)  as r30_base,
      count(*) filter (where d0 + 59 <= v_today - 1 and exists (
        select 1 from metrics.active_days a where a.user_id = c.id and a.day between d0 + 30 and d0 + 59)) as r30
    from coorte c
  ),
  liste as (
    select h.id, count(m.user_id) as persone
    from public.households h
    left join public.household_members m on m.household_id = h.id
    group by h.id
  )
  select jsonb_build_object(
    'generato', now(),
    'periodo',  jsonb_build_object('da', v_from, 'a', v_to),
    'oggi', jsonb_build_object(
      'utenti',            (select count(*) from public.profiles),
      'profili_completi',  (select count(*) from public.profiles where completed_at is not null),
      'liste',             (select count(*) from liste),
      'liste_condivise',   (select count(*) from liste where persone >= 2),
      'persone_per_lista', (select round(avg(persone), 2) from liste where persone > 0),
      'prodotti_in_lista', (select count(*) from public.list_entries),
      'attivi_oggi',       (select count(*) from metrics.active_days where day = v_today),
      'attivi_7g',         (select count(distinct user_id) from metrics.active_days where day > v_today - 7),
      'attivi_30g',        (select count(distinct user_id) from metrics.active_days where day > v_today - 30)
    ),
    'periodo_tot', jsonb_build_object(
      'registrazioni',      coalesce((select sum(n) from conti where metric = 'signups'), 0),
      'profili_completati', coalesce((select sum(n) from conti where metric = 'profiles_completed'), 0),
      'liste_create',       coalesce((select sum(n) from conti where metric = 'lists_created'), 0),
      'liste_eliminate',    coalesce((select sum(n) from conti where metric = 'lists_deleted'), 0),
      'prodotti_aggiunti',  coalesce((select sum(n) from conti where metric = 'items_added'), 0),
      'spese_a_mano',       coalesce((select sum(n) from conti where metric = 'trips_manual'), 0),
      'spese_automatiche',  coalesce((select sum(n) from conti where metric = 'trips_auto'), 0),
      'inviti_usati',       coalesce((select sum(n) from conti where metric = 'invites_used'), 0),
      'inviti_falliti',     coalesce((select sum(failed) from public.invite_attempts_daily
                                       where day between v_from and v_to), 0),
      'account_eliminati',  coalesce((select sum(n) from conti where metric = 'accounts_deleted'), 0),
      'persone_attive',     (select count(distinct user_id) from metrics.active_days
                              where day between v_from and v_to)
    ),
    'retention', (select jsonb_build_object(
      'r1',  jsonb_build_object('base', r1_base,  'tornati', r1),
      'r7',  jsonb_build_object('base', r7_base,  'tornati', r7),
      'r30', jsonb_build_object('base', r30_base, 'tornati', r30)
    ) from ret),
    'giorni', coalesce((select v from serie), '[]'::jsonb),
    'spazio', jsonb_build_object(
      'db_byte',      pg_database_size(current_database()),
      'db_limite',    500 * 1024 * 1024,
      'storage_byte', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o),
      'storage_limite', 1024 * 1024 * 1024
    ),
    'dati_dal', (select value from metrics.meta where key = 'backfill')
  ) into v_out;

  return v_out;
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

create or replace function public.metrics_app(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not exists (select 1 from metrics.admins where user_id = (select auth.uid())) then
    raise exception 'Non autorizzato.' using errcode = '42501', hint = 'not_admin';
  end if;
  return metrics.app_data(p_from, p_to);
end;
$$;

revoke execute on function public.metrics_app(date, date) from public, anon;
grant execute on function public.metrics_app(date, date) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. L'istantanea per il cruscotto: i quattro periodi del cruscotto (oggi,
--    7 giorni, 30 giorni, sempre = un anno) e, per i primi tre, lo stesso
--    intervallo subito prima per il confronto. Giorni in ora italiana.
-- -----------------------------------------------------------------------------
create or replace function metrics.snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  t date := metrics.today();
begin
  return jsonb_build_object(
    'generato', now(),
    'periodi', jsonb_build_object(
      'oggi',   jsonb_build_object('ora', metrics.app_data(t, t),
                                   'prima', metrics.app_data(t - 1, t - 1)),
      '7',      jsonb_build_object('ora', metrics.app_data(t - 6, t),
                                   'prima', metrics.app_data(t - 13, t - 7)),
      '30',     jsonb_build_object('ora', metrics.app_data(t - 29, t),
                                   'prima', metrics.app_data(t - 59, t - 30)),
      'sempre', jsonb_build_object('ora', metrics.app_data(t - 364, t),
                                   'prima', null)
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. L'invio con pg_net (asincrono: la risposta finisce in net._http_response,
--    che pg_net pulisce da solo dopo qualche ora)
-- -----------------------------------------------------------------------------
create extension if not exists pg_net with schema extensions;

create or replace function metrics.push_snapshot()
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_segreto text;
  v_anon    text;
begin
  select decrypted_secret into v_segreto from vault.decrypted_secrets where name = 'frigolo_stats_push_secret';
  select decrypted_secret into v_anon    from vault.decrypted_secrets where name = 'frigolo_stats_anon_key';
  if v_segreto is null or v_anon is null then
    raise notice 'metrics.push_snapshot: segreti mancanti nel Vault, niente invio';
    return null;
  end if;

  return net.http_post(
    url := 'https://tfihnbahzsjhkssxbgue.supabase.co/rest/v1/rpc/frigolo_app_ingest',
    body := jsonb_build_object('p_segreto', v_segreto, 'p_dati', metrics.snapshot()),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_anon,
      'Authorization', 'Bearer ' || v_anon
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- ogni ora, al minuto 7
do $$
begin
  if exists (select 1 from cron.job where jobname = 'frigolo-metrics-push') then
    perform cron.unschedule('frigolo-metrics-push');
  end if;
  perform cron.schedule('frigolo-metrics-push', '7 * * * *', 'select metrics.push_snapshot()');
end;
$$;

-- -----------------------------------------------------------------------------
-- Dopo la migration, una volta sola e fuori dal repo: creare i due segreti
--   select vault.create_secret('<segreto casuale>', 'frigolo_stats_push_secret');
--   select vault.create_secret('<anon key del progetto statistiche>', 'frigolo_stats_anon_key');
-- mettere l'hash del segreto nel progetto delle statistiche
-- (analytics/migrations/0002_frigolo_app.sql) e lanciare un primo invio:
--   select metrics.push_snapshot();
-- -----------------------------------------------------------------------------
