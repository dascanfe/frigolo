-- =============================================================================
-- Verifica delle metriche d'uso (0024). SOLO IN LOCALE.
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/checks/metriche.sql
--
-- Simula utenti e azioni come fa PostgREST (ruolo e JWT), controlla con assert
-- che contatori, giorni attivi e permessi funzionino, e alla fine annulla
-- tutto (rollback): il database resta com'era.
-- =============================================================================

\set QUIET on
\o /dev/null
begin;

create function pg_temp.as_user(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.as_postgres() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.conta(p_metric text) returns int language sql as $$
  select coalesce(sum(n), 0)::int from metrics.daily_counts
  where metric = p_metric and day = (now() at time zone 'Europe/Rome')::date;
$$;

grant execute on function pg_temp.as_user(uuid) to authenticated, anon;
grant execute on function pg_temp.as_anon() to authenticated, anon;
grant execute on function pg_temp.as_postgres() to authenticated, anon;

create temp table prima (metric text primary key, n int);
create temp table ids (k text primary key, id uuid, code text);
grant all on ids to authenticated;

insert into prima
select m, pg_temp.conta(m)
from unnest(array['signups', 'profiles_completed', 'lists_created', 'lists_deleted', 'items_added',
                  'trips_manual', 'invites_used', 'accounts_deleted']) m;

-- -----------------------------------------------------------------------------
-- Utenti: M1 (sarà l'amministratore), M2 e M3 normali
-- -----------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1@example.test', '{"display_name":"Emme Uno"}', now(), now()),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2@example.test', '{"display_name":"Emme Due"}', now(), now()),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm3@example.test', '{}', now(), now());

do $$
begin
  assert pg_temp.conta('signups') = (select n from prima where metric = 'signups') + 3, 'tre registrazioni contate';
  assert pg_temp.conta('profiles_completed') = (select n from prima where metric = 'profiles_completed') + 2,
    'due profili già completi alla registrazione';
end $$;

-- M2 crea una lista, aggiunge due prodotti, M3 completa il profilo ed entra con l'invito
select pg_temp.as_user('d0000000-0000-0000-0000-000000000002');
insert into ids select 'L', public.create_household('Lista metriche');
insert into public.list_entries (household_id, item_id, added_by)
select (select id from ids where k = 'L'), i.id, auth.uid()
from public.items i where i.household_id is null order by i.name limit 2;

select pg_temp.as_postgres();
update ids set code = h.join_code from public.households h where h.id = ids.id;

select pg_temp.as_user('d0000000-0000-0000-0000-000000000003');
select public.update_my_profile('Emme Tre');
select public.join_household((select code from ids where k = 'L'));
select public.join_household('ZZZZZZZZ');   -- codice sbagliato: tentativo fallito

-- M2 completa la spesa
select pg_temp.as_user('d0000000-0000-0000-0000-000000000002');
update public.list_entries set status = 'cart', checked_at = now()
where household_id = (select id from ids where k = 'L');
select public.complete_shopping_trip((select id from ids where k = 'L'), 'Lidl');

select pg_temp.as_postgres();
do $$
declare
  v_today date := (now() at time zone 'Europe/Rome')::date;
begin
  assert pg_temp.conta('lists_created') = (select n from prima where metric = 'lists_created') + 1, 'lista creata contata';
  assert pg_temp.conta('items_added') = (select n from prima where metric = 'items_added') + 2, 'due prodotti aggiunti';
  assert pg_temp.conta('profiles_completed') = (select n from prima where metric = 'profiles_completed') + 3,
    'profilo completato nell onboarding contato';
  assert pg_temp.conta('invites_used') = (select n from prima where metric = 'invites_used') + 1, 'invito usato contato';
  assert pg_temp.conta('trips_manual') = (select n from prima where metric = 'trips_manual') + 1, 'spesa completata contata';
  assert exists (select 1 from metrics.active_days where user_id = 'd0000000-0000-0000-0000-000000000002' and day = v_today),
    'M2 attivo oggi';
  assert exists (select 1 from metrics.active_days where user_id = 'd0000000-0000-0000-0000-000000000003' and day = v_today),
    'M3 attivo oggi';
  assert not exists (select 1 from metrics.active_days where user_id = 'd0000000-0000-0000-0000-000000000001'),
    'M1 non ha fatto niente: non attivo';
end $$;

-- -----------------------------------------------------------------------------
-- Permessi
-- -----------------------------------------------------------------------------
select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
do $$
begin
  begin
    perform public.metrics_app(current_date - 7, current_date);
    assert false, 'un utente qualunque legge le metriche';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from metrics.daily_counts;
    assert false, 'un utente legge le tabelle di metrics';
  exception when insufficient_privilege then null;
  end;
  begin
    perform metrics.bump('signups', 1000);
    assert false, 'un utente gonfia i contatori';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into metrics.admins (user_id) values (auth.uid());
    assert false, 'un utente si fa amministratore';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.as_anon();
do $$
begin
  begin
    perform public.metrics_app(current_date - 7, current_date);
    assert false, 'anon legge le metriche';
  exception when insufficient_privilege then null;
  end;
end $$;

-- M1 diventa amministratore (come farà Daniele dal pannello SQL)
select pg_temp.as_postgres();
insert into metrics.admins (user_id) values ('d0000000-0000-0000-0000-000000000001');

select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
do $$
declare
  v jsonb := public.metrics_app(current_date - 6, current_date);
begin
  assert v ? 'oggi' and v ? 'periodo_tot' and v ? 'retention' and v ? 'giorni' and v ? 'spazio', 'struttura del JSON';
  assert jsonb_array_length(v -> 'giorni') = 7, 'una voce per giorno';
  assert (v -> 'periodo_tot' ->> 'inviti_falliti')::int >= 1, 'tentativo fallito di oggi contato';
  assert (v -> 'oggi' ->> 'liste_condivise')::int >= 1, 'lista con 2 persone';
  assert (v -> 'oggi' ->> 'attivi_oggi')::int >= 2, 'M2 e M3 attivi oggi';
  assert (v -> 'spazio' ->> 'db_byte')::bigint > 0, 'dimensione del database';
  assert v::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'nessun id nel risultato';
  assert v::text !~* '@', 'nessuna email nel risultato';
  begin
    perform public.metrics_app(current_date - 500, current_date);
    assert false, 'periodo troppo lungo accettato';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Account eliminato: contatore e giorni attivi spariscono con l'account,
-- la lista rimasta vuota conta come eliminata
-- -----------------------------------------------------------------------------
select pg_temp.as_postgres();
delete from auth.users where id in ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
do $$
begin
  assert pg_temp.conta('accounts_deleted') = (select n from prima where metric = 'accounts_deleted') + 2, 'account eliminati contati';
  assert pg_temp.conta('lists_deleted') = (select n from prima where metric = 'lists_deleted') + 1, 'lista vuota eliminata contata';
  assert not exists (select 1 from metrics.active_days
                     where user_id in ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003')),
    'giorni attivi cancellati con l account';
  assert pg_temp.conta('signups') = (select n from prima where metric = 'signups') + 3,
    'le registrazioni passate restano nello storico';
end $$;

-- -----------------------------------------------------------------------------
-- 0025: esclusi, istantanea, invio senza segreti
-- -----------------------------------------------------------------------------
select pg_temp.as_postgres();
insert into metrics.excluded (user_id) values ('d0000000-0000-0000-0000-000000000001') on conflict do nothing;
create temp table prima2 as select pg_temp.conta('lists_created') as liste;
select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
select public.create_household('Lista di chi e escluso');
select pg_temp.as_postgres();
do $$
declare
  v jsonb := metrics.snapshot();
begin
  assert pg_temp.conta('lists_created') = (select liste from prima2), 'le azioni di chi e escluso non contano';
  assert not exists (select 1 from metrics.active_days where user_id = 'd0000000-0000-0000-0000-000000000001'),
    'chi e escluso non risulta attivo';
  assert (v -> 'periodi') ?& array['oggi', '7', '30', 'sempre'], 'quattro periodi';
  assert jsonb_array_length(v -> 'periodi' -> '7' -> 'ora' -> 'giorni') = 7, 'sette giorni';
  assert v::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'nessun id nell istantanea';
end $$;

select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
do $$
begin
  begin
    perform metrics.push_snapshot();
    assert false, 'un utente lancia l invio';
  exception when insufficient_privilege then null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- 0026: sessioni, errori, distribuzione, percorso, iscrizioni
-- -----------------------------------------------------------------------------
select pg_temp.as_postgres();
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
values ('d0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'm9@example.test', '{"display_name":"Nove"}', now(), now(), now());
create temp table s0 as select coalesce(sum(n), 0) as n from metrics.session_counts;
create temp table e0 as select coalesce(sum(n), 0) as n from metrics.error_counts;

select pg_temp.as_user('d0000000-0000-0000-0000-000000000009');
select public.metrics_record_session(95, '1.5.0', 'standalone', 'ios', 'lampone', false);
select public.metrics_record_session(20, '1.5.0', 'browser', 'android', 'tema-strano', true);
select public.metrics_record_session(0, '1.5.0', 'browser', 'android', 'mare', false);   -- ignorata
select public.metrics_record_error('query',
  'Errore per mario.rossi@example.com su 3f2b1c4d-1111-4222-8333-444455556666 codice 123456 https://x.it/a?token=segreto',
  '1.5.0', '/invito/AbC123xyz789?x=1');
select public.create_household('Lista di Nove');

-- chi e' escluso non lascia traccia
select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
select public.metrics_record_session(300, '1.5.0', 'standalone', 'ios', 'mare', false);
select public.metrics_record_error('errore', 'non deve contare', '1.5.0', '/');

select pg_temp.as_postgres();
do $$
declare
  m text;
  v jsonb;
begin
  assert (select coalesce(sum(n), 0) from metrics.session_counts) = (select n from s0) + 2, 'due sessioni contate';
  assert exists (select 1 from metrics.session_counts where tema = 'altro' and offline and fascia = 1), 'tema sconosciuto -> altro';
  assert (select coalesce(sum(n), 0) from metrics.error_counts) = (select n from e0) + 1, 'un errore contato';
  select messaggio into m from metrics.error_counts where tipo = 'query' order by n desc limit 1;
  assert m !~ '@' and m !~* '3f2b1c4d' and m !~ '123456' and m !~ 'segreto', 'messaggio ripulito: ' || m;
  assert exists (select 1 from metrics.error_counts where pagina = '/invito/:id'), 'pagina ripulita';
  assert metrics.ripulisci_pagina('/impostazioni') = '/impostazioni', 'le pagine normali restano';
  assert not exists (select 1 from information_schema.columns
                     where table_schema = 'metrics' and table_name in ('session_counts', 'error_counts')
                       and column_name = 'user_id'), 'nessun user_id nelle tabelle aggregate';

  v := metrics.periodo(metrics.today() - 6, metrics.today());
  assert v ? 'uso' and v ? 'sessioni' and v ? 'errori' and v ? 'percorso' and v ? 'funzioni', 'dati v3 nel periodo';
  assert (v -> 'percorso' ->> 'registrati')::int >= 1 and (v -> 'percorso' ->> 'confermati')::int >= 1, 'percorso';
  assert (v -> 'sessioni' ->> 'mediana_s') is not null, 'mediana delle sessioni';
  assert (metrics.iscrizioni() -> 'settimane') is not null and jsonb_array_length(metrics.iscrizioni() -> 'mesi') = 12, 'iscrizioni';
  assert pg_column_size(metrics.snapshot()) < 600000, 'istantanea leggera';
  assert v::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'nessun id';
end $$;

-- limite per ora: oltre 60 sessioni non si conta piu'
select pg_temp.as_postgres();
create temp table d0 as select coalesce(sum(n), 0) as n from metrics.session_counts where dispositivo = 'desktop';
select pg_temp.as_user('d0000000-0000-0000-0000-000000000009');
select public.metrics_record_session(15, '1.5.0', 'browser', 'desktop', 'mare', false) from generate_series(1, 70);
select pg_temp.as_postgres();
do $$
begin
  assert (select sum(n) from metrics.session_counts where dispositivo = 'desktop') = (select n from d0) + 58, 'limite di 60 sessioni all ora';
end $$;

select pg_temp.as_anon();
do $$
begin
  begin
    perform public.metrics_record_error('errore', 'x', '1', '/');
    assert false, 'anon registra errori';
  exception when insufficient_privilege then null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- 0028: eventi, ora delle sessioni, ingressi, dati v4
-- -----------------------------------------------------------------------------
select pg_temp.as_postgres();
create temp table c4 as select
  (select coalesce(sum(n), 0) from metrics.daily_counts where metric = 'ev_ricerca_vuota') as ricerche,
  (select coalesce(sum(n), 0) from metrics.daily_counts where metric = 'join_code') as codici,
  (select coalesce(sum(n), 0) from metrics.invite_delays) as ritardi;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('d0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'm10@example.test', '{"display_name":"Dieci"}', now(), now());
select pg_temp.as_user('d0000000-0000-0000-0000-000000000009');
select public.metrics_record_event('ricerca_vuota');
select public.metrics_record_event('testo libero non ammesso');
select pg_temp.as_user('d0000000-0000-0000-0000-000000000010');   -- M9 ha gia' esaurito il limite orario
select public.metrics_record_session(130, '2.1.0', 'standalone', 'ios', 'mare', false, 21);
select pg_temp.as_postgres();
update ids set code = h.join_code from public.households h where h.id = ids.id;
insert into ids select 'N', id, join_code from public.households where name = 'Lista di Nove';
select pg_temp.as_user('d0000000-0000-0000-0000-000000000010');
select public.join_household((select code from ids where k = 'N'));
select pg_temp.as_postgres();
do $$
declare
  v jsonb := metrics.periodo(metrics.today() - 6, metrics.today());
  g jsonb := metrics.globali_v4();
begin
  assert (select coalesce(sum(n), 0) from metrics.daily_counts where metric = 'ev_ricerca_vuota') = (select ricerche from c4) + 1,
    'evento contato, quello fuori elenco no';
  assert not exists (select 1 from metrics.daily_counts where metric like 'ev\_testo%'), 'niente eventi liberi';
  assert exists (select 1 from metrics.session_counts where ora = 21), 'ora di inizio salvata';
  assert (select coalesce(sum(n), 0) from metrics.daily_counts where metric = 'join_code') = (select codici from c4) + 1, 'ingresso con codice';
  assert (select coalesce(sum(n), 0) from metrics.invite_delays) = (select ritardi from c4) + 1, 'ritardo invito registrato';
  assert v ? 'prodotti_top' and v ? 'spesa' and v ? 'liste' and v ? 'orari' and v ? 'primo_uso' and v ? 'versioni', 'dati v4';
  assert jsonb_array_length(v -> 'spesa' -> 'calore') = 7 and jsonb_array_length(v -> 'spesa' -> 'calore' -> 0) = 24, 'mappa 7 x 24';
  assert (v -> 'eventi' ->> 'ricerca_vuota')::int >= 1, 'eventi nel periodo';
  assert g ? 'coorti' and g ? 'prodotti_top_sempre', 'globali';
  assert v::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'nessun id';
  assert pg_column_size(metrics.snapshot()) < 900000, 'istantanea leggera';
end $$;

select pg_temp.as_anon();
do $$
begin
  begin
    perform public.metrics_record_event('ricerca_vuota');
    assert false, 'anon registra eventi';
  exception when insufficient_privilege then null;
  end;
end $$;

\o
select 'metriche.sql: tutti i controlli passati' as esito;
rollback;
