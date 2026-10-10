-- =============================================================================
-- Frigolo - 0015: salvataggio automatico della spesa
-- Se nessuno preme "Spesa finita", ogni notte il carrello di ogni casa diventa
-- storico. Conta solo il tocco "preso": gli articoli tolti dalla lista non
-- diventano mai acquisti, e fino alla notte un tocco li rimette in lista.
--
-- Raggruppamento: una spesa per casa, giorno (ora italiana dell'ultimo tocco)
-- e supermercato. Gli articoli "Ovunque" vanno nella spesa del supermercato
-- con più articoli quel giorno; se nessuno ha un supermercato, una sola spesa
-- senza negozio. La data degli acquisti è quella del tocco, non della notte.
-- =============================================================================

create or replace function public.auto_complete_trips(p_household_id uuid default null)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_trips  integer := 0;
  v_trip   uuid;
  g        record;
begin
  create temporary table auto_cart on commit drop as
  select
    e.id, e.household_id, e.item_id, e.quantity, e.unit, e.store, e.added_by,
    coalesce(e.checked_at, e.added_at) as taken_at,
    (coalesce(e.checked_at, e.added_at) at time zone 'Europe/Rome')::date as day
  from public.list_entries e
  where e.status = 'cart'
    and (p_household_id is null or e.household_id = p_household_id);

  -- "Ovunque": nel supermercato più frequente di quella casa in quel giorno
  update pg_temp.auto_cart c
  set store = top.store
  from (
    select distinct on (household_id, day) household_id, day, store
    from pg_temp.auto_cart
    where store is not null
    group by household_id, day, store
    order by household_id, day, count(*) desc, store
  ) as top
  where c.store is null
    and c.household_id = top.household_id
    and c.day = top.day;

  for g in
    select household_id, day, store, min(taken_at) as started, max(taken_at) as ended
    from pg_temp.auto_cart
    group by household_id, day, store
  loop
    insert into public.shopping_trips (household_id, store, started_at, completed_at, completed_by)
    values (g.household_id, g.store, g.started, g.ended, null)
    returning id into v_trip;

    insert into public.purchases (
      household_id, trip_id, item_id, category_id, quantity, unit,
      purchased_at, purchased_by, added_by
    )
    select
      c.household_id, v_trip, c.item_id, i.category_id, c.quantity,
      coalesce(c.unit, i.default_unit), c.taken_at, null, c.added_by
    from pg_temp.auto_cart c
    join public.items i on i.id = c.item_id
    where c.household_id = g.household_id
      and c.day = g.day
      and c.store is not distinct from g.store;

    v_trips := v_trips + 1;
  end loop;

  delete from public.list_entries e
  using pg_temp.auto_cart c
  where e.id = c.id;

  return v_trips;
end;
$$;

-- solo il job notturno (gira come postgres): nessun client può chiamarla
revoke execute on function public.auto_complete_trips(uuid) from public, anon, authenticated;
