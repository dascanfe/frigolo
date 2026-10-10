-- =============================================================================
-- Frigolo - 0002: Row Level Security
-- Regola: un utente vede e modifica solo le righe del proprio household.
-- categories e items base (household_id null) sono in sola lettura per tutti
-- gli utenti autenticati. Il ruolo anon non vede nulla.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: l'utente corrente e' membro dell'household?
-- security definer per evitare la ricorsione delle policy su household_members.
-- L'advisor Supabase segnala che gli autenticati possono eseguirla via RPC:
-- e' voluto (le policy la eseguono come utente chiamante) e innocuo, perche'
-- rivela solo se il chiamante stesso e' membro dell'household passato.
-- -----------------------------------------------------------------------------
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Abilita RLS ovunque
-- -----------------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.items             enable row level security;
alter table public.list_entries      enable row level security;
alter table public.shopping_trips    enable row level security;
alter table public.purchases         enable row level security;

-- -----------------------------------------------------------------------------
-- households: lettura e modifica per i membri. La creazione passa dall'RPC
-- create_household (0003), che inserisce household e membro in una transazione.
-- -----------------------------------------------------------------------------
create policy "households: i membri leggono"
  on public.households for select
  to authenticated
  using (public.is_household_member(id));

create policy "households: i membri modificano"
  on public.households for update
  to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

-- -----------------------------------------------------------------------------
-- household_members: i membri vedono tutti i membri del proprio household,
-- ognuno modifica o rimuove solo la propria riga. L'inserimento passa dagli
-- RPC create_household e join_household (0003).
-- -----------------------------------------------------------------------------
create policy "members: i membri leggono"
  on public.household_members for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "members: ognuno modifica il proprio profilo"
  on public.household_members for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "members: ognuno puo' lasciare l'household"
  on public.household_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- categories: sola lettura per gli autenticati
-- -----------------------------------------------------------------------------
create policy "categories: lettura per autenticati"
  on public.categories for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- items: catalogo base leggibile da tutti, prodotti custom solo dal proprio
-- household. Scrittura solo sui prodotti custom del proprio household.
-- -----------------------------------------------------------------------------
create policy "items: lettura catalogo base e prodotti del proprio household"
  on public.items for select
  to authenticated
  using (household_id is null or public.is_household_member(household_id));

create policy "items: i membri creano prodotti custom"
  on public.items for insert
  to authenticated
  with check (
    household_id is not null
    and public.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

create policy "items: i membri modificano i prodotti custom"
  on public.items for update
  to authenticated
  using (household_id is not null and public.is_household_member(household_id))
  with check (household_id is not null and public.is_household_member(household_id));

create policy "items: i membri eliminano i prodotti custom"
  on public.items for delete
  to authenticated
  using (household_id is not null and public.is_household_member(household_id));

-- -----------------------------------------------------------------------------
-- list_entries, shopping_trips, purchases: tutto per i membri
-- -----------------------------------------------------------------------------
create policy "list_entries: tutto per i membri"
  on public.list_entries for all
  to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "shopping_trips: tutto per i membri"
  on public.shopping_trips for all
  to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "purchases: tutto per i membri"
  on public.purchases for all
  to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- -----------------------------------------------------------------------------
-- Grant espliciti: anon non tocca nulla, authenticated passa dalle policy.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- categories e' comunque in sola lettura: nessuna policy di scrittura.
revoke insert, update, delete on public.categories from authenticated;
