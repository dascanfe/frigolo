-- =============================================================================
-- Frigolo - 0003: funzioni esposte via RPC
-- - create_household: crea household e primo membro in transazione
-- - join_household: il secondo membro entra con il codice
-- - rotate_join_code: rigenera il codice di join
-- - complete_shopping_trip: sposta il carrello nello storico acquisti
-- =============================================================================

-- -----------------------------------------------------------------------------
-- create_household
-- security definer: l'utente non ha ancora un household, quindi non passerebbe
-- le policy di insert. Ogni utente puo' appartenere a un solo household.
-- L'advisor Supabase segnala i security definer eseguibili dagli autenticati:
-- qui e in join_household e' intenzionale, sono gli entrypoint RPC e fanno da
-- soli i controlli su auth.uid().
-- -----------------------------------------------------------------------------
create or replace function public.create_household(
  p_name          text,
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
    raise exception 'Non autenticato' using errcode = '42501';
  end if;

  if exists (select 1 from public.household_members where user_id = v_user) then
    raise exception 'Fai gia'' parte di un household' using errcode = 'P0001';
  end if;

  insert into public.households (name)
  values (trim(p_name))
  returning id into v_id;

  insert into public.household_members (household_id, user_id, display_name, color)
  values (v_id, v_user, nullif(trim(p_display_name), ''), p_color);

  return v_id;
end;
$$;

revoke execute on function public.create_household(text, text, text) from public, anon;
grant execute on function public.create_household(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- join_household
-- security definer: l'household va cercato per codice prima di esserne membri.
-- -----------------------------------------------------------------------------
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
    raise exception 'Non autenticato' using errcode = '42501';
  end if;

  if exists (select 1 from public.household_members where user_id = v_user) then
    raise exception 'Fai gia'' parte di un household' using errcode = 'P0001';
  end if;

  select id into v_id
  from public.households
  where join_code = upper(trim(p_code));

  if v_id is null then
    raise exception 'Codice non valido' using errcode = 'P0002';
  end if;

  insert into public.household_members (household_id, user_id, display_name, color)
  values (v_id, v_user, nullif(trim(p_display_name), ''), p_color);

  return v_id;
end;
$$;

revoke execute on function public.join_household(text, text, text) from public, anon;
grant execute on function public.join_household(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- rotate_join_code: rigenera il codice (security invoker, vale la policy update)
-- -----------------------------------------------------------------------------
create or replace function public.rotate_join_code(p_household_id uuid)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_code text;
begin
  update public.households
  set join_code = public.generate_join_code()
  where id = p_household_id
  returning join_code into v_code;

  if v_code is null then
    raise exception 'Household non trovato' using errcode = 'P0002';
  end if;

  return v_code;
end;
$$;

revoke execute on function public.rotate_join_code(uuid) from public, anon;
grant execute on function public.rotate_join_code(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- complete_shopping_trip
-- In una sola transazione:
--   1. chiude il trip aperto dell'household, o ne crea uno nuovo,
--   2. copia in purchases ogni list_entry con status = 'cart',
--   3. cancella quelle list_entries,
--   4. lascia intatte le righe ancora in 'todo',
--   5. ritorna l'id del trip.
-- security invoker: le policy RLS restano attive, il controllo di appartenenza
-- serve solo a dare un errore chiaro.
-- -----------------------------------------------------------------------------
create or replace function public.complete_shopping_trip(
  p_household_id  uuid,
  p_store         text default null
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_user        uuid := auth.uid();
  v_now         timestamptz := now();
  v_trip_id     uuid;
  v_cart_count  int;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questo household' using errcode = '42501';
  end if;

  select count(*) into v_cart_count
  from public.list_entries
  where household_id = p_household_id and status = 'cart';

  if v_cart_count = 0 then
    raise exception 'Nessun articolo nel carrello' using errcode = 'P0001';
  end if;

  -- 1. trip aperto da chiudere, altrimenti nuovo trip
  select id into v_trip_id
  from public.shopping_trips
  where household_id = p_household_id and completed_at is null
  order by started_at desc
  limit 1
  for update;

  if v_trip_id is null then
    insert into public.shopping_trips (household_id, store, started_at, completed_at, completed_by)
    values (
      p_household_id,
      nullif(trim(p_store), ''),
      coalesce(
        (select min(checked_at) from public.list_entries
         where household_id = p_household_id and status = 'cart'),
        v_now
      ),
      v_now,
      v_user
    )
    returning id into v_trip_id;
  else
    update public.shopping_trips
    set store = coalesce(nullif(trim(p_store), ''), store),
        completed_at = v_now,
        completed_by = v_user
    where id = v_trip_id;
  end if;

  -- 2. carrello -> storico
  insert into public.purchases (
    household_id, trip_id, item_id, category_id, quantity, unit,
    purchased_at, purchased_by, added_by
  )
  select
    e.household_id, v_trip_id, e.item_id, i.category_id, e.quantity,
    coalesce(e.unit, i.default_unit), v_now, v_user, e.added_by
  from public.list_entries e
  join public.items i on i.id = e.item_id
  where e.household_id = p_household_id and e.status = 'cart';

  -- 3. via dal carrello; 4. i 'todo' restano
  delete from public.list_entries
  where household_id = p_household_id and status = 'cart';

  -- 5.
  return v_trip_id;
end;
$$;

revoke execute on function public.complete_shopping_trip(uuid, text) from public, anon;
grant execute on function public.complete_shopping_trip(uuid, text) to authenticated;

-- generate_join_code (0001): usata dai default e da rotate_join_code (invoker),
-- quindi deve restare eseguibile dagli autenticati. Innocua: ritorna solo una stringa casuale.
revoke execute on function public.generate_join_code() from public, anon;
grant execute on function public.generate_join_code() to authenticated;
