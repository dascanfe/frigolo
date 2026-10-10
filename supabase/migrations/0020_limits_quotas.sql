-- =============================================================================
-- Frigolo - 0020: limiti di lunghezza e quote (audit M4)
--
-- Perché: con le registrazioni aperte un solo utente malintenzionato potrebbe
-- riempire i 500 MB del piano Free (il database va in sola lettura e l'app si
-- ferma per tutti). Servono un tetto a ogni testo libero e un numero massimo
-- di righe per lista.
--
-- 1. Vincoli di lunghezza: aggiunti NOT VALID (valgono subito per le righe
--    nuove o modificate) e poi validati sulle righe esistenti. Se una riga
--    vecchia in produzione non li rispetta, la validazione viene saltata con
--    un avviso invece di far fallire la migration.
-- 2. Quote per lista, controllate da trigger solo per le scritture dei client
--    (ruolo authenticated). Le funzioni security definer e i job notturni
--    (es. auto_complete_trips) non sono limitati, così un tetto raggiunto non
--    blocca mai il salvataggio della spesa:
--      - 500 prodotti creati dalle persone della lista;
--      - 300 prodotti nella lista attiva (da comprare + nel carrello);
--      - 30 spese create in 24 ore per lista;
--      - 300 prodotti per spesa.
--    Le quote valgono su insert e update.
--    Ogni errore ha in HINT una chiave stabile (items_quota, entries_quota,
--    trips_quota, purchases_quota). Il limite di liste per utente (2) e di
--    persone per lista (5) è nelle RPC del 0019.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Lunghezze
-- -----------------------------------------------------------------------------
create or replace function public.text_array_max_len(p_arr text[], p_max int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(char_length(x) <= p_max), true) from unnest(p_arr) as x;
$$;

revoke execute on function public.text_array_max_len(text[], int) from public, anon;
grant execute on function public.text_array_max_len(text[], int) to authenticated;

-- sostituito da household_members_color_palette_check
alter table public.household_members drop constraint if exists household_members_color_len_check;

do $$
declare
  c record;
begin
  for c in
    select * from (values
      ('households',        'households_stores_len_check',        'public.text_array_max_len(stores, 40)'),
      ('list_entries',      'list_entries_unit_len_check',        'unit is null or char_length(unit) <= 10'),
      ('list_entries',      'list_entries_quantity_max_check',    'quantity <= 9999'),
      ('purchases',         'purchases_unit_len_check',           'unit is null or char_length(unit) <= 10'),
      ('purchases',         'purchases_quantity_check',           'quantity > 0 and quantity <= 9999'),
      ('items',             'items_icon_len_check',               'char_length(icon) <= 40'),
      ('items',             'items_season_months_len_check',      'cardinality(season_months) <= 12'),
      ('household_members', 'household_members_color_palette_check', 'color is null or color = any (public.member_colors())'),
      ('household_members', 'household_members_avatar_len_check', 'avatar_url is null or char_length(avatar_url) <= 300')
    ) as t(tbl, con, expr)
  loop
    if not exists (select 1 from pg_constraint where conname = c.con) then
      execute format('alter table public.%I add constraint %I check (%s) not valid', c.tbl, c.con, c.expr);
    end if;
    begin
      execute format('alter table public.%I validate constraint %I', c.tbl, c.con);
    exception when check_violation then
      raise notice 'Vincolo % non validato: righe esistenti fuori limite in %', c.con, c.tbl;
    end;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Quote
-- shopping_trips.created_at: momento vero dell'inserimento, imposto dal server
-- (started_at e completed_at li può scegliere il client, quindi non bastano
-- per contare le spese recenti).
-- -----------------------------------------------------------------------------
alter table public.shopping_trips
  add column if not exists created_at timestamptz not null default now();

create index if not exists shopping_trips_household_created_idx
  on public.shopping_trips (household_id, created_at desc);

create or replace function public.enforce_household_quotas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'shopping_trips' then
    new.created_at := case when tg_op = 'INSERT' then now() else old.created_at end;
  end if;

  -- solo le scritture dirette dei client; le funzioni definer girano come postgres
  if current_user <> 'authenticated' then
    return new;
  end if;

  -- negli update il controllo serve solo se cambia la lista o la spesa
  if tg_op = 'UPDATE' then
    if tg_table_name = 'purchases' then
      if new.trip_id is not distinct from old.trip_id then
        return new;
      end if;
    elsif new.household_id is not distinct from old.household_id then
      return new;
    end if;
  end if;

  if tg_table_name = 'items' then
    if new.household_id is not null and
       (select count(*) from public.items where household_id = new.household_id) >= 500 then
      raise exception 'In questa lista ci sono già 500 prodotti creati: archiviane qualcuno.'
        using errcode = 'P0001', hint = 'items_quota';
    end if;
  elsif tg_table_name = 'list_entries' then
    if (select count(*) from public.list_entries where household_id = new.household_id) >= 300 then
      raise exception 'Ci sono già 300 prodotti in lista: è il massimo.'
        using errcode = 'P0001', hint = 'entries_quota';
    end if;
  elsif tg_table_name = 'shopping_trips' then
    if (select count(*) from public.shopping_trips
        where household_id = new.household_id
          and created_at > now() - interval '24 hours') >= 30 then
      raise exception 'Oggi in questa lista sono già state registrate 30 spese: riprova domani.'
        using errcode = 'P0001', hint = 'trips_quota';
    end if;
  elsif tg_table_name = 'purchases' then
    if (select count(*) from public.purchases where trip_id = new.trip_id) >= 300 then
      raise exception 'In una spesa ci stanno al massimo 300 prodotti.'
        using errcode = 'P0001', hint = 'purchases_quota';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_household_quotas() from public, anon, authenticated;

drop trigger if exists items_quota on public.items;
create trigger items_quota
  before insert or update of household_id on public.items
  for each row execute function public.enforce_household_quotas();

drop trigger if exists list_entries_quota on public.list_entries;
create trigger list_entries_quota
  before insert or update of household_id on public.list_entries
  for each row execute function public.enforce_household_quotas();

drop trigger if exists shopping_trips_quota on public.shopping_trips;
create trigger shopping_trips_quota
  before insert or update on public.shopping_trips
  for each row execute function public.enforce_household_quotas();

drop trigger if exists purchases_quota on public.purchases;
create trigger purchases_quota
  before insert or update of trip_id on public.purchases
  for each row execute function public.enforce_household_quotas();

-- -----------------------------------------------------------------------------
-- Update per colonna: i client aggiornano delle spese solo le colonne che
-- servono a complete_shopping_trip; gli acquisti non si modificano.
-- -----------------------------------------------------------------------------
revoke update on public.purchases from anon, authenticated;
revoke update on public.shopping_trips from anon, authenticated;
grant update (store, started_at, completed_at, completed_by) on public.shopping_trips to authenticated;
