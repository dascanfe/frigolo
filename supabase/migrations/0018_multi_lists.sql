-- =============================================================================
-- Frigolo - 0018: liste multiple (issue #3, parte backend)
--
-- Perché: ogni utente deve poter usare l'app da solo, creare quante liste
-- vuole, entrare nelle liste altrui con codice o link, rinominarle, lasciarle
-- ed eliminarle. Lo schema lo permette già (household_members ha chiave
-- doppia); erano le RPC del 0003 a imporre "una sola casa per utente".
-- Nella UI si chiamano "liste", le tabelle restano households.
--
-- Regole scelte:
--   - al massimo 50 liste per utente e 20 membri per lista (argine agli abusi
--     con le registrazioni aperte; si alzano cambiando le costanti qui sotto);
--   - join_household è idempotente: se sei già nella lista ritorna il suo id
--     (riaprire un link di invito non dà errore);
--   - lasciare: sempre possibile. Una lista che resta senza membri viene
--     eliminata con tutti i suoi dati (trigger), anche quando a sparire è
--     l'account. Il frontend deve avvisare chi lascia per ultimo;
--   - eliminare: solo se sei l'unico membro. Se ci sono altri puoi solo
--     lasciarla: nessuno cancella i dati condivisi degli altri;
--   - il codice di invito (join_code) si cambia solo con rotate_join_code:
--     gli utenti possono aggiornare direttamente solo name e stores.
--
-- Compatibilità: create_household e join_household tengono la stessa firma;
-- p_display_name e p_color, se passati (vecchio onboarding), aggiornano il
-- profilo. Il frontend attuale continua a funzionare.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Limiti
-- -----------------------------------------------------------------------------
create or replace function public.max_households_per_user()
returns int language sql immutable set search_path = '' as $$ select 50 $$;

create or replace function public.max_members_per_household()
returns int language sql immutable set search_path = '' as $$ select 20 $$;

-- Normalizza un codice di invito scritto a mano o letto da un link:
-- maiuscolo, senza spazi né trattini.
create or replace function public.normalize_join_code(p_code text)
returns text language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Vecchio onboarding: nome e colore passati alle RPC finiscono nel profilo.
create or replace function public.apply_legacy_profile_args(
  p_user          uuid,
  p_display_name  text,
  p_color         text
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.profiles
  set display_name = coalesce(left(nullif(trim(p_display_name), ''), 40), display_name),
      color        = case when p_color ~ '^c-[a-z-]{1,24}$' then p_color else color end
  where id = p_user
    and (nullif(trim(p_display_name), '') is not null or p_color is not null);
$$;

revoke execute on function public.apply_legacy_profile_args(uuid, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- create_household: crea una lista e ne fa membro il chiamante.
-- security definer: l'utente non è ancora membro, non passerebbe le policy.
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

  if (select count(*) from public.household_members where user_id = v_user)
     >= public.max_households_per_user() then
    raise exception 'Hai raggiunto il numero massimo di liste' using errcode = 'P0001';
  end if;

  perform public.apply_legacy_profile_args(v_user, p_display_name, p_color);

  insert into public.households (name)
  values (coalesce(nullif(trim(p_name), ''), 'Lista'))
  returning id into v_id;

  -- nome, colore e foto arrivano dal profilo (trigger members_fill_from_profile)
  insert into public.household_members (household_id, user_id)
  values (v_id, v_user);

  return v_id;
end;
$$;

revoke execute on function public.create_household(text, text, text) from public, anon;
grant execute on function public.create_household(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- join_household: entra in una lista con il codice (scritto o da link).
-- security definer: la lista va cercata per codice prima di esserne membri.
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

  select id into v_id
  from public.households
  where join_code = public.normalize_join_code(p_code)
  for update;

  if v_id is null then
    raise exception 'Codice non valido' using errcode = 'P0002';
  end if;

  -- già membro: niente da fare (link di invito riaperto)
  if exists (
    select 1 from public.household_members
    where household_id = v_id and user_id = v_user
  ) then
    return v_id;
  end if;

  if (select count(*) from public.household_members where user_id = v_user)
     >= public.max_households_per_user() then
    raise exception 'Hai raggiunto il numero massimo di liste' using errcode = 'P0001';
  end if;

  if (select count(*) from public.household_members where household_id = v_id)
     >= public.max_members_per_household() then
    raise exception 'La lista ha raggiunto il numero massimo di membri' using errcode = 'P0001';
  end if;

  perform public.apply_legacy_profile_args(v_user, p_display_name, p_color);

  insert into public.household_members (household_id, user_id)
  values (v_id, v_user);

  return v_id;
end;
$$;

revoke execute on function public.join_household(text, text, text) from public, anon;
grant execute on function public.join_household(text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- get_household_invite: anteprima di un invito (per il link
-- https://<app>/invito/<codice>): nome della lista, quanti membri, se ci sei
-- già. Non rivela nient'altro (niente nomi dei membri, niente id se il
-- codice è sbagliato). Solo per utenti autenticati: chi apre il link senza
-- account si registra prima, il frontend conserva il codice nel frattempo.
-- -----------------------------------------------------------------------------
create or replace function public.get_household_invite(p_code text)
returns table (
  household_id  uuid,
  name          text,
  member_count  int,
  is_member     boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    h.id,
    h.name,
    (select count(*)::int from public.household_members m where m.household_id = h.id),
    exists (
      select 1 from public.household_members m
      where m.household_id = h.id and m.user_id = (select auth.uid())
    )
  from public.households h
  where h.join_code = public.normalize_join_code(p_code)
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.get_household_invite(text) from public, anon;
grant execute on function public.get_household_invite(text) to authenticated;

-- -----------------------------------------------------------------------------
-- rename_household: rinomina una lista (invoker: vale la policy di update).
-- -----------------------------------------------------------------------------
create or replace function public.rename_household(p_household_id uuid, p_name text)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_name text;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  update public.households
  set name = trim(p_name)
  where id = p_household_id
  returning name into v_name;

  return v_name;
end;
$$;

revoke execute on function public.rename_household(uuid, text) from public, anon;
grant execute on function public.rename_household(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- rotate_join_code: ora security definer con controllo di appartenenza,
-- perché la colonna join_code non è più aggiornabile direttamente dai client.
-- Riprova in caso (rarissimo) di collisione con un codice esistente.
-- -----------------------------------------------------------------------------
create or replace function public.rotate_join_code(p_household_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code     text;
  v_attempt  int := 0;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  loop
    v_attempt := v_attempt + 1;
    begin
      update public.households
      set join_code = public.generate_join_code()
      where id = p_household_id
      returning join_code into v_code;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  if v_code is null then
    raise exception 'Lista non trovata' using errcode = 'P0002';
  end if;

  return v_code;
end;
$$;

revoke execute on function public.rotate_join_code(uuid) from public, anon;
grant execute on function public.rotate_join_code(uuid) to authenticated;

-- I client aggiornano solo name e stores; join_code solo via rotate_join_code
-- (prima un membro poteva impostare un codice scelto da lui, anche debole).
revoke update on public.households from authenticated;
grant update (name, stores) on public.households to authenticated;

-- -----------------------------------------------------------------------------
-- Una lista senza membri non serve a nessuno: viene eliminata con tutti i
-- dati (list_entries, items custom, spese e acquisti vanno in cascata).
-- Copre leave_household, la delete diretta sulla propria riga membro e la
-- cancellazione dell'account (cascata da auth.users).
-- -----------------------------------------------------------------------------
create or replace function public.delete_empty_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.households h
  where h.id = old.household_id
    and not exists (
      select 1 from public.household_members m where m.household_id = old.household_id
    );
  return null;
end;
$$;

revoke execute on function public.delete_empty_household() from public, anon, authenticated;

drop trigger if exists household_members_delete_empty_household on public.household_members;
create trigger household_members_delete_empty_household
  after delete on public.household_members
  for each row execute function public.delete_empty_household();

-- -----------------------------------------------------------------------------
-- leave_household: esci da una lista. Ritorna true se eri l'ultimo membro e
-- la lista è stata quindi eliminata.
-- security definer: dopo aver tolto la propria riga l'utente non vede più la
-- lista (RLS), quindi in invoker non saprebbe dire se è stata eliminata.
-- Tocca solo la riga del chiamante.
-- -----------------------------------------------------------------------------
create or replace function public.leave_household(p_household_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Non autenticato' using errcode = '42501';
  end if;

  -- blocca la lista: due uscite contemporanee vedono lo stesso conteggio
  perform 1 from public.households where id = p_household_id for update;

  delete from public.household_members
  where household_id = p_household_id and user_id = v_user;

  if not found then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  -- il trigger delete_empty_household ha già eliminato la lista se era vuota
  return not exists (select 1 from public.households where id = p_household_id);
end;
$$;

revoke execute on function public.leave_household(uuid) from public, anon;
grant execute on function public.leave_household(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- delete_household: elimina una lista con tutti i suoi dati. Solo se sei
-- l'unico membro; altrimenti si può solo lasciarla.
-- security definer: i client non hanno una policy di delete su households.
-- -----------------------------------------------------------------------------
create or replace function public.delete_household(p_household_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Non autenticato' using errcode = '42501';
  end if;

  -- blocca la lista: nessuno può entrare mentre la si elimina
  perform 1 from public.households where id = p_household_id for update;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = v_user
  ) then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id <> v_user
  ) then
    raise exception 'La lista ha altri membri: puoi solo lasciarla' using errcode = 'P0001';
  end if;

  delete from public.households where id = p_household_id;
end;
$$;

revoke execute on function public.delete_household(uuid) from public, anon;
grant execute on function public.delete_household(uuid) to authenticated;

comment on table public.households is 'Una lista della spesa condivisa ("lista" nella UI). Un utente può essere in più liste.';
comment on column public.households.join_code is 'Codice di invito (8 caratteri), anche nel link /invito/<codice>. Si rigenera con rotate_join_code.';
