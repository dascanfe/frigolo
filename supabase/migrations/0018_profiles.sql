-- =============================================================================
-- Frigolo - 0018: profili utente (issue #2)
--
-- Perché: nome, colore e foto oggi stanno in household_members, cioè sono
-- "per lista". Con le liste multiple ognuno deve avere un solo profilo, scelto
-- da lui, uguale in tutte le liste.
--
-- Cosa fa:
--   1. tabella profiles (1 riga per utente, id = auth.users.id);
--   2. migrazione dei dati: nome, colore e foto dalla riga più vecchia di
--      household_members; gli avatar preimpostati avatar-a/avatar-b diventano null;
--   3. creazione automatica del profilo alla registrazione (trigger su
--      auth.users), con completed_at null finché l'utente non sceglie il nome;
--   4. RLS: ognuno legge e modifica il proprio profilo, legge quelli di chi
--      condivide almeno una lista con lui;
--   5. compatibilità con il frontend in produzione: le colonne display_name,
--      color e avatar_url di household_members restano (deprecate) e sono
--      tenute allineate al profilo in entrambe le direzioni da trigger.
--
-- In testa (audit M5): da qui in poi le tabelle, sequenze e funzioni nuove in
-- public non nascono più con permessi per anon (e le funzioni nemmeno per
-- PUBLIC). Ogni RPC pubblica va concessa esplicitamente.
--
-- Idempotente dove possibile: rilanciarla non duplica righe né policy.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Permessi di default (audit M5, revisione R3)
-- Vale per gli oggetti creati dal ruolo postgres (quello delle migration).
-- La revoca a PUBLIC sulle funzioni si può fare solo a livello globale del
-- ruolo, non per schema: riguarda comunque solo le funzioni create da postgres.
-- -----------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- Foto profilo (revisione R1)
-- Nel profilo si salva solo il PERCORSO nel bucket avatars, nella cartella
-- dell'utente: "<user_id>/<file>". L'URL lo costruisce il frontend con
-- supabase.storage.from('avatars').getPublicUrl(path): l'host non è più un
-- dato scritto dall'utente, quindi nessuno può far caricare agli altri membri
-- un'immagine da un server suo (pixel di tracciamento).
-- -----------------------------------------------------------------------------
create or replace function public.is_valid_avatar_path(p_path text, p_user uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_path is null or (
    char_length(p_path) <= 200
    and p_path ~ ('^' || p_user::text || '/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$')
    and p_path !~ '\.\.'
  );
$$;

-- Host da cui il vecchio frontend può scrivere URL completi nella colonna
-- deprecata household_members.avatar_url: solo lo Storage del progetto (e,
-- per lo sviluppo, lo Supabase locale, che punta al dispositivo stesso e non
-- a un server terzo). Il primo è quello usato per ricostruire l'URL.
-- In locale si può impostare app.avatar_base_url per ricostruire URL locali.
create or replace function public.avatar_storage_hosts()
returns text[]
language sql
stable
set search_path = ''
as $$
  select array_remove(array[
    nullif(current_setting('app.avatar_base_url', true), ''),
    'https://egvodwvnralxttxiovau.supabase.co',
    'http://127.0.0.1:54321',
    'http://localhost:54321'
  ], null);
$$;

-- URL completo (colonna deprecata) -> percorso nel bucket, solo se l'host è
-- tra quelli ammessi e il file sta nella cartella dell'utente; altrimenti null.
create or replace function public.avatar_path_from_url(p_url text, p_user uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when public.is_valid_avatar_path(v.path, p_user) then v.path
  end
  from (
    select substr(p_url, char_length(h) + char_length('/storage/v1/object/public/avatars/') + 1) as path
    from unnest(public.avatar_storage_hosts()) as h
    where p_url is not null
      and left(p_url, char_length(h) + char_length('/storage/v1/object/public/avatars/'))
          = h || '/storage/v1/object/public/avatars/'
    limit 1
  ) v;
$$;

-- percorso -> URL pubblico (solo per la colonna deprecata del vecchio frontend)
create or replace function public.avatar_public_url(p_path text)
returns text
language sql
stable
set search_path = ''
as $$
  select case when p_path is not null then
    (public.avatar_storage_hosts())[1] || '/storage/v1/object/public/avatars/' || p_path
  end;
$$;

revoke execute on function public.is_valid_avatar_path(text, uuid) from public, anon;
revoke execute on function public.avatar_storage_hosts() from public, anon;
revoke execute on function public.avatar_path_from_url(text, uuid) from public, anon;
revoke execute on function public.avatar_public_url(text) from public, anon;
grant execute on function public.is_valid_avatar_path(text, uuid) to authenticated;
grant execute on function public.avatar_storage_hosts() to authenticated;
grant execute on function public.avatar_path_from_url(text, uuid) to authenticated;
grant execute on function public.avatar_public_url(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Colore del profilo: lista chiusa, la stessa tavolozza dei membri del
-- frontend (src/lib/colors.ts, MEMBER_COLORS). Senza foto, l'avatar è la
-- mascotte di Frigolo sullo sfondo di questo colore, quindi il colore c'è
-- sempre: alla registrazione ne viene scelto uno a caso (l'utente lo cambia
-- quando vuole). Per aggiungere un colore: aggiornare questa funzione e
-- MEMBER_COLORS insieme.
-- -----------------------------------------------------------------------------
create or replace function public.member_colors()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['c-teal', 'c-brick', 'c-olive-deep', 'c-rust', 'c-brown',
               'c-terracotta', 'c-burnt', 'c-ochre', 'c-ink-soft']::text[];
$$;

create or replace function public.random_member_color()
returns text
language sql
volatile
set search_path = ''
as $$
  select c[1 + floor(random() * cardinality(c))::int]
  from (select public.member_colors() as c) m;
$$;

revoke execute on function public.member_colors() from public, anon;
revoke execute on function public.random_member_color() from public, anon;
grant execute on function public.member_colors() to authenticated;
grant execute on function public.random_member_color() to authenticated;

-- -----------------------------------------------------------------------------
-- 1. Tabella
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(trim(display_name)) between 1 and 40),
  avatar_path   text,
  color         text not null default public.random_member_color()
                check (color = any (public.member_colors())),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint profiles_avatar_path_check check (public.is_valid_avatar_path(avatar_path, id))
);

comment on table public.profiles is 'Profilo pubblico (verso chi condivide una lista) di ogni utente: uno per utente, uguale in tutte le liste.';
comment on column public.profiles.display_name is 'Nome mostrato agli altri membri delle liste, 1-40 caratteri.';
comment on column public.profiles.avatar_path is 'Percorso della foto (facoltativa) nel bucket avatars (<user_id>/<file>); l URL lo costruisce il client. Null = mascotte di Frigolo sullo sfondo di color.';
comment on column public.profiles.color is 'Token della tavolozza dei membri (lista chiusa in member_colors()): sfondo della mascotte quando non c è foto e colore di chi ha aggiunto cosa.';
comment on column public.profiles.completed_at is 'Null = profilo da completare nell onboarding (nome provvisorio). Valorizzato quando l utente salva il profilo.';

-- -----------------------------------------------------------------------------
-- Helper: l'utente corrente condivide almeno una lista con p_user?
-- security definer per leggere household_members senza ricorsione di policy.
-- Rivela solo se il chiamante stesso condivide una lista con p_user.
-- Usa la PK (household_id, user_id) e l'indice su user_id: niente scansioni.
-- -----------------------------------------------------------------------------
create or replace function public.shares_household_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members mine
    join public.household_members theirs
      on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user
  );
$$;

revoke execute on function public.shares_household_with(uuid) from public, anon;
grant execute on function public.shares_household_with(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Migrazione dei dati esistenti
-- Ogni utente esistente riceve un profilo. Nome, colore e foto vengono dalla
-- sua riga più vecchia in household_members (joined_at). Chi non ha un nome
-- riceve "Utente" e completed_at null (lo sceglierà nell'onboarding).
-- La foto diventa il percorso nel bucket; gli avatar preimpostati
-- /avatars/avatar-a.png e /avatars/avatar-b.png e ogni URL non dello Storage del
-- progetto diventano null.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, display_name, avatar_path, color, completed_at, created_at)
select
  u.id,
  coalesce(left(nullif(trim(m.display_name), ''), 40), 'Utente'),
  public.avatar_path_from_url(m.avatar_url, u.id),
  case when m.color = any (public.member_colors()) then m.color else public.random_member_color() end,
  case when nullif(trim(m.display_name), '') is not null then now() end,
  u.created_at
from auth.users u
left join lateral (
  select hm.display_name, hm.avatar_url, hm.color
  from public.household_members hm
  where hm.user_id = u.id
  order by hm.joined_at asc
  limit 1
) m on true
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Profilo automatico alla registrazione
-- Scelta: trigger su auth.users invece che creazione lato RPC, perché così
-- ogni utente ha sempre un profilo qualunque sia il percorso di registrazione
-- (email, futuri login social, utenti creati dal pannello), e le join e le FK
-- verso profiles non devono gestire il caso "profilo mancante".
-- Il nome arriva da raw_user_meta_data.display_name (o name / full_name, se
-- un giorno ci saranno login social): supabase.auth.signUp({ options: { data:
-- { display_name, color } } }); color è facoltativo (altrimenti uno a caso
-- della tavolozza). Se manca il nome: "Utente" provvisorio e completed_at
-- null, il frontend porta l'utente a completare il profilo.
-- La funzione non deve mai far fallire la registrazione: input ripulito e
-- on conflict do nothing.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name'
  )), ''), 40);
begin
  insert into public.profiles (id, display_name, color, completed_at)
  values (
    new.id,
    coalesce(v_name, 'Utente'),
    case
      when new.raw_user_meta_data ->> 'color' = any (public.member_colors())
        then new.raw_user_meta_data ->> 'color'
      else public.random_member_color()
    end,
    case when v_name is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- solo il trigger la usa: nessun client può chiamarla
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- updated_at e completed_at gestiti dal server.
-- completed_at si valorizza la prima volta che l'utente stesso salva il
-- profilo (auth.uid() = id): da lì in poi il profilo è "completo".
-- -----------------------------------------------------------------------------
create or replace function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.display_name := trim(new.display_name);
  new.updated_at := now();
  if old.completed_at is null and (select auth.uid()) = new.id then
    new.completed_at := now();
  else
    new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_before_update() from public, anon, authenticated;

drop trigger if exists profiles_before_update on public.profiles;
create trigger profiles_before_update
  before update on public.profiles
  for each row execute function public.profiles_before_update();

-- -----------------------------------------------------------------------------
-- 4. RLS e grant
-- Nessuna policy di insert/delete: il profilo nasce col trigger e muore con
-- l'account (on delete cascade). In update solo le tre colonne dell'utente.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles: lettura propria e di chi condivide una lista" on public.profiles;
create policy "profiles: lettura propria e di chi condivide una lista"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.shares_household_with(id));

drop policy if exists "profiles: ognuno modifica il proprio" on public.profiles;
create policy "profiles: ognuno modifica il proprio"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_path, color) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- RPC update_my_profile: comodità per il frontend (un solo round trip,
-- ritorna il profilo aggiornato). Invoker: valgono RLS e grant di colonna.
-- p_avatar_path: percorso nel bucket ('<user_id>/<file>'), '' per togliere la
-- foto, null per non cambiarla.
-- -----------------------------------------------------------------------------
create or replace function public.update_my_profile(
  p_display_name  text default null,
  p_color         text default null,
  p_avatar_path   text default null
)
returns public.profiles
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_profile  public.profiles;
begin
  if v_user is null then
    raise exception 'Non autenticato' using errcode = '42501';
  end if;

  update public.profiles
  set display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
      color        = coalesce(p_color, color),
      avatar_path  = case
                       when p_avatar_path is null then avatar_path
                       else nullif(trim(p_avatar_path), '')
                     end
  where id = v_user
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Profilo non trovato' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

revoke execute on function public.update_my_profile(text, text, text) from public, anon;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Compatibilità con il frontend attuale
-- household_members.display_name/color/avatar_url sono DEPRECATE: il frontend
-- nuovo legge e scrive profiles. Finché il frontend in produzione non viene
-- aggiornato, le due copie restano allineate:
--   - profilo modificato   -> si aggiornano tutte le righe membro dell'utente;
--   - riga membro inserita -> riceve i valori del profilo;
--   - riga membro modificata dal client (vecchio ProfileSheet) -> aggiorna il
--     profilo, che a sua volta allinea le altre righe dell'utente.
-- pg_trigger_depth() evita il ping-pong tra i due trigger.
-- Nella colonna deprecata avatar_url c'è l'URL completo (il vecchio frontend
-- lo usa come src), ricostruito dal percorso con l'host del progetto.
-- Da rimuovere (trigger e colonne) in una migration futura, quando nessun
-- client usa più le colonne.
-- -----------------------------------------------------------------------------
comment on column public.household_members.display_name is 'DEPRECATA: usare profiles.display_name. Allineata da trigger finché il vecchio frontend esiste.';
comment on column public.household_members.color is 'DEPRECATA: usare profiles.color. Allineata da trigger finché il vecchio frontend esiste.';
comment on column public.household_members.avatar_url is 'DEPRECATA: usare profiles.avatar_path. Allineata da trigger finché il vecchio frontend esiste.';

create or replace function public.sync_profile_to_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.household_members
  set display_name = new.display_name,
      color        = new.color,
      avatar_url   = public.avatar_public_url(new.avatar_path)
  where user_id = new.id
    and (display_name, color, avatar_url)
        is distinct from (new.display_name, new.color, public.avatar_public_url(new.avatar_path));
  return null;
end;
$$;

revoke execute on function public.sync_profile_to_members() from public, anon, authenticated;

drop trigger if exists profiles_sync_to_members on public.profiles;
create trigger profiles_sync_to_members
  after update of display_name, color, avatar_path on public.profiles
  for each row execute function public.sync_profile_to_members();

create or replace function public.members_fill_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
begin
  if tg_op = 'INSERT' then
    select * into p from public.profiles where id = new.user_id;
    if found then
      new.display_name := p.display_name;
      new.color        := p.color;
      new.avatar_url   := public.avatar_public_url(p.avatar_path);
    end if;
  elsif public.avatar_path_from_url(new.avatar_url, new.user_id) is null then
    -- anche la copia deprecata non accetta più avatar-a/avatar-b o URL esterni
    new.avatar_url := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.members_fill_from_profile() from public, anon, authenticated;

drop trigger if exists household_members_fill_from_profile on public.household_members;
create trigger household_members_fill_from_profile
  before insert or update of avatar_url on public.household_members
  for each row execute function public.members_fill_from_profile();

-- Il vecchio client aggiorna la propria riga membro: il dato vero va nel
-- profilo. security invoker: passa dalla policy di update di profiles, quindi
-- funziona solo se chi scrive è il proprietario (lo garantisce già la policy
-- di update di household_members).
create or replace function public.sync_member_to_profile()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  update public.profiles
  set display_name = coalesce(nullif(trim(new.display_name), ''), display_name),
      color        = case when new.color = any (public.member_colors()) then new.color else color end,
      avatar_path  = public.avatar_path_from_url(new.avatar_url, new.user_id)
  where id = new.user_id;
  return null;
end;
$$;

revoke execute on function public.sync_member_to_profile() from public, anon, authenticated;

drop trigger if exists household_members_sync_to_profile on public.household_members;
create trigger household_members_sync_to_profile
  after update of display_name, color, avatar_url on public.household_members
  for each row
  when (
    (old.display_name, old.color, old.avatar_url)
    is distinct from (new.display_name, new.color, new.avatar_url)
  )
  execute function public.sync_member_to_profile();

-- Le righe membro esistenti si allineano subito al profilo (toglie anche i
-- vecchi avatar avatar-a/avatar-b).
update public.household_members hm
set display_name = p.display_name,
    color        = p.color,
    avatar_url   = public.avatar_public_url(p.avatar_path)
from public.profiles p
where p.id = hm.user_id
  and (hm.display_name, hm.color, hm.avatar_url)
      is distinct from (p.display_name, p.color, public.avatar_public_url(p.avatar_path));

-- -----------------------------------------------------------------------------
-- FK household_members.user_id -> profiles.id: permette a PostgREST di
-- incorporare il profilo, es. households?select=*,household_members(*,profiles(*))
-- -----------------------------------------------------------------------------
alter table public.household_members
  drop constraint if exists household_members_user_id_profiles_fkey;
alter table public.household_members
  add constraint household_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- -----------------------------------------------------------------------------
-- analytics_members: nome e colore dal profilo (stessa firma, stesso output)
-- -----------------------------------------------------------------------------
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
    coalesce(pr.display_name, m.display_name) as display_name,
    coalesce(pr.color, m.color)               as color,
    count(p.id)                               as added_count
  from public.household_members m
  left join public.profiles pr on pr.id = m.user_id
  left join public.purchases p
    on p.added_by = m.user_id
   and p.household_id = m.household_id
   and (p_from is null or p.purchased_at >= p_from)
   and (p_to   is null or p.purchased_at <  p_to)
   and (p_category_id is null or p.category_id = p_category_id)
  where m.household_id = p_household_id
  group by m.user_id, coalesce(pr.display_name, m.display_name), coalesce(pr.color, m.color)
  order by 2 nulls last;
$$;

-- -----------------------------------------------------------------------------
-- Realtime: le modifiche al profilo arrivano anche agli altri membri (la
-- consegna rispetta la policy di select).
-- -----------------------------------------------------------------------------
alter table public.profiles replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
