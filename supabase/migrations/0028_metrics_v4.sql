-- =============================================================================
-- Frigolo - 0028: metriche v4 per il cruscotto
--
-- Sempre e solo aggregati. Le tabelle nuove non hanno user_id; dei prodotti si
-- mostrano i nomi solo per il catalogo base (items.household_id is null), mai
-- quelli creati dagli utenti, di cui si conta solo quanti ne nascono.
--
-- Cosa fa:
--   1. session_counts: ora di inizio della sessione (0-23, -1 per le righe
--      vecchie) e nuova firma di metrics_record_session con p_ora;
--   2. metrics_record_event(p_evento): eventi dell'app da un elenco chiuso
--      (ricerca senza risultato, installazione, aggiornamenti) nei contatori
--      giornalieri, con limite per ora ed esclusi ignorati;
--   3. join_household conta se l'ingresso è avvenuto con il link o con il
--      codice e quanto dopo la creazione o il rinnovo dell'invito (fasce);
--   4. contatore dei prodotti personalizzati creati;
--   5. metrics.extra_v4(da, a) e metrics.globali_v4(): prodotti e categorie,
--      quando si fa la spesa, supermercati, persone per lista, ingressi,
--      foto profilo, eventi, versioni, orari d'uso, tempi del primo uso,
--      coorti di ritorno. Entrano in metrics_app e nell'istantanea oraria.
--
-- Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ora di inizio delle sessioni
-- -----------------------------------------------------------------------------
alter table metrics.session_counts add column if not exists ora smallint not null default -1;

do $$
begin
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
    where i.indrelid = 'metrics.session_counts'::regclass and i.indisprimary and a.attname = 'ora'
  ) then
    alter table metrics.session_counts drop constraint session_counts_pkey;
    alter table metrics.session_counts
      add primary key (day, modalita, dispositivo, versione, tema, offline, fascia, ora);
  end if;
end;
$$;

comment on column metrics.session_counts.ora is 'Ora di inizio della sessione (0-23, ora del dispositivo). -1 = non nota (righe di prima della 0028).';

create or replace function public.metrics_record_session(
  p_secondi     integer,
  p_versione    text,
  p_modalita    text,
  p_dispositivo text,
  p_tema        text,
  p_offline     boolean,
  p_ora         integer
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
    (day, modalita, dispositivo, versione, tema, offline, fascia, ora, n, secondi)
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
    case when p_ora between 0 and 23 then p_ora else -1 end,
    1,
    v_sec
  )
  on conflict (day, modalita, dispositivo, versione, tema, offline, fascia, ora)
  do update set n = c.n + 1, secondi = c.secondi + excluded.secondi;
end;
$$;

-- la firma vecchia (app 2.0.x) resta e passa all'ora "non nota"
create or replace function public.metrics_record_session(
  p_secondi     integer,
  p_versione    text,
  p_modalita    text,
  p_dispositivo text,
  p_tema        text,
  p_offline     boolean
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select public.metrics_record_session(p_secondi, p_versione, p_modalita, p_dispositivo, p_tema, p_offline, -1);
$$;

revoke execute on function public.metrics_record_session(integer, text, text, text, text, boolean, integer) from public, anon;
grant execute on function public.metrics_record_session(integer, text, text, text, text, boolean, integer) to authenticated;
revoke execute on function public.metrics_record_session(integer, text, text, text, text, boolean) from public, anon;
grant execute on function public.metrics_record_session(integer, text, text, text, text, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Eventi dell'app (elenco chiuso)
-- -----------------------------------------------------------------------------
create or replace function public.metrics_record_event(p_evento text)
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
  if p_evento not in (
    'ricerca_vuota',
    'install_scheda', 'install_android_tocco', 'install_prompt_accettato',
    'install_prompt_rifiutato', 'install_guida_ios',
    'aggiorna_barra', 'aggiorna_tocco'
  ) then
    return;
  end if;
  if not metrics.consenti('evento', 60) then
    return;
  end if;
  perform metrics.bump('ev_' || p_evento);
end;
$$;

revoke execute on function public.metrics_record_event(text) from public, anon;
grant execute on function public.metrics_record_event(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Ingressi nelle liste: link o codice, e dopo quanto dall'invito
-- -----------------------------------------------------------------------------
create table if not exists metrics.invite_delays (
  day     date not null,
  fascia  smallint not null,
  n       integer not null default 0,
  primary key (day, fascia)
);

comment on table metrics.invite_delays is 'Ingressi nelle liste per tempo trascorso dalla creazione o dal rinnovo dell invito. fascia: 0 <1 h, 1 1-6 h, 2 6-24 h, 3 1-2 giorni, 4 2-4 giorni, 5 4-7 giorni.';

alter table metrics.invite_delays enable row level security;
revoke all on metrics.invite_delays from public, anon, authenticated;

create or replace function metrics.record_join(p_link boolean, p_emesso timestamptz)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ore numeric := extract(epoch from (now() - p_emesso)) / 3600;
begin
  if metrics.is_excluded() then
    return;
  end if;
  perform metrics.bump(case when p_link then 'join_link' else 'join_code' end);
  if v_ore is not null and v_ore >= 0 then
    insert into metrics.invite_delays as d (day, fascia, n)
    values (
      metrics.today(),
      case when v_ore < 1 then 0 when v_ore < 6 then 1 when v_ore < 24 then 2
           when v_ore < 48 then 3 when v_ore < 96 then 4 else 5 end,
      1
    )
    on conflict (day, fascia) do update set n = d.n + 1;
  end if;
end;
$$;

revoke execute on function metrics.record_join(boolean, timestamptz) from public, anon, authenticated;


-- join_household come nella 0019, con in più la registrazione dell'ingresso
create or replace function public.join_household(
  p_code          text,
  p_display_name  text default null,
  p_color         text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_id    uuid;
begin
  if v_user is null then
    raise exception 'Non autenticato.' using errcode = '42501', hint = 'not_authenticated';
  end if;

  perform public.assert_invite_rate_limit(v_user);

  v_id := public.find_household_by_invite(p_code);

  if v_id is null then
    perform public.record_failed_invite(v_user);
    return null;
  end if;

  -- già membro: niente da fare (link di invito riaperto)
  if exists (
    select 1 from public.household_members
    where household_id = v_id and user_id = v_user
  ) then
    return v_id;
  end if;

  -- blocchi: profilo (limite liste) e lista (limite membri)
  perform 1 from public.profiles where id = v_user for update;
  perform 1 from public.households where id = v_id for update;

  if (select count(*) from public.household_members where user_id = v_user)
     >= public.max_households_per_user() then
    raise exception 'Hai già il numero massimo di liste (%).', public.max_households_per_user()
      using errcode = 'P0001', hint = 'lists_limit';
  end if;

  if (select count(*) from public.household_members where household_id = v_id)
     >= public.max_members_per_household() then
    raise exception 'Questa lista ha già il numero massimo di persone (%).', public.max_members_per_household()
      using errcode = 'P0001', hint = 'members_limit';
  end if;

  perform public.apply_legacy_profile_args(v_user, p_display_name, p_color);

  insert into public.household_members (household_id, user_id)
  values (v_id, v_user);

  -- metriche (0028): ingresso con il link (token di 22 caratteri) o con il
  -- codice corto, e quanto tempo e' passato da quando l'invito e' stato
  -- creato o rinnovato (scade dopo 7 giorni: emesso = scadenza - 7 giorni)
  perform metrics.record_join(
    trim(coalesce(p_code, '')) ~ '^[A-Za-z0-9_-]{22}$',
    (select case when trim(coalesce(p_code, '')) ~ '^[A-Za-z0-9_-]{22}$'
                 then h.invite_token_expires_at else h.join_code_expires_at end - interval '7 days'
       from public.households h where h.id = v_id)
  );

  return v_id;
end;
$$;

revoke execute on function public.join_household(text, text, text) from public, anon;
grant execute on function public.join_household(text, text, text) to authenticated;
-- -----------------------------------------------------------------------------
-- 4. Prodotti personalizzati creati (solo il numero, mai il nome)
-- -----------------------------------------------------------------------------
create or replace function metrics.trg_custom_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.household_id is not null then
    perform metrics.bump('custom_items_created');
  end if;
  return null;
end;
$$;

revoke execute on function metrics.trg_custom_item() from public, anon, authenticated;

drop trigger if exists metrics_custom_item on public.items;
create trigger metrics_custom_item
  after insert on public.items
  for each row execute function metrics.trg_custom_item();

-- riempimento iniziale, una volta sola, dai prodotti personalizzati esistenti
do $$
begin
  if exists (select 1 from metrics.meta where key = 'backfill_custom_items') then
    return;
  end if;
  insert into metrics.daily_counts as c (day, metric, n)
  select (created_at at time zone 'Europe/Rome')::date, 'custom_items_created', count(*)::int
  from public.items
  where household_id is not null
  group by 1
  on conflict (day, metric) do update set n = c.n + excluded.n;
  insert into metrics.meta (key, value) values ('backfill_custom_items', now()::text);
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Aggregati v4
-- -----------------------------------------------------------------------------

-- mediana stimata dentro fasce con limiti dati (interpolazione lineare)
create or replace function metrics.mediana_limiti(p_conti bigint[], p_limiti numeric[])
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  tot bigint := 0;
  cum bigint := 0;
  i int;
begin
  for i in 1..cardinality(p_conti) loop tot := tot + coalesce(p_conti[i], 0); end loop;
  if tot = 0 then return null; end if;
  for i in 1..cardinality(p_conti) loop
    if cum + coalesce(p_conti[i], 0) >= tot / 2.0 then
      return round(p_limiti[i] + (p_limiti[i + 1] - p_limiti[i])
                   * ((tot / 2.0 - cum) / greatest(p_conti[i], 1)), 1);
    end if;
    cum := cum + coalesce(p_conti[i], 0);
  end loop;
  return null;
end;
$$;

-- liste con dentro un account escluso: fuori dalle metriche della spesa
create or replace function metrics.lista_esclusa(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    join metrics.excluded e on e.user_id = m.user_id
    where m.household_id = p_household
  );
$$;

create or replace function metrics.extra_v4(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from  date := least(p_from, p_to);
  v_to    date := greatest(p_from, p_to);
  v_giorni int := greatest(p_to - p_from, 0) + 1;
  v_out   jsonb;
begin
  with
  -- prodotti aggiunti nel periodo: quelli ancora in lista e quelli comprati
  aggiunte as (
    select e.item_id from public.list_entries e
    where (e.added_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not exists (select 1 from metrics.excluded x where x.user_id = e.added_by)
    union all
    select p.item_id from public.purchases p
    where (p.purchased_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not exists (select 1 from metrics.excluded x where x.user_id = p.added_by)
  ),
  con_item as (
    select i.name, i.household_id, c.name as categoria
    from aggiunte a
    join public.items i on i.id = a.item_id
    join public.categories c on c.id = i.category_id
  ),
  trips as (
    select s.id, s.store, s.completed_at
    from public.shopping_trips s
    where s.completed_at is not null
      and (s.completed_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not metrics.lista_esclusa(s.household_id)
  ),
  trip_liste as (
    select count(distinct s.household_id) as liste
    from public.shopping_trips s
    where s.completed_at is not null
      and (s.completed_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not metrics.lista_esclusa(s.household_id)
  ),
  per_trip as (
    select t.id, count(p.id) as prodotti
    from trips t join public.purchases p on p.trip_id = t.id
    group by t.id
  ),
  liste as (
    select h.id, count(m.user_id) as persone
    from public.households h
    left join public.household_members m on m.household_id = h.id
    where not metrics.lista_esclusa(h.id)
    group by h.id
  ),
  sess as (
    select * from metrics.session_counts where day between v_from and v_to
  ),
  ultima as (
    select versione from sess
    where versione ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,3}$'
    order by string_to_array(versione, '.')::int[] desc
    limit 1
  ),
  ritardi as (
    select array_agg(coalesce(d.n, 0)::bigint order by g.i) as conti
    from generate_series(0, 5) g(i)
    left join (select fascia, sum(n) as n from metrics.invite_delays
               where day between v_from and v_to group by fascia) d on d.fascia = g.i
  ),
  coorte as (
    select u.id, u.created_at
    from auth.users u
    where (u.created_at at time zone 'Europe/Rome')::date between v_from and v_to
      and not exists (select 1 from metrics.excluded e where e.user_id = u.id)
  ),
  primi as (
    select
      extract(epoch from (least(
        (select min(e.added_at) from public.list_entries e where e.added_by = c.id),
        (select min(p.purchased_at) from public.purchases p where p.added_by = c.id)
      ) - c.created_at)) / 3600 as prodotto,
      extract(epoch from ((
        select min(s.completed_at) from public.shopping_trips s
        join public.household_members m on m.household_id = s.household_id and m.user_id = c.id
      ) - c.created_at)) / 3600 as spesa,
      extract(epoch from ((
        select min(greatest(o.joined_at, m.joined_at)) from public.household_members m
        join public.household_members o on o.household_id = m.household_id and o.user_id <> m.user_id
        where m.user_id = c.id
      ) - c.created_at)) / 3600 as seconda
    from coorte c
  ),
  profili as (
    select p.avatar_path from public.profiles p
    where not exists (select 1 from metrics.excluded e where e.user_id = p.id)
  )
  select jsonb_build_object(
    'prodotti_top', coalesce((select jsonb_agg(jsonb_build_object('nome', name, 'valore', n) order by n desc, name)
                     from (select name, count(*) n from con_item where household_id is null
                           group by name order by 2 desc, 1 limit 20) x), '[]'::jsonb),
    'categorie', coalesce((select jsonb_agg(jsonb_build_object('nome', categoria, 'valore', n) order by n desc)
                  from (select categoria, count(*) n from con_item group by 1) x), '[]'::jsonb),
    'personalizzati_creati', coalesce((select sum(n) from metrics.daily_counts
                               where metric = 'custom_items_created' and day between v_from and v_to), 0),
    'spesa', jsonb_build_object(
      'n', (select count(*) from trips),
      'calore', (select jsonb_agg(riga order by d) from (
                   select d, jsonb_agg(coalesce((select count(*) from trips t
                       where extract(isodow from t.completed_at at time zone 'Europe/Rome') = d
                         and extract(hour from t.completed_at at time zone 'Europe/Rome') = h), 0) order by h) as riga
                   from generate_series(1, 7) d cross join generate_series(0, 23) h
                   group by d) x),
      'prodotti_medi', (select round(avg(prodotti), 1) from per_trip),
      'a_settimana_per_lista', (select round((select count(*) from trips)::numeric
                                  / nullif(liste, 0) / greatest(v_giorni / 7.0, 1), 2) from trip_liste),
      'supermercati', coalesce((select jsonb_agg(jsonb_build_object('nome', k, 'valore', n) order by n desc)
                        from (select case
                                when store in ('Lidl', 'Eurospin', 'Conad', 'Coop', 'Carrefour', 'MD', 'Mercato') then store
                                when store is null or trim(store) = '' then 'non indicato'
                                else 'altri' end as k, count(*) n
                              from trips group by 1) x), '[]'::jsonb)
    ),
    'liste', jsonb_build_object(
      'p1', (select count(*) from liste where persone = 1),
      'p2', (select count(*) from liste where persone = 2),
      'p3', (select count(*) from liste where persone = 3),
      'p4_5', (select count(*) from liste where persone >= 4),
      'ingressi_link', coalesce((select sum(n) from metrics.daily_counts
                         where metric = 'join_link' and day between v_from and v_to), 0),
      'ingressi_codice', coalesce((select sum(n) from metrics.daily_counts
                           where metric = 'join_code' and day between v_from and v_to), 0),
      'ore_invito_ingresso', (select metrics.mediana_limiti(conti, array[0, 1, 6, 24, 48, 96, 168]::numeric[]) from ritardi),
      'ritardi', (select to_jsonb(conti) from ritardi)
    ),
    'foto', jsonb_build_object(
      'profili', (select count(*) from profili),
      'con_foto', (select count(*) from profili where avatar_path is not null)
    ),
    'eventi', coalesce((select jsonb_object_agg(substr(metric, 4), n)
                from (select metric, sum(n) n from metrics.daily_counts
                      where metric like 'ev\_%' and day between v_from and v_to group by 1) x), '{}'::jsonb),
    'versioni', jsonb_build_object(
      'ultima', (select versione from ultima),
      'giorni', coalesce((select jsonb_agg(jsonb_build_object('giorno', g::date,
                   'n', coalesce((select sum(n) from sess where day = g::date), 0),
                   'ultima', coalesce((select sum(n) from sess where day = g::date
                                       and versione = (select versione from ultima)), 0)) order by g)
                 from generate_series(v_from, v_to, interval '1 day') g), '[]'::jsonb)
    ),
    'orari', (select jsonb_agg(riga order by d) from (
                select d, jsonb_agg(coalesce((select sum(n) from sess
                    where ora = h and extract(isodow from day) = d), 0) order by h) as riga
                from generate_series(1, 7) d cross join generate_series(0, 23) h
                group by d) x),
    'primo_uso', jsonb_build_object(
      'iscritti', (select count(*) from coorte),
      'ore_prodotto', (select round(percentile_cont(0.5) within group (order by prodotto)::numeric, 1)
                        from primi where prodotto >= 0),
      'n_prodotto', (select count(*) from primi where prodotto >= 0),
      'ore_spesa', (select round(percentile_cont(0.5) within group (order by spesa)::numeric, 1)
                     from primi where spesa >= 0),
      'n_spesa', (select count(*) from primi where spesa >= 0),
      'ore_seconda', (select round(percentile_cont(0.5) within group (order by seconda)::numeric, 1)
                       from primi where seconda >= 0),
      'n_seconda', (select count(*) from primi where seconda >= 0)
    )
  ) into v_out;
  return v_out;
end;
$$;

-- dati che non dipendono dal periodo: coorti di ritorno e prodotti da sempre
create or replace function metrics.globali_v4()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  t as (select metrics.today() as oggi),
  u as (
    select u.id,
           (u.created_at at time zone 'Europe/Rome')::date as d0,
           date_trunc('week', u.created_at at time zone 'Europe/Rome')::date as w
    from auth.users u, t
    where (u.created_at at time zone 'Europe/Rome')::date >= date_trunc('week', t.oggi)::date - 7 * 7
      and not exists (select 1 from metrics.excluded e where e.user_id = u.id)
  ),
  celle as (
    select u.w, k,
           count(*) filter (where u.d0 + 7 * k + 6 < t.oggi) as base,
           count(*) filter (where u.d0 + 7 * k + 6 < t.oggi and exists (
             select 1 from metrics.active_days a
             where a.user_id = u.id and a.day between u.d0 + 7 * k and u.d0 + 7 * k + 6)) as attivi
    from u cross join generate_series(1, 4) k cross join t
    group by u.w, k
  ),
  aggiunte as (
    select e.item_id from public.list_entries e
    where not exists (select 1 from metrics.excluded x where x.user_id = e.added_by)
    union all
    select p.item_id from public.purchases p
    where not exists (select 1 from metrics.excluded x where x.user_id = p.added_by)
  )
  select jsonb_build_object(
    'coorti', coalesce((select jsonb_agg(jsonb_build_object(
                 'settimana', w,
                 'iscritti', (select count(*) from u u2 where u2.w = c.w),
                 'settimane', (select jsonb_agg(jsonb_build_object('k', k, 'base', base, 'attivi', attivi) order by k)
                               from celle c2 where c2.w = c.w)) order by w)
               from (select distinct w from celle) c), '[]'::jsonb),
    'prodotti_top_sempre', coalesce((select jsonb_agg(jsonb_build_object('nome', name, 'valore', n) order by n desc, name)
                             from (select i.name, count(*) n from aggiunte a
                                   join public.items i on i.id = a.item_id and i.household_id is null
                                   group by i.name order by 2 desc, 1 limit 20) x), '[]'::jsonb)
  );
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- metrics_app, periodi e istantanea con i dati v4
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
  return metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to) || metrics.extra_v4(p_from, p_to);
end;
$$;

create or replace function metrics.periodo(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to) || metrics.extra_v4(p_from, p_to);
$$;

-- il periodo "prima" serve solo ai confronti: niente dati v4 e niente serie
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
  from (select metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to) as x) s;
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
    'globali', metrics.globali_v4(),
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
