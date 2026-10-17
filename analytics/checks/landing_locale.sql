-- =============================================================================
-- Prova della migration 0001_frigolo.sql su un database USA E GETTA.
--
-- Ricrea in piccolo le tabelle delle statistiche di dascanfe.com com'erano in
-- produzione il 2026-10-10 (letto dai cataloghi, nessun dato), con regole di
-- accesso uguali ma un'email finta, applica la migration due volte (deve essere
-- idempotente), inserisce visite finte e controlla gli aggregati.
--
--   createdb -h 127.0.0.1 -p 54322 -U postgres pepe_analytics_test
--   cd analytics && psql "postgresql://postgres:postgres@127.0.0.1:54322/pepe_analytics_test" \
--     -v ON_ERROR_STOP=1 -f checks/landing_locale.sql
--   dropdb -h 127.0.0.1 -p 54322 -U postgres pepe_analytics_test
--
-- Usa i ruoli anon e authenticated del Supabase locale.
-- =============================================================================

\set QUIET on
\o /dev/null

-- --- finto schema auth (come Supabase) ---------------------------------------
create schema if not exists auth;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- --- tabelle come in produzione ----------------------------------------------
create table if not exists public.visite (
  id uuid primary key default gen_random_uuid(),
  impronta text not null,
  iniziata timestamptz not null default now(),
  vista_ultima timestamptz not null default now(),
  referente text, referente_host text, canale text,
  utm_source text, utm_medium text, utm_campaign text,
  paese text, paese_iso char(2), regione text, citta text, fuso text,
  dispositivo text, sistema text, sistema_ver text, browser text, browser_ver text,
  schermo_w int, schermo_h int, area_w int, area_h int, densita numeric(4,2), lingua text,
  bot boolean not null default false, bot_motivo text, rete text
);
create table if not exists public.pagine (
  id uuid primary key,
  visita_id uuid not null references public.visite(id) on delete cascade,
  percorso text not null, titolo text, lingua text,
  aperta timestamptz not null default now(), chiusa timestamptz,
  ms_attivi int not null default 0, ms_totali int not null default 0,
  scroll_max smallint not null default 0, click smallint not null default 0,
  sezioni jsonb not null default '{}'::jsonb, sezione_ora text
);
create table if not exists public.eventi (
  id bigserial primary key,
  visita_id uuid not null references public.visite(id) on delete cascade,
  pagina_id uuid references public.pagine(id) on delete cascade,
  quando timestamptz not null default now(),
  tipo text not null, nome text, destinazione text
);
create table if not exists public.stato_sistema (
  id int primary key default 1, battito timestamptz not null default now(), nota text,
  geo_aggiornato timestamptz, geo_nota text
);
insert into public.stato_sistema (id) values (1) on conflict do nothing;

do $$
declare t text;
begin
  foreach t in array array['visite', 'pagine', 'eventi', 'stato_sistema'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lettura proprietario" on public.%I', t);
    execute format($p$create policy "lettura proprietario" on public.%I for select to authenticated
                     using (auth.jwt() ->> 'email' = 'proprietario@example.test')$p$, t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- --- la migration, due volte -------------------------------------------------
\i migrations/0001_frigolo.sql
\i migrations/0001_frigolo.sql

-- --- dati finti ----------------------------------------------------------------
truncate public.visite cascade;

-- V1: da Instagram con UTM, iPhone, apre Frigolo e offre un caffè
-- V2: diretta, Android, guarda le istruzioni Android e apre Frigolo (t.js: riconosciuta dal link)
-- V3: da Google, desktop, rimbalzo (5 secondi, nessun clic)
-- V4: robot sulla landing
-- V5: visita al resto del sito (non conta)
insert into public.visite (id, impronta, iniziata, canale, referente_host, utm_source, utm_medium, utm_campaign, dispositivo, sistema, paese, bot) values
  ('00000000-0000-4000-8000-000000000001', 'imp-a', now() - interval '1 hour',  'campagna', 'instagram.com', 'instagram', 'social', 'lancio', 'mobile',  'iOS',     'Italia', false),
  ('00000000-0000-4000-8000-000000000002', 'imp-b', now() - interval '26 hours', 'diretto', null, null, null, null, 'mobile',  'Android', 'Italia', false),
  ('00000000-0000-4000-8000-000000000003', 'imp-c', now() - interval '2 hours', 'organico', 'google.com', null, null, null, 'desktop', 'macOS', 'Svizzera', false),
  ('00000000-0000-4000-8000-000000000004', 'imp-d', now() - interval '3 hours', 'diretto', null, null, null, null, 'desktop', 'Linux', null, true),
  ('00000000-0000-4000-8000-000000000005', 'imp-e', now() - interval '3 hours', 'diretto', null, null, null, null, 'desktop', 'Windows', 'Italia', false);

insert into public.pagine (id, visita_id, percorso, aperta, ms_attivi, scroll_max) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '/sub/frigolo/', now() - interval '1 hour', 42000, 90),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '/sub/frigolo/', now() - interval '26 hours', 61000, 100),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', '/sub/frigolo', now() - interval '2 hours', 5000, 10),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', '/sub/frigolo/', now() - interval '3 hours', 0, 0),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000005', '/projects/shelfee.html', now() - interval '3 hours', 9000, 50),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000005', '/sub/frigolone/', now() - interval '3 hours', 9000, 50);

insert into public.eventi (visita_id, pagina_id, tipo, nome, destinazione) values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'uscita', 'frigolo:apri-app', 'https://frigolo.dascanfe.com/'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'uscita', 'frigolo:caffe', 'https://paypal.me/x'),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'click', 'frigolo:installa-android', null),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'uscita', 'Apri Frigolo', 'https://frigolo.dascanfe.com/?utm_source=landing'),
  ('00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'uscita', 'frigolo:apri-app', 'https://frigolo.dascanfe.com/');

-- --- controlli -------------------------------------------------------------------
do $$
begin
  assert (select sito from public.pagine where id = '10000000-0000-4000-8000-000000000001') = 'frigolo', 'landing riconosciuta';
  assert (select sito from public.pagine where id = '10000000-0000-4000-8000-000000000003') = 'frigolo', 'senza barra finale';
  assert (select sito from public.pagine where id = '10000000-0000-4000-8000-000000000006') = 'dascanfe', 'frigolone non è frigolo';
end $$;

-- anon: niente
set role anon;
do $$
begin
  begin
    perform public.frigolo_landing(now() - interval '7 days', now());
    assert false, 'anon legge';
  exception when insufficient_privilege then null;
  end;
end $$;

-- un utente qualunque: errore, non zero
reset role;
select set_config('request.jwt.claims', '{"role":"authenticated","email":"altro@example.test"}', false);
set role authenticated;
do $$
begin
  begin
    perform public.frigolo_landing(now() - interval '7 days', now());
    assert false, 'un altro utente legge (o riceve zeri)';
  exception when insufficient_privilege then null;
  end;
end $$;

-- il proprietario
reset role;
select set_config('request.jwt.claims', '{"role":"authenticated","email":"proprietario@example.test"}', false);
set role authenticated;
do $$
declare
  v jsonb := public.frigolo_landing(now() - interval '7 days', now() + interval '1 minute');
  o jsonb;
begin
  assert (v ->> 'visite')::int = 3, 'tre visite vere alla landing: ' || (v ->> 'visite');
  assert (v ->> 'visitatori')::int = 3, 'tre visitatori stimati';
  assert (v ->> 'robot')::int = 1, 'un robot escluso';
  assert (v ->> 'rimbalzi')::int = 1, 'un rimbalzo';
  assert (v ->> 'visite_con_obiettivo')::int = 2, 'due visite con un clic che conta';
  select x into o from jsonb_array_elements(v -> 'obiettivi') x where x ->> 'nome' = 'apri-app';
  assert (o ->> 'clic')::int = 2 and (o ->> 'visite')::int = 2, 'Apri Frigolo: 2 clic in 2 visite (robot escluso)';
  assert exists (select 1 from jsonb_array_elements(v -> 'obiettivi') x where x ->> 'nome' = 'caffe'), 'caffè';
  assert (v ->> 'visite_verso_app')::int = 2, 'due visite verso l app';
  assert exists (select 1 from jsonb_array_elements(v -> 'obiettivi') x where x ->> 'nome' = 'installa-android'), 'istruzioni';
  assert jsonb_array_length(v -> 'giorni') = 8, 'otto giorni';
  assert (v -> 'classifiche' -> 'utm_campaign' -> 0 ->> 'nome') = 'lancio', 'campagna';
  assert jsonb_array_length(v -> 'classifiche' -> 'sistemi') = 3, 'tre sistemi (Windows è del resto del sito)';
  assert v::text !~ 'imp-', 'nessuna impronta nel risultato';
  begin
    perform public.frigolo_landing(now() - interval '500 days', now());
    assert false, 'periodo troppo lungo';
  exception when invalid_parameter_value then null;
  end;
end $$;

reset role;
\o
select 'landing_locale.sql: tutti i controlli passati' as esito;
