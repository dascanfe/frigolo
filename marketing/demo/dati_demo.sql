-- =============================================================================
-- Dati dimostrativi per gli screenshot e il video. SOLO IN LOCALE.
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f marketing/demo/dati_demo.sql
--
-- Rilanciabile: cancella e ricrea tutto ciò che crea. Persone e liste inventate:
--   giulia@frigolo.test / luca@frigolo.test / marta@frigolo.test / lele@frigolo.test
--   password (solo database locale): frigolo-demo-1
--   liste "Casa" (Giulia, Lele) e "Coinquilini" (Giulia, Luca, Marta)
--
-- Per rimuovere i dati demo: marketing/demo/rimuovi_demo.sql
-- Si rifiuta di girare su un database con account diversi da *.test.
-- =============================================================================

do $$
begin
  if exists (select 1 from auth.users where email not like '%.test') then
    raise exception 'dati_demo.sql: trovati account non di prova, non è un database locale. Mi fermo.';
  end if;
end;
$$;

\ir rimuovi_demo.sql

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('frigolo-demo-1', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', u.meta, now(), now(),
  '', '', '', ''
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'giulia@frigolo.test', '{"display_name":"Giulia","color":"c-teal"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'luca@frigolo.test', '{"display_name":"Luca","color":"c-burnt"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'marta@frigolo.test', '{"display_name":"Marta","color":"c-olive-deep"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'lele@frigolo.test', '{"display_name":"Lele","color":"c-ochre"}'::jsonb)
) as u(id, email, meta);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.id::text like 'd0000000-%';

update public.profiles set completed_at = now() where id::text like 'd0000000-%';

insert into public.households (id, name, stores) values
  ('d1000000-0000-4000-8000-000000000001', 'Casa', array['Supermercato sotto casa', 'Mercato del sabato']),
  ('d1000000-0000-4000-8000-000000000002', 'Coinquilini', array['Supermercato sotto casa', 'Mercato del sabato']);

insert into public.household_members (household_id, user_id) values
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001'),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004'),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001'),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002'),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003');

-- prodotti creati dalla lista
insert into public.items (household_id, category_id, name, icon, default_unit, created_by)
select 'd1000000-0000-4000-8000-000000000001', c.id, v.name, v.icon, 'pz', 'd0000000-0000-4000-8000-000000000001'
from (values ('Biscotti della nonna', 'Snack e dolci', 'Cookie'), ('Pesto di Lele', 'Dispensa e secco', 'Leaf')) v(name, cat, icon)
join public.categories c on c.name = v.cat;

-- lista "Casa": da comprare
insert into public.list_entries (household_id, item_id, quantity, unit, note, status, added_by, added_at, store)
select 'd1000000-0000-4000-8000-000000000001', i.id, v.q, v.u, v.note, 'todo',
       case when v.who = 'a' then 'd0000000-0000-4000-8000-000000000004'::uuid else 'd0000000-0000-4000-8000-000000000001'::uuid end,
       now() - (v.ord || ' minutes')::interval, 'Supermercato sotto casa'
from (values
  ('Latte fresco', 2, null, 'Quello senza lattosio', 'a', 1),
  ('Pane', 1, null, null, 's', 2),
  ('Mele', 1, 'kg', null, 's', 3),
  ('Zucchine', 1, null, null, 'a', 4),
  ('Yogurt bianco', 4, null, null, 's', 5),
  ('Pasta', 2, null, null, 'a', 6),
  ('Passata di pomodoro', 1, null, null, 's', 7),
  ('Uova', 6, null, null, 'a', 8),
  ('Caffè macinato', 1, null, null, 's', 9),
  ('Detersivo piatti', 1, null, null, 'a', 10),
  ('Piselli surgelati', 1, null, null, 's', 11)
) v(name, q, u, note, who, ord)
join public.items i on i.name = v.name and i.household_id is null;

-- lista "Coinquilini"
insert into public.list_entries (household_id, item_id, quantity, status, added_by, added_at)
select 'd1000000-0000-4000-8000-000000000002', i.id, v.q, 'todo', v.who, now() - (v.ord || ' minutes')::interval
from (values
  ('Carta igienica', 1, 'd0000000-0000-4000-8000-000000000002'::uuid, 1),
  ('Olio extravergine', 1, 'd0000000-0000-4000-8000-000000000003'::uuid, 2),
  ('Sale', 1, 'd0000000-0000-4000-8000-000000000001'::uuid, 3),
  ('Spugne', 1, 'd0000000-0000-4000-8000-000000000003'::uuid, 4),
  ('Birra', 6, 'd0000000-0000-4000-8000-000000000002'::uuid, 5),
  ('Patatine', 1, 'd0000000-0000-4000-8000-000000000002'::uuid, 6),
  ('Pomodori', 1, 'd0000000-0000-4000-8000-000000000001'::uuid, 7)
) v(name, q, who, ord)
join public.items i on i.name = v.name and i.household_id is null;

-- storico di "Casa": 20 spese in 12 settimane (deterministico)
select setseed(0.42);
do $$
declare
  v_hh constant uuid := 'd1000000-0000-4000-8000-000000000001';
  v_giulia constant uuid := 'd0000000-0000-4000-8000-000000000001';
  v_lele constant uuid := 'd0000000-0000-4000-8000-000000000004';
  v_trip uuid;
  v_day int;
  v_n int;
  v_by uuid;
  v_when timestamptz;
  v_days int[] := array[2, 5, 9, 12, 16, 19, 23, 27, 31, 35, 40, 44, 48, 52, 57, 61, 65, 70, 75, 80];
  v_stores text[] := array['Supermercato sotto casa', 'Supermercato sotto casa', 'Mercato del sabato'];
  k int := 0;
begin
  foreach v_day in array v_days loop
    k := k + 1;
    v_when := date_trunc('day', now()) - (v_day || ' days')::interval + interval '17 hours';
    v_by := case when k % 3 = 0 then v_lele else v_giulia end;
    v_n := 8 + (k * 7) % 13;
    insert into public.shopping_trips (household_id, store, started_at, completed_at, completed_by)
    values (v_hh, v_stores[1 + k % 3], v_when - interval '40 minutes', v_when, v_by)
    returning id into v_trip;
    -- prodotti ricorrenti (spesso) + a rotazione (poche volte)
    insert into public.purchases (household_id, trip_id, item_id, category_id, quantity, unit, purchased_at, purchased_by, added_by)
    select v_hh, v_trip, i.id, i.category_id, 1 + (random() * 2)::int, i.default_unit, v_when, v_by,
           case when random() < 0.5 then v_giulia else v_lele end
    from (
      select i.* from public.items i
      where i.household_id is null and i.is_archived = false
      order by (case when i.name in ('Latte fresco','Pane','Uova','Yogurt bianco','Mele','Pasta','Caffè macinato','Zucchine') and random() < 0.8 then 0 else 1 end), random()
      limit v_n
    ) i;
  end loop;
end;
$$;
