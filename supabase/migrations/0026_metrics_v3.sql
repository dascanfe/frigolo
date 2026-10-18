-- =============================================================================
-- Frigolo - 0026: metriche v3 (iscrizioni, distribuzione d'uso, sessioni,
-- errori, percorso di iscrizione, funzioni usate)
--
-- Sempre e solo aggregati: le tabelle nuove non hanno user_id, tranne
-- metrics.rate_limit (anti abuso, svuotata ogni notte, mai letta dal cruscotto).
--
-- Cosa fa:
--   1. metrics.session_counts: sessioni dell'app per giorno, modalità
--      (standalone/browser), dispositivo (ios/android/desktop), versione, tema,
--      offline sì/no e fascia di durata, con somma dei secondi;
--   2. metrics.error_counts: errori del frontend per giorno, tipo, messaggio
--      ripulito (niente email, id, token, numeri lunghi), versione, pagina;
--   3. RPC public.metrics_record_session e public.metrics_record_error per
--      l'app (solo utenti autenticati; ignorano gli account in metrics.excluded;
--      limite per utente e per ora). Stanno in public perché lo schema metrics
--      non è esposto dalle API;
--   4. contatore invites_rotated (codici di invito rinnovati);
--   5. metrics.extra_data(da, a): distribuzione d'uso, sessioni, errori,
--      percorso di iscrizione, funzioni; metrics.iscrizioni(): totale e serie
--      per settimana, mese e anno. Entrano in metrics_app e nell'istantanea
--      oraria;
--   6. conservazione: rate_limit svuotata ogni notte, sessioni ed errori
--      tenuti 400 giorni.
--
-- Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabelle
-- -----------------------------------------------------------------------------
create table if not exists metrics.session_counts (
  day          date not null,
  modalita     text not null,
  dispositivo  text not null,
  versione     text not null,
  tema         text not null,
  offline      boolean not null,
  fascia       smallint not null,
  n            integer not null default 0,
  secondi      bigint not null default 0,
  primary key (day, modalita, dispositivo, versione, tema, offline, fascia)
);

comment on table metrics.session_counts is 'Sessioni dell app per giorno e caratteristiche (nessun utente). fascia: 0 <10s, 1 10-29s, 2 30-59s, 3 1-2 min, 4 2-5 min, 5 5-10 min, 6 10-30 min, 7 30 min e oltre.';

create table if not exists metrics.error_counts (
  day        date not null,
  tipo       text not null,
  messaggio  text not null,
  versione   text not null,
  pagina     text not null,
  n          integer not null default 0,
  primary key (day, tipo, messaggio, versione, pagina)
);

comment on table metrics.error_counts is 'Errori del frontend per giorno, con messaggio ripulito da dati personali (nessun utente).';

create table if not exists metrics.rate_limit (
  user_id  uuid not null references auth.users (id) on delete cascade,
  ora      timestamptz not null,
  tipo     text not null,
  n        integer not null default 0,
  primary key (user_id, ora, tipo)
);

comment on table metrics.rate_limit is 'Limite anti abuso per le RPC delle metriche. Svuotata ogni notte, mai letta dal cruscotto.';

alter table metrics.session_counts enable row level security;
alter table metrics.error_counts   enable row level security;
alter table metrics.rate_limit     enable row level security;
revoke all on all tables in schema metrics from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Aiuti
-- -----------------------------------------------------------------------------

-- Toglie dal testo quello che potrebbe identificare qualcuno o essere un
-- segreto: email, uuid, parametri degli indirizzi, token lunghi, numeri lunghi.
create or replace function metrics.ripulisci(p text, p_max int)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(trim(regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            coalesce(p, ''),
            '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '<email>', 'g'),
          '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '<id>', 'g'),
        '\?[^[:space:]"'']*', '', 'g'),
      '[A-Za-z0-9_-]{20,}', '<token>', 'g'),
    '[0-9]{4,}', '<n>', 'g')), p_max);
$$;

-- percorso senza parametri; i pezzi lunghi con cifre (codici, token) diventano :id
create or replace function metrics.ripulisci_pagina(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(left(regexp_replace(
    metrics.ripulisci(split_part(split_part(coalesce(p, ''), '?', 1), '#', 1), 200),
    '/(?=[A-Za-z_-]*[0-9])[A-Za-z0-9_-]{8,}(?=/|$)', '/:id', 'g'), 80), ''), '/');
$$;

-- true se l'utente corrente non ha superato p_max chiamate di quel tipo
-- nell'ora in corso
create or replace function metrics.consenti(p_tipo text, p_max int)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n int;
begin
  insert into metrics.rate_limit as r (user_id, ora, tipo, n)
  values ((select auth.uid()), date_trunc('hour', now()), p_tipo, 1)
  on conflict (user_id, ora, tipo) do update set n = r.n + 1
  returning n into v_n;
  return v_n <= p_max;
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC per l'app
-- -----------------------------------------------------------------------------
create or replace function public.metrics_record_session(
  p_secondi     integer,
  p_versione    text,
  p_modalita    text,
  p_dispositivo text,
  p_tema        text,
  p_offline     boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_sec int := least(greatest(coalesce(p_secondi, 0), 0), 14400);
begin
  if (select auth.uid()) is null or metrics.is_excluded() or v_sec < 1 then
    return;
  end if;
  if not metrics.consenti('sessione', 60) then
    return;
  end if;

  insert into metrics.session_counts as c
    (day, modalita, dispositivo, versione, tema, offline, fascia, n, secondi)
  values (
    metrics.today(),
    case when p_modalita in ('standalone', 'browser') then p_modalita else 'altro' end,
    case when p_dispositivo in ('ios', 'android', 'desktop') then p_dispositivo else 'altro' end,
    case when p_versione ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,3}$' then p_versione else 'altro' end,
    case when p_tema in ('autunno', 'basilico', 'mare', 'prugna', 'lampone', 'liquirizia')
         then p_tema else 'altro' end,
    coalesce(p_offline, false),
    case
      when v_sec < 10 then 0 when v_sec < 30 then 1 when v_sec < 60 then 2
      when v_sec < 120 then 3 when v_sec < 300 then 4 when v_sec < 600 then 5
      when v_sec < 1800 then 6 else 7
    end,
    1,
    v_sec
  )
  on conflict (day, modalita, dispositivo, versione, tema, offline, fascia)
  do update set n = c.n + 1, secondi = c.secondi + excluded.secondi;
end;
$$;

create or replace function public.metrics_record_error(
  p_tipo      text,
  p_messaggio text,
  p_versione  text,
  p_pagina    text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or metrics.is_excluded() then
    return;
  end if;
  if not metrics.consenti('errore', 20) then
    return;
  end if;

  insert into metrics.error_counts as c (day, tipo, messaggio, versione, pagina, n)
  values (
    metrics.today(),
    case when p_tipo in ('errore', 'promessa', 'query', 'modifica') then p_tipo else 'altro' end,
    coalesce(nullif(metrics.ripulisci(p_messaggio, 200), ''), '(senza messaggio)'),
    case when p_versione ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,3}$' then p_versione else 'altro' end,
    metrics.ripulisci_pagina(p_pagina),
    1
  )
  on conflict (day, tipo, messaggio, versione, pagina) do update set n = c.n + 1;
end;
$$;

revoke execute on function public.metrics_record_session(integer, text, text, text, text, boolean) from public, anon;
revoke execute on function public.metrics_record_error(text, text, text, text) from public, anon;
grant execute on function public.metrics_record_session(integer, text, text, text, text, boolean) to authenticated;
grant execute on function public.metrics_record_error(text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Codici di invito rinnovati
-- -----------------------------------------------------------------------------
create or replace function metrics.trg_invite_rotated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invite_token is distinct from old.invite_token then
    perform metrics.bump('invites_rotated');
  end if;
  return null;
end;
$$;

revoke execute on function metrics.trg_invite_rotated() from public, anon, authenticated;

drop trigger if exists metrics_invite_rotated on public.households;
create trigger metrics_invite_rotated
  after update of invite_token on public.households
  for each row execute function metrics.trg_invite_rotated();

-- -----------------------------------------------------------------------------
-- 5. Aggregati nuovi
-- -----------------------------------------------------------------------------

-- mediana stimata dentro le fasce di durata (interpolazione lineare)
create or replace function metrics.mediana_fasce(p_conti bigint[])
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  limiti int[] := array[0, 10, 30, 60, 120, 300, 600, 1800, 3600];
  tot bigint := 0;
  cum bigint := 0;
  i int;
begin
  for i in 1..8 loop tot := tot + coalesce(p_conti[i], 0); end loop;
  if tot = 0 then return null; end if;
  for i in 1..8 loop
    if cum + coalesce(p_conti[i], 0) >= tot / 2.0 then
      return round(limiti[i] + (limiti[i + 1] - limiti[i])
                   * ((tot / 2.0 - cum) / greatest(p_conti[i], 1)));
    end if;
    cum := cum + coalesce(p_conti[i], 0);
  end loop;
  return null;
end;
$$;

create or replace function metrics.extra_data(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from date := least(p_from, p_to);
  v_to   date := greatest(p_from, p_to);
  v_out  jsonb;
begin
  with
  -- distribuzione d'uso: giorni attivi per persona nel periodo
  per_persona as (
    select user_id, count(*) as giorni
    from metrics.active_days
    where day between v_from and v_to
    group by user_id
  ),
  sess as (
    select * from metrics.session_counts where day between v_from and v_to
  ),
  fasce as (
    select array_agg(coalesce(f.n, 0) order by g.i) as conti
    from generate_series(0, 7) g(i)
    left join (select fascia, sum(n) as n from sess group by fascia) f on f.fascia = g.i
  ),
  err as (
    select * from metrics.error_counts where day between v_from and v_to
  ),
  -- percorso di iscrizione: chi si è registrato nel periodo (ancora iscritto,
  -- esclusi gli account di metrics.excluded)
  coorte as (
    select u.id, u.email_confirmed_at
    from auth.users u
    where (u.created_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not exists (select 1 from metrics.excluded e where e.user_id = u.id)
  )
  select jsonb_build_object(
    'uso', jsonb_build_object(
      'persone',  (select count(*) from per_persona),
      'g1',       (select count(*) from per_persona where giorni = 1),
      'g2_5',     (select count(*) from per_persona where giorni between 2 and 5),
      'g6_15',    (select count(*) from per_persona where giorni between 6 and 15),
      'g16',      (select count(*) from per_persona where giorni >= 16),
      'mediana',  (select percentile_cont(0.5) within group (order by giorni) from per_persona)
    ),
    'sessioni', jsonb_build_object(
      'n',         coalesce((select sum(n) from sess), 0),
      'media_s',   (select round(sum(secondi)::numeric / nullif(sum(n), 0)) from sess),
      'mediana_s', (select metrics.mediana_fasce(conti) from fasce),
      'fasce',     (select to_jsonb(conti) from fasce),
      'offline',   coalesce((select sum(n) from sess where offline), 0),
      'modalita',    coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'valore', v) order by v desc)
                       from (select modalita k, sum(n) v from sess group by 1) x), '[]'::jsonb),
      'dispositivi', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'valore', v) order by v desc)
                       from (select dispositivo k, sum(n) v from sess group by 1) x), '[]'::jsonb),
      'versioni',    coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'valore', v) order by v desc)
                       from (select versione k, sum(n) v from sess group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
      'temi',        coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'valore', v) order by v desc)
                       from (select tema k, sum(n) v from sess group by 1) x), '[]'::jsonb),
      'giorni',      coalesce((select jsonb_agg(jsonb_build_object('giorno', g::date,
                         'n', coalesce((select sum(n) from sess where day = g::date), 0),
                         'media_s', coalesce((select round(sum(secondi)::numeric / nullif(sum(n), 0))
                                              from sess where day = g::date), 0)) order by g)
                       from generate_series(v_from, v_to, interval '1 day') g), '[]'::jsonb)
    ),
    'errori', jsonb_build_object(
      'n', coalesce((select sum(n) from err), 0),
      'giorni', coalesce((select jsonb_agg(jsonb_build_object('giorno', g::date,
                    'n', coalesce((select sum(n) from err where day = g::date), 0)) order by g)
                  from generate_series(v_from, v_to, interval '1 day') g), '[]'::jsonb),
      'frequenti', coalesce((select jsonb_agg(jsonb_build_object('tipo', tipo, 'messaggio', messaggio,
                        'pagina', pagina, 'versione', versione, 'n', n) order by n desc)
                     from (select tipo, messaggio, pagina, max(versione) as versione, sum(n) as n
                           from err group by tipo, messaggio, pagina
                           order by 5 desc limit 10) x), '[]'::jsonb)
    ),
    'percorso', jsonb_build_object(
      'registrati', (select count(*) from coorte),
      'confermati', (select count(*) from coorte where email_confirmed_at is not null),
      'profilo',    (select count(*) from coorte c join public.profiles p on p.id = c.id
                      where p.completed_at is not null),
      'lista',      (select count(*) from coorte c
                      where exists (select 1 from public.household_members m where m.user_id = c.id)),
      'prodotto',   (select count(*) from coorte c
                      where exists (select 1 from public.list_entries e where e.added_by = c.id)
                         or exists (select 1 from public.purchases p where p.added_by = c.id))
    ),
    'funzioni', jsonb_build_object(
      'inviti_rinnovati', coalesce((select sum(n) from metrics.daily_counts
                                    where metric = 'invites_rotated' and day between v_from and v_to), 0)
    )
  ) into v_out;
  return v_out;
end;
$$;

-- iscrizioni: dai contatori (restano anche gli account poi cancellati), meno
-- quelle degli account esclusi ancora presenti
create or replace function metrics.iscrizioni()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  esclusi as (
    select (p.created_at at time zone 'Europe/Rome')::date as day, count(*) as n
    from public.profiles p join metrics.excluded e on e.user_id = p.id
    group by 1
  ),
  giorni as (
    select c.day, c.n - coalesce(e.n, 0) as n
    from metrics.daily_counts c left join esclusi e on e.day = c.day
    where c.metric = 'signups'
  ),
  t as (select metrics.today() as oggi)
  select jsonb_build_object(
    'totale', coalesce((select sum(n) from giorni), 0),
    'settimane', (select jsonb_agg(jsonb_build_object('da', w::date,
                    'n', coalesce((select sum(n) from giorni where day >= w::date and day < w::date + 7), 0)) order by w)
                  from t, generate_series(date_trunc('week', t.oggi) - interval '11 weeks',
                                          date_trunc('week', t.oggi), interval '1 week') w),
    'mesi', (select jsonb_agg(jsonb_build_object('da', m::date,
               'n', coalesce((select sum(n) from giorni
                              where day >= m::date and day < (m + interval '1 month')::date), 0)) order by m)
             from t, generate_series(date_trunc('month', t.oggi) - interval '11 months',
                                     date_trunc('month', t.oggi), interval '1 month') m),
    'anni', coalesce((select jsonb_agg(jsonb_build_object('anno', a, 'n', n) order by a)
                      from (select extract(year from day)::int a, sum(n) n from giorni group by 1) x), '[]'::jsonb)
  );
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- metrics_app e istantanea con i dati nuovi
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
  return metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to);
end;
$$;

create or replace function metrics.periodo(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to);
$$;

-- Nel periodo "prima" (serve solo ai confronti) le serie per giorno non
-- servono: si tolgono per tenere leggera l'istantanea.
create or replace function metrics.periodo_corto(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (x - 'giorni')
         || jsonb_build_object('sessioni', (x -> 'sessioni') - 'giorni',
                               'errori', (x -> 'errori') - 'giorni' - 'frequenti')
  from (select metrics.periodo(p_from, p_to) as x) s;
$$;

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
    'iscrizioni', metrics.iscrizioni(),
    'periodi', jsonb_build_object(
      'oggi',   jsonb_build_object('ora', metrics.periodo(t, t),
                                   'prima', metrics.periodo_corto(t - 1, t - 1)),
      '7',      jsonb_build_object('ora', metrics.periodo(t - 6, t),
                                   'prima', metrics.periodo_corto(t - 13, t - 7)),
      '30',     jsonb_build_object('ora', metrics.periodo(t - 29, t),
                                   'prima', metrics.periodo_corto(t - 59, t - 30)),
      'sempre', jsonb_build_object('ora', metrics.periodo(t - 364, t),
                                   'prima', null)
    )
  );
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;
grant execute on function public.metrics_app(date, date) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Conservazione
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'frigolo-metrics-v3-cleanup') then
    perform cron.unschedule('frigolo-metrics-v3-cleanup');
  end if;
  perform cron.schedule(
    'frigolo-metrics-v3-cleanup',
    '35 2 * * *',
    $job$
      delete from metrics.rate_limit where ora < now() - interval '1 day';
      delete from metrics.session_counts where day < (now() at time zone 'Europe/Rome')::date - 400;
      delete from metrics.error_counts where day < (now() at time zone 'Europe/Rome')::date - 400;
    $job$
  );
end;
$$;
