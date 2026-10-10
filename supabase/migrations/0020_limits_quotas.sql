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
--      - 500 prodotti personalizzati per lista;
--      - 300 voci nella lista attiva;
--      - 30 spese create in 24 ore per lista;
--      - 300 acquisti per spesa.
--    Il limite di liste per utente (50) e di membri per lista (20) è nelle
--    RPC del 0019.
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
      ('household_members', 'household_members_color_len_check',  'color is null or char_length(color) <= 20'),
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
    new.created_at := now();
  end if;

  -- solo le scritture dirette dei client; le funzioni definer girano come postgres
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_table_name = 'items' then
    if new.household_id is not null and
       (select count(*) from public.items where household_id = new.household_id) >= 500 then
      raise exception 'Troppi prodotti personalizzati in questa lista (massimo 500)' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'list_entries' then
    if (select count(*) from public.list_entries where household_id = new.household_id) >= 300 then
      raise exception 'Troppe voci nella lista (massimo 300)' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'shopping_trips' then
    if (select count(*) from public.shopping_trips
        where household_id = new.household_id
          and created_at > now() - interval '24 hours') >= 30 then
      raise exception 'Troppe spese registrate oggi in questa lista' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'purchases' then
    if (select count(*) from public.purchases where trip_id = new.trip_id) >= 300 then
      raise exception 'Troppi articoli in questa spesa (massimo 300)' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_household_quotas() from public, anon, authenticated;

drop trigger if exists items_quota on public.items;
create trigger items_quota
  before insert on public.items
  for each row execute function public.enforce_household_quotas();

drop trigger if exists list_entries_quota on public.list_entries;
create trigger list_entries_quota
  before insert on public.list_entries
  for each row execute function public.enforce_household_quotas();

drop trigger if exists shopping_trips_quota on public.shopping_trips;
create trigger shopping_trips_quota
  before insert on public.shopping_trips
  for each row execute function public.enforce_household_quotas();

drop trigger if exists purchases_quota on public.purchases;
create trigger purchases_quota
  before insert on public.purchases
  for each row execute function public.enforce_household_quotas();
