-- =============================================================================
-- Frigolo - 0014: accenti veri al posto dell'apostrofo
-- Nomi dei prodotti di base (Caffè, Tè, Pancarrè), il supermercato Alì in tutte
-- le case (lista, articoli in lista, spese passate) e il messaggio di errore
-- della rinomina dei supermercati.
-- =============================================================================

update public.items as i
set name = v.new_name
from (values
  ('Caffe'' macinato', 'Caffè macinato'),
  ('Caffe'' in capsule', 'Caffè in capsule'),
  ('Te''', 'Tè'),
  ('Te'' freddo', 'Tè freddo'),
  ('Pancarre''', 'Pancarrè')
) as v(old_name, new_name)
where i.household_id is null
  and i.name = v.old_name;

update public.households
set stores = array_replace(stores, 'Ali''', 'Alì')
where 'Ali''' = any (stores);

update public.list_entries set store = 'Alì' where store = 'Ali''';
update public.shopping_trips set store = 'Alì' where store = 'Ali''';

alter table public.households alter column stores set default array[
  'Lidl', 'Conad', 'Cadoro', 'Lando', 'Prix', 'Maxi', 'Alì', 'Aldi', 'Carrefour',
  'Action', 'Legàmi', 'Normal', 'Tigotà', 'Acqua & Sapone', 'Amazon'
]::text[];

-- identica alla 0011, cambia solo il testo dell'errore
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
      raise exception 'Esiste già un supermercato con questo nome' using errcode = 'P0001';
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
