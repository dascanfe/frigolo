-- =============================================================================
-- Frigolo - 0024: metriche d'uso aggregate per il cruscotto (Pepe)
--
-- Perché: per il lancio servono numeri d'uso (registrazioni, liste, prodotti,
-- spese, inviti, persone attive, retention) senza mai mostrare dati di singoli
-- utenti, e solo a Daniele. Definizioni in docs/metriche.md.
--
-- Cosa fa:
--   1. schema privato `metrics` (non esposto da PostgREST, nessun grant ai
--      client) con tre tabelle:
--        - metrics.admins: chi può leggere le metriche (user_id). Vuota: in
--          produzione la si riempie a mano con una riga (vedi in fondo). Così
--          nel repo pubblico non c'è nessuna email;
--        - metrics.daily_counts: contatori per giorno (registrazioni, liste
--          create, prodotti aggiunti, spese, inviti usati...). Solo numeri.
--          Servono perché le righe di origine spariscono (le liste vuote si
--          eliminano, la spesa svuota list_entries, gli account si cancellano)
--          e senza contatori lo storico si accorcerebbe da solo;
--        - metrics.active_days: (utente, giorno) in cui l'utente ha fatto
--          almeno un'azione. Serve per persone attive e retention. È l'unico
--          dato per utente: tenuto 180 giorni, cancellato con l'account
--          (on delete cascade), mai esposto riga per riga;
--   2. trigger che aggiornano contatori e giorni attivi (nessuna modifica al
--      frontend né alle RPC esistenti);
--   3. riempimento iniziale dai dati già presenti (una volta sola);
--   4. RPC public.metrics_app(p_from, p_to): un solo JSON di aggregati,
--      eseguibile solo da chi è in metrics.admins, altrimenti errore 42501
--      (mai una risposta vuota che sembri "zero utenti");
--   5. job notturno che tiene solo gli ultimi 180 giorni di active_days.
--
-- "Giorno" = data in ora italiana (Europe/Rome), come il resto dell'app.
-- "Attivo" = ha fatto almeno un'azione che scrive nel database: aggiungere,
-- spuntare o togliere un prodotto, completare una spesa, entrare in una lista,
-- modificare profilo o lista. Aprire l'app e guardare non conta (non lascia
-- tracce, ed è voluto: niente tracciamento delle aperture).
--
-- Idempotente: rilanciarla non duplica contatori, trigger, job né righe.
-- =============================================================================

create schema if not exists metrics;
revoke all on schema metrics from public, anon, authenticated;

comment on schema metrics is 'Metriche d uso aggregate per il cruscotto di Daniele. Nessun accesso dai client: si legge solo con public.metrics_app().';

-- -----------------------------------------------------------------------------
-- 1. Tabelle
-- -----------------------------------------------------------------------------
create table if not exists metrics.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  added_at  timestamptz not null default now()
);

comment on table metrics.admins is 'Account che possono leggere le metriche aggregate. Si riempie a mano, solo dal pannello SQL.';

create table if not exists metrics.daily_counts (
  day     date not null,
  metric  text not null,
  n       integer not null default 0,
  primary key (day, metric)
);

comment on table metrics.daily_counts is 'Contatori d uso per giorno (ora italiana). Solo numeri, nessun riferimento a utenti o liste.';

create table if not exists metrics.active_days (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  primary key (user_id, day)
);

create index if not exists active_days_day_idx on metrics.active_days (day);

comment on table metrics.active_days is 'Giorni (ora italiana) in cui un utente ha fatto almeno un azione. Per persone attive e retention. Tenuta 180 giorni, mai esposta riga per riga.';

-- metadati della migration (es. riempimento iniziale già fatto)
create table if not exists metrics.meta (
  key    text primary key,
  value  text not null
);

alter table metrics.admins       enable row level security;
alter table metrics.daily_counts enable row level security;
alter table metrics.active_days  enable row level security;
alter table metrics.meta         enable row level security;
revoke all on all tables in schema metrics from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Aiuti interni (solo per i trigger e per metrics_app)
-- -----------------------------------------------------------------------------
create or replace function metrics.today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Rome')::date;
$$;

create or replace function metrics.bump(p_metric text, p_n integer default 1)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into metrics.daily_counts as c (day, metric, n)
  values (metrics.today(), p_metric, p_n)
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
  on conflict do nothing;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Trigger
-- Tutti AFTER e security definer (i client non hanno permessi su metrics).
-- Non devono mai far fallire l'azione dell'utente: le scritture sono semplici
-- insert/upsert su tabelle senza vincoli esterni oltre alla FK verso
-- auth.users, che per l'utente corrente esiste sempre.
-- -----------------------------------------------------------------------------

-- giorno attivo: una scrittura per istruzione, non per riga
create or replace function metrics.trg_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform metrics.touch_active();
  return null;
end;
$$;

-- prodotti aggiunti alla lista (per istruzione, contando le righe nuove)
create or replace function metrics.trg_items_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  select count(*) into v_n from new_rows;
  if v_n > 0 then
    perform metrics.bump('items_added', v_n);
  end if;
  return null;
end;
$$;

-- registrazioni, profili completati, account eliminati
create or replace function metrics.trg_profiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform metrics.bump('signups');
    if new.completed_at is not null then
      perform metrics.bump('profiles_completed');
    end if;
  elsif tg_op = 'UPDATE' then
    if old.completed_at is null and new.completed_at is not null then
      perform metrics.bump('profiles_completed');
    end if;
  elsif tg_op = 'DELETE' then
    perform metrics.bump('accounts_deleted');
  end if;
  return null;
end;
$$;

-- liste create ed eliminate
create or replace function metrics.trg_households()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform metrics.bump('lists_created');
  elsif tg_op = 'DELETE' then
    perform metrics.bump('lists_deleted');
  end if;
  return null;
end;
$$;

-- inviti usati: qualcuno entra in una lista dove c'è già un'altra persona
create or replace function metrics.trg_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.household_members m
    where m.household_id = new.household_id and m.user_id <> new.user_id
  ) then
    perform metrics.bump('invites_used');
  end if;
  return null;
end;
$$;

-- spese completate (a mano o dal salvataggio notturno)
create or replace function metrics.trg_trips()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.completed_at is not null
     and (tg_op = 'INSERT' or old.completed_at is null) then
    perform metrics.bump(case when new.completed_by is null then 'trips_auto' else 'trips_manual' end);
  end if;
  return null;
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- giorni attivi
drop trigger if exists metrics_active on public.list_entries;
create trigger metrics_active
  after insert or update or delete on public.list_entries
  for each statement execute function metrics.trg_active();

drop trigger if exists metrics_active on public.shopping_trips;
create trigger metrics_active
  after insert or update on public.shopping_trips
  for each statement execute function metrics.trg_active();

drop trigger if exists metrics_active on public.household_members;
create trigger metrics_active
  after insert on public.household_members
  for each statement execute function metrics.trg_active();

drop trigger if exists metrics_active on public.households;
create trigger metrics_active
  after insert or update on public.households
  for each statement execute function metrics.trg_active();

drop trigger if exists metrics_active on public.profiles;
create trigger metrics_active
  after update on public.profiles
  for each statement execute function metrics.trg_active();

drop trigger if exists metrics_active on public.items;
create trigger metrics_active
  after insert or update on public.items
  for each statement execute function metrics.trg_active();

-- contatori
drop trigger if exists metrics_items_added on public.list_entries;
create trigger metrics_items_added
  after insert on public.list_entries
  referencing new table as new_rows
  for each statement execute function metrics.trg_items_added();

drop trigger if exists metrics_profiles on public.profiles;
-- niente "update of completed_at": completed_at lo imposta il trigger BEFORE
-- profiles_before_update, e i trigger per colonna guardano solo le colonne
-- scritte dal client
create trigger metrics_profiles
  after insert or update or delete on public.profiles
  for each row execute function metrics.trg_profiles();

drop trigger if exists metrics_households on public.households;
create trigger metrics_households
  after insert or delete on public.households
  for each row execute function metrics.trg_households();

drop trigger if exists metrics_members on public.household_members;
create trigger metrics_members
  after insert on public.household_members
  for each row execute function metrics.trg_members();

drop trigger if exists metrics_trips on public.shopping_trips;
create trigger metrics_trips
  after insert or update on public.shopping_trips
  for each row execute function metrics.trg_trips();

-- -----------------------------------------------------------------------------
-- 3. Riempimento iniziale dai dati presenti (una volta sola)
-- È una stima per difetto: quello che è già stato cancellato (liste eliminate,
-- prodotti tolti senza comprarli, account chiusi) non si può ricostruire.
-- I prodotti aggiunti del passato = acquisti registrati + righe ancora in lista.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from metrics.meta where key = 'backfill') then
    return;
  end if;

  insert into metrics.daily_counts as c (day, metric, n)
  select d, m, count(*)::int
  from (
    select (created_at at time zone 'Europe/Rome')::date as d, 'signups' as m
      from public.profiles
    union all
    select (completed_at at time zone 'Europe/Rome')::date, 'profiles_completed'
      from public.profiles where completed_at is not null
    union all
    select (created_at at time zone 'Europe/Rome')::date, 'lists_created'
      from public.households
    union all
    select (purchased_at at time zone 'Europe/Rome')::date, 'items_added'
      from public.purchases
    union all
    select (added_at at time zone 'Europe/Rome')::date, 'items_added'
      from public.list_entries
    union all
    select (completed_at at time zone 'Europe/Rome')::date,
           case when completed_by is null then 'trips_auto' else 'trips_manual' end
      from public.shopping_trips where completed_at is not null
    union all
    select (m.joined_at at time zone 'Europe/Rome')::date, 'invites_used'
      from public.household_members m
     where m.joined_at > (select min(f.joined_at) from public.household_members f
                          where f.household_id = m.household_id)
  ) s
  group by d, m
  on conflict (day, metric) do update set n = c.n + excluded.n;

  insert into metrics.active_days (user_id, day)
  select distinct u, d
  from (
    select added_by as u, (added_at at time zone 'Europe/Rome')::date as d
      from public.list_entries
    union all
    select purchased_by, (purchased_at at time zone 'Europe/Rome')::date
      from public.purchases
    union all
    select completed_by, (completed_at at time zone 'Europe/Rome')::date
      from public.shopping_trips
    union all
    select user_id, (joined_at at time zone 'Europe/Rome')::date
      from public.household_members
    union all
    select id, (completed_at at time zone 'Europe/Rome')::date
      from public.profiles
  ) s
  where u is not null
    and d is not null
    and d >= metrics.today() - 180
    and exists (select 1 from auth.users au where au.id = s.u)
  on conflict do nothing;

  insert into metrics.meta (key, value) values ('backfill', now()::text);
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. RPC per il cruscotto
-- p_from e p_to sono date (ora italiana), estremi inclusi, al massimo 400
-- giorni. Restituisce solo aggregati e conteggi: nessun id, nome o email.
-- -----------------------------------------------------------------------------
create or replace function public.metrics_app(p_from date, p_to date)
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
  if (select auth.uid()) is null
     or not exists (select 1 from metrics.admins where user_id = (select auth.uid())) then
    raise exception 'Non autorizzato.' using errcode = '42501', hint = 'not_admin';
  end if;

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

revoke execute on function public.metrics_app(date, date) from public, anon;
grant execute on function public.metrics_app(date, date) to authenticated;

comment on function public.metrics_app(date, date) is 'Metriche d uso aggregate per il cruscotto. Solo per gli account in metrics.admins; errore 42501 per tutti gli altri.';

-- -----------------------------------------------------------------------------
-- 5. Conservazione: active_days solo per 180 giorni
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'frigolo-metrics-retention') then
    perform cron.unschedule('frigolo-metrics-retention');
  end if;
  perform cron.schedule(
    'frigolo-metrics-retention',
    '20 2 * * *',
    $job$delete from metrics.active_days where day < (now() at time zone 'Europe/Rome')::date - 180$job$
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Dopo la migration, in produzione, una volta sola (pannello SQL di Supabase):
--
--   insert into metrics.admins (user_id)
--   select id from auth.users where email = '<email di Daniele>'
--   on conflict do nothing;
--
-- L'email non sta in questo file perché il repo è pubblico.
-- -----------------------------------------------------------------------------
