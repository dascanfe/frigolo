-- =============================================================================
-- Dati finti che simulano la produzione PRIMA della 0017 (solo locale).
-- Serve a provare la migrazione dei profili:
--   supabase db reset --local --version 0016
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/checks/dati_pre_0017.sql
--   supabase migration up --local
-- Nomi, email e codici sono inventati.
-- =============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','anna@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now()-interval '200 days', now()),
 ('aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','bruno@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now()-interval '199 days', now()),
 ('aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','carla@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now()-interval '50 days', now()),
 ('aaaaaaaa-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','dario@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now()-interval '49 days', now());

insert into public.households (id, name, join_code) values
 ('bbbbbbbb-0000-0000-0000-000000000001','Casa','CASA2345'),
 ('bbbbbbbb-0000-0000-0000-000000000002','Paolo e Paola','PAOL2345');

insert into public.household_members (household_id, user_id, display_name, color, avatar_url, joined_at) values
 ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Anna','c-teal','/avatars/lele.png', now()-interval '200 days'),
 ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','Bruno','c-brick','/avatars/pipi.png', now()-interval '199 days'),
 ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000003','Carla','c-ochre','http://127.0.0.1:54321/storage/v1/object/public/avatars/aaaaaaaa-0000-0000-0000-000000000003/avatar-1.webp', now()-interval '50 days'),
 ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000004',null,null,null, now()-interval '49 days');

-- un po' di storico e di lista
insert into public.list_entries (household_id, item_id, status, added_by, checked_at)
select 'bbbbbbbb-0000-0000-0000-000000000001', id, 'cart', 'aaaaaaaa-0000-0000-0000-000000000001', now() - interval '3 hours'
from public.items where household_id is null order by name limit 3;
insert into public.list_entries (household_id, item_id, status, added_by)
select 'bbbbbbbb-0000-0000-0000-000000000002', id, 'todo', 'aaaaaaaa-0000-0000-0000-000000000003'
from public.items where household_id is null order by name desc limit 2;
select public.auto_complete_trips('bbbbbbbb-0000-0000-0000-000000000001');
insert into public.items (household_id, category_id, name, icon, created_by)
select 'bbbbbbbb-0000-0000-0000-000000000002', id, 'Prodotto di Carla', 'Package', 'aaaaaaaa-0000-0000-0000-000000000003' from public.categories limit 1;
