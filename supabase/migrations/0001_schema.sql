-- =============================================================================
-- Frigolo - 0001: schema
-- Tabelle, vincoli, indici e configurazione Realtime.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funzioni di supporto usate dai default
-- -----------------------------------------------------------------------------

-- Codice di join a 8 caratteri, alfabeto senza caratteri ambigui (0/O, 1/I/L).
create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- households: il nucleo familiare (io e lei)
-- -----------------------------------------------------------------------------
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  join_code   text not null unique default public.generate_join_code(),
  created_at  timestamptz not null default now()
);

comment on table public.households is 'Nucleo che condivide una lista della spesa.';
comment on column public.households.join_code is 'Codice che il secondo membro inserisce per unirsi.';

-- -----------------------------------------------------------------------------
-- household_members: chi fa parte di quale household
-- -----------------------------------------------------------------------------
create table public.household_members (
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  display_name  text check (display_name is null or char_length(display_name) between 1 and 40),
  color         text,
  avatar_url    text,
  joined_at     timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

comment on column public.household_members.color is 'Token della palette (es. c-teal) per distinguere chi ha aggiunto cosa.';
comment on column public.household_members.avatar_url is 'URL della foto profilo (Supabase Storage o asset statico).';

-- -----------------------------------------------------------------------------
-- categories: globali, seed fisso
-- -----------------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  icon         text not null,
  color_token  text not null,
  sort_order   int  not null
);

comment on column public.categories.icon is 'Nome esatto del componente lucide-react, es. Carrot.';
comment on column public.categories.sort_order is 'Ordine di percorso tipico al supermercato.';

-- -----------------------------------------------------------------------------
-- items: catalogo prodotti (base condiviso + custom per household)
-- -----------------------------------------------------------------------------
create table public.items (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid references public.households (id) on delete cascade,
  category_id    uuid not null references public.categories (id),
  name           text not null check (char_length(name) between 1 and 60),
  icon           text not null,
  default_unit   text not null default 'pz'
                 check (default_unit in ('pz', 'kg', 'g', 'l', 'ml', 'conf')),
  season_months  int[] not null default '{}'
                 check (season_months <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  is_archived    boolean not null default false,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Nome unico per household, case-insensitive. "nulls not distinct" fa valere il
-- vincolo anche sul catalogo base (household_id null).
create unique index items_household_name_key
  on public.items (household_id, lower(name)) nulls not distinct;

create index items_category_id_idx on public.items (category_id);
create index items_household_id_idx on public.items (household_id);

comment on column public.items.household_id is 'Null = catalogo base condiviso, valorizzato = prodotto custom.';
comment on column public.items.season_months is 'Mesi 1-12 in cui il prodotto e'' di stagione, vuoto = sempre.';

-- -----------------------------------------------------------------------------
-- list_entries: la lista attiva
-- -----------------------------------------------------------------------------
create table public.list_entries (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  item_id       uuid not null references public.items (id) on delete cascade,
  quantity      numeric not null default 1 check (quantity > 0),
  unit          text,
  note          text check (note is null or char_length(note) <= 200),
  status        text not null default 'todo' check (status in ('todo', 'cart')),
  added_by      uuid references auth.users (id) on delete set null,
  added_at      timestamptz not null default now(),
  checked_at    timestamptz,
  -- Le righe vengono cancellate al completamento della spesa, quindi ogni riga
  -- presente e' attiva: un prodotto compare al massimo una volta per household.
  unique (household_id, item_id)
);

create index list_entries_household_status_idx on public.list_entries (household_id, status);

-- Realtime: la sottoscrizione filtra per household_id, e per ricevere anche i
-- DELETE con i dati della riga serve la replica identity completa.
alter table public.list_entries replica identity full;
alter publication supabase_realtime add table public.list_entries;

-- -----------------------------------------------------------------------------
-- shopping_trips: una spesa completata
-- -----------------------------------------------------------------------------
create table public.shopping_trips (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  store         text check (store is null or char_length(store) <= 60),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  completed_by  uuid references auth.users (id) on delete set null
);

create index shopping_trips_household_completed_idx
  on public.shopping_trips (household_id, completed_at desc);

-- -----------------------------------------------------------------------------
-- purchases: storico acquisti, alimenta suggerimenti e analitiche
-- -----------------------------------------------------------------------------
create table public.purchases (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  trip_id       uuid not null references public.shopping_trips (id) on delete cascade,
  item_id       uuid not null references public.items (id) on delete cascade,
  category_id   uuid not null references public.categories (id),
  quantity      numeric not null default 1,
  unit          text,
  purchased_at  timestamptz not null default now(),
  purchased_by  uuid references auth.users (id) on delete set null,
  added_by      uuid references auth.users (id) on delete set null
);

create index purchases_household_purchased_at_idx on public.purchases (household_id, purchased_at desc);
create index purchases_household_item_idx on public.purchases (household_id, item_id);
create index purchases_household_category_idx on public.purchases (household_id, category_id);
create index purchases_trip_id_idx on public.purchases (trip_id);

comment on column public.purchases.category_id is 'Denormalizzato da items per query veloci.';
comment on column public.purchases.purchased_by is 'Chi ha completato la spesa.';
comment on column public.purchases.added_by is 'Chi aveva messo il prodotto in lista (per le analitiche).';
