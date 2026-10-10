-- =============================================================================
-- Frigolo - 0008: bucket giornaliero per l'andamento (periodo "15 giorni")
-- Stessa firma di analytics_weekly: p_bucket accetta anche 'day'.
-- =============================================================================

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
      case when p_bucket = 'month' then 'month' when p_bucket = 'day' then 'day' else 'week' end,
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
