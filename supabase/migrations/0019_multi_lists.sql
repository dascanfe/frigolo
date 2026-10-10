-- =============================================================================
-- Frigolo - 0019: liste multiple e inviti (issue #3, parte backend)
--
-- Perché: ogni utente deve poter usare l'app da solo, creare quante liste
-- vuole, entrare nelle liste altrui con codice o link, rinominarle, lasciarle
-- ed eliminarle. Lo schema lo permette già (household_members ha chiave
-- doppia); erano le RPC del 0003 a imporre "una sola casa per utente".
-- Nella UI si chiamano "liste", le tabelle restano households.
--
-- Regole scelte:
--   - al massimo 50 liste per utente e 20 membri per lista (argine agli abusi
--     con le registrazioni aperte; si cambiano nelle funzioni qui sotto);
--   - join_household è idempotente: se sei già nella lista ritorna il suo id
--     (riaprire un link di invito non dà errore);
--   - lasciare: sempre possibile. Una lista che resta senza membri viene
--     eliminata con tutti i suoi dati (trigger), anche quando a sparire è
--     l'account. Il frontend deve avvisare chi lascia per ultimo;
--   - eliminare: solo se sei l'unico membro. Se ci sono altri puoi solo
--     lasciarla: nessuno cancella i dati condivisi degli altri.
--
-- Inviti (audit M1/M2, revisione R2/R5):
--   - due segreti per lista, entrambi generati con gen_random_bytes e validi
--     7 giorni: il codice corto (8 caratteri, da scrivere a mano) e il token
--     del link (128 bit, 22 caratteri base64url, /invito/<token>);
--   - si rinnovano insieme con rotate_join_code (il vecchio smette subito di
--     funzionare: è anche il modo per revocare un invito);
--   - i client non possono scriverli: update diretto solo su name e stores;
--   - limite ai tentativi falliti per utente, condiviso da join_household e
--     get_household_invite: 10 all'ora e 30 al giorno, poi errore 429 per
--     qualunque codice, giusto o sbagliato (risposta uniforme);
--   - codice sbagliato o scaduto: nessun errore distinto, join_household
--     ritorna null e get_household_invite nessuna riga;
--   - l'anteprima non restituisce l'id della lista.
--
-- Compatibilità: create_household e join_household tengono la stessa firma;
-- p_display_name e p_color, se passati (vecchio onboarding), aggiornano il
-- profilo. Unica differenza per il frontend attuale: con un codice sbagliato
-- join_household ritorna null invece di un errore (il vecchio onboarding già
-- tratta null come errore e mostra il messaggio generico).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Limiti
-- -----------------------------------------------------------------------------
create or replace function public.max_households_per_user()
returns int language sql immutable set search_path = '' as $$ select 50 $$;

create or replace function public.max_members_per_household()
returns int language sql immutable set search_path = '' as $$ select 20 $$;

revoke execute on function public.max_households_per_user() from public, anon;
revoke execute on function public.max_members_per_household() from public, anon;
grant execute on function public.max_households_per_user() to authenticated;
grant execute on function public.max_members_per_household() to authenticated;

-- -----------------------------------------------------------------------------
-- Generazione sicura di codice e token (pgcrypto, schema extensions)
-- -----------------------------------------------------------------------------

-- Codice corto: 8 caratteri da un alfabeto di 31 senza ambigui (0/O, 1/I/L).
-- Campionamento per rifiuto (byte < 248 = 31 * 8): distribuzione uniforme.
create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result  text := '';
  bytes   bytea;
  b       int;
begin
  while char_length(result) < 8 loop
    bytes := extensions.gen_random_bytes(16);
    for k in 0 .. 15 loop
      b := get_byte(bytes, k);
      if b < 248 and char_length(result) < 8 then
        result := result || substr(alphabet, 1 + (b % 31), 1);
      end if;
    end loop;
  end loop;
  return result;
end;
$$;

-- Token del link: 128 bit casuali in base64url senza padding (22 caratteri).
create or replace function public.generate_invite_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '=');
$$;

revoke execute on function public.generate_join_code() from public, anon, authenticated;
revoke execute on function public.generate_invite_token() from public, anon, authenticated;

alter table public.households
  add column if not exists join_code_expires_at timestamptz not null default now() + interval '7 days',
  add column if not exists invite_token text not null default public.generate_invite_token(),
  add column if not exists invite_token_expires_at timestamptz not null default now() + interval '7 days';

create unique index if not exists households_invite_token_key on public.households (invite_token);

comment on column public.households.join_code is 'Codice di invito corto (8 caratteri), valido fino a join_code_expires_at. Si rinnova con rotate_join_code.';
comment on column public.households.invite_token is 'Token del link di invito /invito/<token> (128 bit), valido fino a invite_token_expires_at. Si rinnova con rotate_join_code.';

-- I codici esistenti erano generati con random(): si rigenerano.
update public.households
set join_code = public.generate_join_code(),
    join_code_expires_at = now() + interval '7 days';

-- -----------------------------------------------------------------------------
-- Tentativi falliti di usare un invito, per utente. Nessun accesso dai client.
-- -----------------------------------------------------------------------------
create table if not exists public.invite_attempts (
  user_id       uuid not null references auth.users (id) on delete cascade,
  attempted_at  timestamptz not null default now()
);

create index if not exists invite_attempts_user_time_idx
  on public.invite_attempts (user_id, attempted_at desc);

alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from anon, authenticated;

comment on table public.invite_attempts is 'Tentativi falliti di usare un codice o link di invito (limite anti forza bruta). Svuotata ogni notte.';

-- Errore 429 (PostgREST traduce PT429 nello stato HTTP) se l'utente ha
-- superato i tentativi falliti. Vale per qualunque codice.
create or replace function public.assert_invite_rate_limit(p_user uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if (select count(*) from public.invite_attempts
      where user_id = p_user and attempted_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.invite_attempts
         where user_id = p_user and attempted_at > now() - interval '1 day') >= 30 then
    raise exception 'Troppi tentativi, riprova più tardi' using errcode = 'PT429';
  end if;
end;
$$;

-- Lista corrispondente a un codice corto o a un token valido e non scaduto.
-- Il token è case sensitive (base64url, 22 caratteri); il codice corto si
-- normalizza (maiuscole, senza spazi né trattini).
create or replace function public.find_household_by_invite(p_code text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select h.id
  from public.households h
  where (
      trim(coalesce(p_code, '')) ~ '^[A-Za-z0-9_-]{22}$'
      and h.invite_token = trim(p_code)
      and h.invite_token_expires_at > now()
    ) or (
      char_length(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))) = 8
      and h.join_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
      and h.join_code_expires_at > now()
    )
  limit 1;
$$;

revoke execute on function public.assert_invite_rate_limit(uuid) from public, anon, authenticated;
revoke execute on function public.find_household_by_invite(text) from public, anon, authenticated;

-- sostituita da find_household_by_invite (esisteva solo nelle prove locali)
drop function if exists public.normalize_join_code(text);

-- Pulizia notturna dei tentativi più vecchi di un giorno.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'frigolo-invite-attempts-cleanup') then
    perform cron.unschedule('frigolo-invite-attempts-cleanup');
  end if;
  perform cron.schedule(
    'frigolo-invite-attempts-cleanup',
    '45 1 * * *',
    $job$delete from public.invite_attempts where attempted_at < now() - interval '1 day'$job$
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Vecchio onboarding: nome e colore passati alle RPC finiscono nel profilo.
-- -----------------------------------------------------------------------------
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
      color        = case when p_color = any (public.member_colors()) then p_color else color end
  where id = p_user
    and (nullif(trim(p_display_name), '') is not null or p_color is not null);
$$;

revoke execute on function public.apply_legacy_profile_args(uuid, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- create_household: crea una lista e ne fa membro il chiamante.
-- security definer: l'utente non è ancora membro, non passerebbe le policy.
-- Il blocco sulla riga del profilo rende atomico il limite di liste (R4).
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

  perform 1 from public.profiles where id = v_user for update;

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
-- join_household: entra in una lista con il codice corto o il token del link.
-- Ritorna l'id della lista, oppure null se il codice è sbagliato o scaduto
-- (niente eccezione: il tentativo fallito deve restare registrato).
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

  perform public.assert_invite_rate_limit(v_user);

  v_id := public.find_household_by_invite(p_code);

  if v_id is null then
    insert into public.invite_attempts (user_id) values (v_user);
    return null;
  end if;

  -- già membro: niente da fare (link di invito riaperto)
  if exists (
    select 1 from public.household_members
    where household_id = v_id and user_id = v_user
  ) then
    return v_id;
  end if;

  -- blocchi: profilo (limite liste) e lista (limite membri)
  perform 1 from public.profiles where id = v_user for update;
  perform 1 from public.households where id = v_id for update;

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
-- get_household_invite: anteprima di un invito (pagina /invito/<token>):
-- nome della lista, quanti membri, se ci sei già. Niente id, niente nomi dei
-- membri. Codice sbagliato o scaduto: nessuna riga (e il tentativo conta).
-- Solo per utenti autenticati: chi apre il link senza account si registra
-- prima, il frontend conserva il token nel frattempo.
-- -----------------------------------------------------------------------------
drop function if exists public.get_household_invite(text);

create function public.get_household_invite(p_code text)
returns table (
  name          text,
  member_count  int,
  is_member     boolean
)
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

  perform public.assert_invite_rate_limit(v_user);

  v_id := public.find_household_by_invite(p_code);

  if v_id is null then
    insert into public.invite_attempts (user_id) values (v_user);
    return;
  end if;

  return query
  select
    h.name,
    (select count(*)::int from public.household_members m where m.household_id = h.id),
    exists (
      select 1 from public.household_members m
      where m.household_id = h.id and m.user_id = v_user
    )
  from public.households h
  where h.id = v_id;
end;
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
-- rotate_join_code: rinnova codice corto e token del link (7 giorni). Il
-- vecchio invito smette subito di funzionare. Ritorna il nuovo codice corto
-- (stessa firma di prima); il token si rilegge da households.
-- security definer con controllo di appartenenza: i client non possono
-- scrivere le colonne dell'invito. Riprova in caso (rarissimo) di collisione.
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
      set join_code = public.generate_join_code(),
          join_code_expires_at = now() + interval '7 days',
          invite_token = public.generate_invite_token(),
          invite_token_expires_at = now() + interval '7 days'
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

-- I client aggiornano solo name e stores; l'invito solo via rotate_join_code
-- (prima un membro poteva impostare un codice scelto da lui, anche debole).
revoke update on public.households from anon, authenticated;
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
-- Tocca solo la riga del chiamante; l'appartenenza si controlla prima di
-- bloccare la lista.
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

  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  -- blocca la lista: due uscite contemporanee vedono lo stesso conteggio
  perform 1 from public.households where id = p_household_id for update;

  delete from public.household_members
  where household_id = p_household_id and user_id = v_user;

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

  if not public.is_household_member(p_household_id) then
    raise exception 'Non fai parte di questa lista' using errcode = '42501';
  end if;

  -- blocca la lista: nessuno può entrare mentre la si elimina
  perform 1 from public.households where id = p_household_id for update;

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
