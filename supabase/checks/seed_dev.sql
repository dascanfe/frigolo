-- =============================================================================
-- Utenti e liste di prova per lo sviluppo. SOLO IN LOCALE.
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/checks/seed_dev.sql
--
-- Da lanciare dopo `supabase db reset`. Rilanciarlo non crea doppioni.
-- Crea 3 account con cui si accede dall'app in locale (email e password):
--
--   alice@frigolo.test  /  frigolo-locale-1   liste "Casa prova" e "Ufficio prova"
--   bruno@frigolo.test  /  frigolo-locale-2   lista "Casa prova"
--   carla@frigolo.test  /  frigolo-locale-3   nessuna lista (prova l'onboarding,
--                                             profilo da completare)
--
-- Le password valgono solo per questo database locale. Lo script si rifiuta di
-- girare se trova account con email diverse da *.test (cioè su un database
-- con utenti veri).
-- =============================================================================

do $$
begin
  if exists (select 1 from auth.users where email not like '%.test') then
    raise exception 'seed_dev.sql: trovati account non di prova, questo non è un database locale. Mi fermo.';
  end if;
end;
$$;

-- account (il trigger handle_new_user crea i profili)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt(u.pw, extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', u.meta, now(), now(),
  '', '', '', ''
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'alice@frigolo.test', 'frigolo-locale-1', '{"display_name":"Alice","color":"c-teal"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'bruno@frigolo.test', 'frigolo-locale-2', '{"display_name":"Bruno","color":"c-brick"}'::jsonb),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'carla@frigolo.test', 'frigolo-locale-3', '{}'::jsonb)
) as u(id, email, pw, meta)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email in ('alice@frigolo.test', 'bruno@frigolo.test', 'carla@frigolo.test')
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- liste
insert into public.households (id, name) values
  ('aaaaaaaa-1111-4111-8111-111111111111', 'Casa prova'),
  ('aaaaaaaa-2222-4222-8222-222222222222', 'Ufficio prova')
on conflict (id) do nothing;

insert into public.household_members (household_id, user_id) values
  ('aaaaaaaa-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

-- qualche voce in lista e una spesa passata in "Casa prova"
insert into public.list_entries (household_id, item_id, status, added_by)
select 'aaaaaaaa-1111-4111-8111-111111111111', i.id, 'todo', '11111111-1111-4111-8111-111111111111'
from public.items i
where i.household_id is null and i.name in ('Latte', 'Pane', 'Mele', 'Caffè')
on conflict do nothing;

do $$
declare v_trip uuid;
begin
  if not exists (select 1 from public.shopping_trips where household_id = 'aaaaaaaa-1111-4111-8111-111111111111') then
    insert into public.shopping_trips (household_id, store, started_at, completed_at, completed_by)
    values ('aaaaaaaa-1111-4111-8111-111111111111', 'Lidl', now() - interval '3 days', now() - interval '3 days',
            '22222222-2222-4222-8222-222222222222')
    returning id into v_trip;
    insert into public.purchases (household_id, trip_id, item_id, category_id, quantity, unit, purchased_at, purchased_by, added_by)
    select 'aaaaaaaa-1111-4111-8111-111111111111', v_trip, i.id, i.category_id, 1, i.default_unit,
           now() - interval '3 days', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111'
    from public.items i
    where i.household_id is null and i.name in ('Uova', 'Yogurt', 'Pasta');
  end if;
end;
$$;

select u.email, p.display_name, p.color, p.completed_at is not null as profilo_completo,
       (select string_agg(h.name, ', ' order by h.name)
        from public.household_members m join public.households h on h.id = m.household_id
        where m.user_id = u.id) as liste
from auth.users u join public.profiles p on p.id = u.id
where u.email like '%@frigolo.test'
order by u.email;
