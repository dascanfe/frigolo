-- =============================================================================
-- Frigolo - 0011: lista supermercati per casa (modificabile) + rinomina atomica
-- custom_stores diventa "stores": la lista completa della casa, inizializzata
-- con i predefiniti. Cosi' si possono rinominare o togliere anche quelli di
-- default. rename_store aggiorna insieme la lista e gli articoli in lista.
-- =============================================================================

alter table public.households rename column custom_stores to stores;
alter table public.households alter column stores set default array[
  'Lidl', 'Conad', 'Cadoro', 'Lando', 'Prix', 'Maxi', 'Ali''', 'Aldi', 'Carrefour',
  'Action', 'Legàmi', 'Normal', 'Tigotà', 'Acqua & Sapone', 'Amazon'
]::text[];
alter table public.households drop constraint if exists households_custom_stores_check;
alter table public.households add constraint households_stores_check check (cardinality(stores) <= 60);

-- le case esistenti: predefiniti + eventuali personalizzati (senza doppioni)
update public.households h
set stores = (
  select array_agg(s order by ord)
  from (
    select s, min(ord) as ord
    from unnest(
      array['Lidl', 'Conad', 'Cadoro', 'Lando', 'Prix', 'Maxi', 'Ali''', 'Aldi', 'Carrefour',
            'Action', 'Legàmi', 'Normal', 'Tigotà', 'Acqua & Sapone', 'Amazon'] || h.stores
    ) with ordinality as t(s, ord)
    group by s
  ) d
);

comment on column public.households.stores is 'Supermercati della casa: predefiniti all inizio, poi modificabili (aggiungi, rinomina, elimina).';

-- rinomina (o elimina, con p_new null) un supermercato: lista + articoli in lista
create or replace function public.rename_store(
  p_household_id  uuid,
  p_old           text,
  p_new           text default null
)
returns text[]
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_new    text := nullif(trim(p_new), '');
  v_stores text[];
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questo household' using errcode = '42501';
  end if;

  select stores into v_stores from public.households where id = p_household_id for update;

  if v_new is null then
    -- eliminazione: via dalla lista, gli articoli tornano senza supermercato
    v_stores := array_remove(v_stores, p_old);
    update public.list_entries set store = null
    where household_id = p_household_id and store = p_old;
  else
    if v_new <> p_old and v_new = any (v_stores) then
      raise exception 'Esiste gia'' un supermercato con questo nome' using errcode = 'P0001';
    end if;
    v_stores := array_replace(v_stores, p_old, v_new);
    update public.list_entries set store = v_new
    where household_id = p_household_id and store = p_old;
  end if;

  update public.households set stores = v_stores where id = p_household_id;
  return v_stores;
end;
$$;

revoke execute on function public.rename_store(uuid, text, text) from public, anon;
grant execute on function public.rename_store(uuid, text, text) to authenticated;
