-- =============================================================================
-- Frigolo - 0005: filtro per categoria nelle analitiche + Realtime su items e
-- household_members
--
-- Il tap su uno spicchio del donut filtra il resto della pagina per categoria:
-- le funzioni ricevono un p_category_id opzionale (null = tutte). Le vecchie
-- firme vanno rimosse, altrimenti PostgREST trova due overload e rifiuta la
-- chiamata come ambigua.
-- =============================================================================

drop function if exists public.analytics_summary(uuid, timestamptz, timestamptz);
drop function if exists public.analytics_item_totals(uuid, timestamptz, timestamptz);
drop function if exists public.analytics_weekly(uuid, timestamptz, timestamptz, text);
drop function if exists public.analytics_members(uuid, timestamptz, timestamptz);

create or replace function public.analytics_summary(
  p_household_id  uuid,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_category_id   uuid default null
)
returns table (
  total_items          bigint,
  trips                bigint,
  avg_items_per_trip   numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with p as (
    select trip_id
    from public.purchases
    where household_id = p_household_id
      and (p_from is null or purchased_at >= p_from)
      and (p_to   is null or purchased_at <  p_to)
      and (p_category_id is null or category_id = p_category_id)
  )
  select
    count(*)                                                        as total_items,
    count(distinct trip_id)                                         as trips,
    round(count(*)::numeric / nullif(count(distinct trip_id), 0), 1) as avg_items_per_trip
  from p;
$$;

create or replace function public.analytics_item_totals(
  p_household_id  uuid,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_category_id   uuid default null
)
returns table (
  item_id               uuid,
  item_name             text,
  item_icon             text,
  category_id           uuid,
  category_slug         text,
  category_color_token  text,
  purchase_count        bigint,
  total_quantity        numeric,
  first_purchased_at    timestamptz,
  last_purchased_at     timestamptz,
  avg_interval_days     numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with p as (
    select
      item_id,
      category_id,
      quantity,
      purchased_at,
      extract(epoch from purchased_at - lag(purchased_at) over (
        partition by item_id order by purchased_at
      )) / 86400.0 as gap_days
    from public.purchases
    where household_id = p_household_id
      and (p_from is null or purchased_at >= p_from)
      and (p_to   is null or purchased_at <  p_to)
      and (p_category_id is null or category_id = p_category_id)
  )
  select
    p.item_id,
    i.name                          as item_name,
    i.icon                          as item_icon,
    p.category_id,
    c.slug                          as category_slug,
    c.color_token                   as category_color_token,
    count(*)                        as purchase_count,
    sum(p.quantity)                 as total_quantity,
    min(p.purchased_at)             as first_purchased_at,
    max(p.purchased_at)             as last_purchased_at,
    round(avg(p.gap_days)::numeric, 1) as avg_interval_days
  from p
  join public.items i      on i.id = p.item_id
  join public.categories c on c.id = p.category_id
  group by p.item_id, i.name, i.icon, p.category_id, c.slug, c.color_token
  order by purchase_count desc, last_purchased_at desc;
$$;

create or replace function public.analytics_weekly(
  p_household_id  uuid,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_bucket        text default 'week',
  p_category_id   uuid default null
)
returns table (
  bucket_start    date,
  purchase_count  bigint,
  trips           bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_trunc(
      case when p_bucket = 'month' then 'month' else 'week' end,
      purchased_at at time zone 'Europe/Rome'
    )::date                   as bucket_start,
    count(*)                  as purchase_count,
    count(distinct trip_id)   as trips
  from public.purchases
  where household_id = p_household_id
    and (p_from is null or purchased_at >= p_from)
    and (p_to   is null or purchased_at <  p_to)
    and (p_category_id is null or category_id = p_category_id)
  group by 1
  order by 1;
$$;

create or replace function public.analytics_members(
  p_household_id  uuid,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_category_id   uuid default null
)
returns table (
  user_id       uuid,
  display_name  text,
  color         text,
  added_count   bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.user_id,
    m.display_name,
    m.color,
    count(p.id) as added_count
  from public.household_members m
  left join public.purchases p
    on p.added_by = m.user_id
   and p.household_id = m.household_id
   and (p_from is null or p.purchased_at >= p_from)
   and (p_to   is null or p.purchased_at <  p_to)
   and (p_category_id is null or p.category_id = p_category_id)
  where m.household_id = p_household_id
  group by m.user_id, m.display_name, m.color
  order by m.display_name nulls last;
$$;

revoke execute on function public.analytics_summary(uuid, timestamptz, timestamptz, uuid)          from public, anon;
revoke execute on function public.analytics_item_totals(uuid, timestamptz, timestamptz, uuid)      from public, anon;
revoke execute on function public.analytics_weekly(uuid, timestamptz, timestamptz, text, uuid)     from public, anon;
revoke execute on function public.analytics_members(uuid, timestamptz, timestamptz, uuid)          from public, anon;

grant execute on function public.analytics_summary(uuid, timestamptz, timestamptz, uuid)           to authenticated;
grant execute on function public.analytics_item_totals(uuid, timestamptz, timestamptz, uuid)       to authenticated;
grant execute on function public.analytics_weekly(uuid, timestamptz, timestamptz, text, uuid)      to authenticated;
grant execute on function public.analytics_members(uuid, timestamptz, timestamptz, uuid)           to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime (Fase 8): anche i prodotti custom e i profili dei membri si
-- sincronizzano tra i due telefoni.
-- -----------------------------------------------------------------------------
alter table public.items replica identity full;
alter table public.household_members replica identity full;
alter publication supabase_realtime add table public.items, public.household_members;
