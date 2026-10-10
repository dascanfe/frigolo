-- =============================================================================
-- Verifica di profili (0018) e liste multiple (0019). SOLO IN LOCALE.
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/checks/profili_liste.sql
--
-- Crea 5 utenti finti, simula le chiamate dei client impostando ruolo e JWT
-- come fa PostgREST, controlla con assert e alla fine annulla tutto
-- (rollback): il database resta com'era. Se un controllo fallisce, psql si
-- ferma con il messaggio dell'assert.
-- =============================================================================

\set QUIET on
\o /dev/null
begin;

-- helper: agisci come un utente (come PostgREST con il suo JWT)
create function pg_temp.as_user(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.as_admin() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- dopo la 0018 le funzioni nuove non sono eseguibili da PUBLIC (audit M5)
grant execute on function pg_temp.as_user(uuid) to authenticated;
grant execute on function pg_temp.as_admin() to authenticated;


-- -----------------------------------------------------------------------------
-- Utenti: U1-U4 con nome nei metadati, U5 senza (profilo da completare)
-- -----------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u1@example.test', '{"display_name":"  Uno  "}', now(), now()),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u2@example.test', '{"display_name":"Due"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u3@example.test', '{"name":"Tre"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u4@example.test', '{"display_name":"Quattro"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u5@example.test', '{}', now(), now());

do $$
begin
  assert (select display_name from public.profiles where id = 'c0000000-0000-0000-0000-000000000001') = 'Uno',
    'profilo creato dal trigger con il nome dei metadati, ripulito';
  assert (select completed_at is not null from public.profiles where id = 'c0000000-0000-0000-0000-000000000003'),
    'nome da metadati "name" -> profilo completo';
  assert (select display_name = 'Utente' and completed_at is null
          from public.profiles where id = 'c0000000-0000-0000-0000-000000000005'),
    'senza nome -> "Utente" e profilo da completare';
end $$;

-- -----------------------------------------------------------------------------
-- Liste: U1 crea A e B, U2 entra in A, U3 crea C, U4 entra in C, U3 entra in A
-- -----------------------------------------------------------------------------
create temp table ids (k text primary key, id uuid, code text);
grant all on ids to authenticated;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000001');
insert into ids select 'A', public.create_household('Lista A');
insert into ids select 'B', public.create_household('  ');
select pg_temp.as_user('c0000000-0000-0000-0000-000000000003');
insert into ids select 'C', public.create_household('Lista C', 'Tre bis', 'c-ochre');
select pg_temp.as_admin();
update ids set code = h.join_code from public.households h where h.id = ids.id;

do $$
begin
  assert (select name from public.households where id = (select id from ids where k = 'B')) = 'Lista',
    'nome vuoto -> "Lista"';
  assert (select display_name from public.profiles where id = 'c0000000-0000-0000-0000-000000000003') = 'Tre bis',
    'vecchio onboarding: p_display_name finisce nel profilo';
  assert (select display_name from public.household_members
          where user_id = 'c0000000-0000-0000-0000-000000000003') = 'Tre bis',
    'la riga membro (deprecata) è riempita dal profilo';
end $$;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000002');
select public.join_household(lower((select code from ids where k = 'A')));
select pg_temp.as_user('c0000000-0000-0000-0000-000000000004');
select public.join_household(substr((select code from ids where k = 'C'), 1, 4) || '-' || substr((select code from ids where k = 'C'), 5));
select pg_temp.as_user('c0000000-0000-0000-0000-000000000003');
select public.join_household((select code from ids where k = 'A'));

do $$
begin
  -- U3 è in due liste (C e A)
  assert (select count(*) from public.households) = 2, 'U3 vede 2 liste';
  -- join idempotente
  assert public.join_household((select code from ids where k = 'A')) = (select id from ids where k = 'A'),
    'join ripetuto ritorna la stessa lista';
  assert (select count(*) from public.household_members where user_id = auth.uid()) = 2,
    'join ripetuto non duplica';
  -- vede i profili di U1, U2 (lista A), U4 (lista C) e il proprio, non U5
  assert (select count(*) from public.profiles) = 4, 'U3 vede 4 profili';
  assert not exists (select 1 from public.profiles where id = 'c0000000-0000-0000-0000-000000000005'),
    'U3 non vede U5';
end $$;

-- U2: solo lista A, niente di C né di B
select pg_temp.as_user('c0000000-0000-0000-0000-000000000002');
do $$
begin
  assert (select count(*) from public.households) = 1, 'U2 vede solo la lista A';
  assert (select count(*) from public.profiles) = 3, 'U2 vede U1, U3 e se stesso';
  assert not exists (select 1 from public.profiles where id = 'c0000000-0000-0000-0000-000000000004'),
    'U2 non vede U4 (sono in liste diverse)';
  assert not exists (select 1 from public.household_members where household_id = (select id from ids where k = 'C')),
    'U2 non vede i membri di C';
  assert (select count(*) from public.get_household_invite((select code from ids where k = 'C'))) = 1,
    'anteprima invito con codice giusto';
  assert (select is_member from public.get_household_invite((select code from ids where k = 'C'))) = false,
    'anteprima: non sei membro';
  assert (select member_count from public.get_household_invite((select code from ids where k = 'C'))) = 2,
    'anteprima: 2 membri';
  assert (select count(*) from public.get_household_invite('ZZZZZZZZ')) = 0,
    'codice sbagliato: nessuna riga';
end $$;

-- U5 (nessuna lista): non vede nulla se non il proprio profilo
select pg_temp.as_user('c0000000-0000-0000-0000-000000000005');
do $$
begin
  assert (select count(*) from public.households) = 0, 'U5 non vede liste';
  assert (select count(*) from public.profiles) = 1, 'U5 vede solo il proprio profilo';
  assert (select count(*) from public.household_members) = 0, 'U5 non vede membri';
end $$;

-- -----------------------------------------------------------------------------
-- Dati per lista: list_entries, items custom, acquisti separati per lista
-- -----------------------------------------------------------------------------
select pg_temp.as_user('c0000000-0000-0000-0000-000000000003');
insert into public.list_entries (household_id, item_id, status, added_by, checked_at)
select (select id from ids where k = 'A'), id, 'cart', auth.uid(), now() from public.items where household_id is null order by name limit 2;
insert into public.list_entries (household_id, item_id, status, added_by, checked_at)
select (select id from ids where k = 'C'), id, 'cart', auth.uid(), now() from public.items where household_id is null order by name limit 3;
insert into public.items (household_id, category_id, name, icon, created_by)
select (select id from ids where k = 'C'), id, 'Solo in C', 'Package', auth.uid() from public.categories order by sort_order limit 1;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000001');
do $$
begin
  assert (select count(*) from public.list_entries) = 2, 'U1 vede solo le voci di A';
  assert not exists (select 1 from public.items where name = 'Solo in C'), 'U1 non vede i prodotti custom di C';
  begin
    insert into public.list_entries (household_id, item_id) select (select id from ids where k = 'C'), id from public.items where household_id is null limit 1;
    assert false, 'U1 non deve poter scrivere in C';
  exception when insufficient_privilege then null;
  end;
end $$;

-- salvataggio notturno: una spesa per lista, anche per chi è in due liste
select pg_temp.as_admin();
do $$
begin
  assert public.auto_complete_trips() >= 2, 'auto_complete_trips crea le spese di A e C';
  assert (select count(*) from public.purchases where household_id = (select id from ids where k = 'A')) = 2, 'acquisti in A';
  assert (select count(*) from public.purchases where household_id = (select id from ids where k = 'C')) = 3, 'acquisti in C';
end $$;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000001');
do $$
begin
  assert (select added_count from public.analytics_members((select id from ids where k = 'A'))
          where user_id = 'c0000000-0000-0000-0000-000000000003') = 2,
    'analitiche: U3 ha aggiunto 2 articoli in A';
  assert (select display_name from public.analytics_members((select id from ids where k = 'A'))
          where user_id = 'c0000000-0000-0000-0000-000000000003') = 'Tre bis',
    'analitiche: nome dal profilo';
  assert (select count(*) from public.analytics_summary((select id from ids where k = 'C'))
          where total_items > 0) = 0,
    'analitiche: U1 non vede i numeri di C';
end $$;

-- -----------------------------------------------------------------------------
-- Profili: modifica propria, non altrui, sincronizzazione con household_members
-- -----------------------------------------------------------------------------
select pg_temp.as_user('c0000000-0000-0000-0000-000000000003');
select public.update_my_profile('Terzo', 'c-teal', 'c0000000-0000-0000-0000-000000000003/a.webp');
do $$
begin
  assert (select count(*) from public.household_members
          where user_id = auth.uid() and display_name = 'Terzo' and color = 'c-teal'
            and avatar_url = 'https://egvodwvnralxttxiovau.supabase.co/storage/v1/object/public/avatars/c0000000-0000-0000-0000-000000000003/a.webp') = 2,
    'profilo -> tutte le righe membro allineate';
  update public.profiles set display_name = 'Hack' where id = 'c0000000-0000-0000-0000-000000000001';
  assert (select display_name from public.profiles where id = 'c0000000-0000-0000-0000-000000000001') = 'Uno',
    'non si modifica il profilo altrui';
  begin
    update public.profiles set avatar_path = 'https://tracker.example.com/p.png' where id = auth.uid();
    assert false, 'URL esterno accettato come percorso';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set avatar_path = 'c0000000-0000-0000-0000-000000000001/x.webp' where id = auth.uid();
    assert false, 'foto nella cartella di un altro accettata';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set avatar_path = 'c0000000-0000-0000-0000-000000000003/../x.webp' where id = auth.uid();
    assert false, 'percorso con .. accettato';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set color = 'c-pink' where id = auth.uid();
    assert false, 'colore fuori tavolozza accettato';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set completed_at = null where id = auth.uid();
    assert false, 'completed_at non deve essere scrivibile';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set display_name = '   ' where id = auth.uid();
    assert false, 'nome vuoto accettato';
  exception when check_violation then null;
  end;
end $$;

-- vecchio frontend: aggiorna la propria riga membro in A
update public.household_members set display_name = 'Tre vecchio', avatar_url = '/avatars/avatar-a.png'
where household_id = (select id from ids where k = 'A') and user_id = auth.uid();
do $$
begin
  assert (select display_name from public.profiles where id = auth.uid()) = 'Tre vecchio',
    'riga membro -> profilo';
  assert (select avatar_path from public.profiles where id = auth.uid()) is null, 'lele non entra nel profilo';
  assert (select count(*) from public.household_members
          where user_id = auth.uid() and display_name = 'Tre vecchio' and avatar_url is null) = 2,
    'riga membro -> profilo -> anche l''altra lista';
end $$;

-- R1: il vecchio frontend scrive un URL con host esterno e percorso giusto
update public.household_members
set avatar_url = 'https://evil.example.com/storage/v1/object/public/avatars/c0000000-0000-0000-0000-000000000003/a.webp'
where household_id = (select id from ids where k = 'A') and user_id = auth.uid();
do $$
begin
  assert (select avatar_path from public.profiles where id = auth.uid()) is null, 'R1: host esterno non entra nel profilo';
  assert not exists (select 1 from public.household_members where avatar_url like '%evil.example.com%'),
    'R1: host esterno azzerato anche nella colonna deprecata';
end $$;
-- e uno valido (host del progetto): diventa il percorso nel profilo
update public.household_members
set avatar_url = 'https://egvodwvnralxttxiovau.supabase.co/storage/v1/object/public/avatars/c0000000-0000-0000-0000-000000000003/b.webp'
where household_id = (select id from ids where k = 'A') and user_id = auth.uid();
do $$
begin
  assert (select avatar_path from public.profiles where id = auth.uid()) = 'c0000000-0000-0000-0000-000000000003/b.webp',
    'URL dello Storage del progetto -> percorso nel profilo';
end $$;

-- U5 completa il profilo
select pg_temp.as_user('c0000000-0000-0000-0000-000000000005');
select public.update_my_profile('Cinque');
do $$
begin
  assert (select completed_at is not null from public.profiles where id = auth.uid()), 'profilo completato';
  assert (select color = any (public.member_colors()) from public.profiles where id = auth.uid()),
    'colore di default valido anche senza sceglierlo';
end $$;

-- -----------------------------------------------------------------------------
-- Codice di invito, rinomina, lasciare, eliminare
-- -----------------------------------------------------------------------------
select pg_temp.as_user('c0000000-0000-0000-0000-000000000002');
do $$
declare v_old text := (select code from ids where k = 'A'); v_new text;
begin
  begin
    update public.households set join_code = 'AAAAAAAA' where id = (select id from ids where k = 'A');
    assert false, 'join_code scritto direttamente';
  exception when insufficient_privilege then null;
  end;
  v_new := public.rotate_join_code((select id from ids where k = 'A'));
  assert v_new <> v_old and char_length(v_new) = 8, 'codice rigenerato';
  begin
    perform public.rotate_join_code((select id from ids where k = 'C'));
    assert false, 'rotate su lista altrui';
  exception when insufficient_privilege then null;
  end;
  assert public.rename_household((select id from ids where k = 'A'), ' Spesa grande ') = 'Spesa grande', 'rinomina';
  begin
    perform public.rename_household((select id from ids where k = 'C'), 'X');
    assert false, 'rinomina lista altrui';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_household((select id from ids where k = 'A'));
    assert false, 'eliminata una lista con altri membri';
  exception when raise_exception then null;
  end;
  begin
    perform public.leave_household((select id from ids where k = 'C'));
    assert false, 'lasciata una lista di cui non si è membri';
  exception when insufficient_privilege then null;
  end;
  assert public.leave_household((select id from ids where k = 'A')) = false, 'U2 lascia A, la lista resta';
  assert (select count(*) from public.households) = 0, 'U2 non vede più A';
  assert public.join_household(v_old) is null, 'il vecchio codice non funziona più';
end $$;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000001');
do $$
begin
  perform public.delete_household((select id from ids where k = 'B'));
  assert not exists (select 1 from public.households where id = (select id from ids where k = 'B')), 'U1 elimina B (unico membro)';
  -- U1 lascia A: resta U3
  assert public.leave_household((select id from ids where k = 'A')) = false, 'U1 lascia A';
end $$;

select pg_temp.as_user('c0000000-0000-0000-0000-000000000003');
do $$
begin
  assert public.leave_household((select id from ids where k = 'A')) = true, 'U3 ultimo membro: A eliminata';
end $$;

select pg_temp.as_admin();
do $$
begin
  assert not exists (select 1 from public.households where id = (select id from ids where k = 'A')), 'A non esiste più';
  assert not exists (select 1 from public.purchases where household_id = (select id from ids where k = 'A')), 'dati di A eliminati';
  -- cancellazione account: U4 se ne va, C resta (c'è U3); poi U3 se ne va e C sparisce
  delete from auth.users where id = 'c0000000-0000-0000-0000-000000000004';
  assert not exists (select 1 from public.profiles where id = 'c0000000-0000-0000-0000-000000000004'), 'profilo di U4 eliminato';
  assert exists (select 1 from public.households where id = (select id from ids where k = 'C')), 'C resta';
  delete from auth.users where id = 'c0000000-0000-0000-0000-000000000003';
  assert not exists (select 1 from public.households where id = (select id from ids where k = 'C')), 'C eliminata con l''ultimo account';
end $$;

-- =============================================================================
-- Regressioni della revisione di Aglio (A1, A2, R2, R5) e dell'audit (M4, M5)
-- =============================================================================
select pg_temp.as_admin();
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u6@example.test', '{"display_name":"Sei","color":"c-ochre"}', now(), now()),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u7@example.test', '{"display_name":"Sette","color":"c-pink"}', now(), now());

do $$
begin
  assert (select color from public.profiles where id = 'c0000000-0000-0000-0000-000000000006') = 'c-ochre',
    'colore scelto alla registrazione';
  assert (select color = any (public.member_colors()) from public.profiles where id = 'c0000000-0000-0000-0000-000000000007'),
    'colore non valido alla registrazione -> uno a caso della tavolozza';
end $$;

-- U6 crea D e la usa per le prove
select pg_temp.as_user('c0000000-0000-0000-0000-000000000006');
insert into ids select 'D', public.create_household('Lista D');
select pg_temp.as_admin();
update ids set code = h.join_code from public.households h where h.id = ids.id and ids.k = 'D';
create temp table tok as select invite_token as t from public.households where id = (select id from ids where k = 'D');
grant select on tok to authenticated;

-- A1: nessuno sposta la propria riga membro in un'altra lista (update senza filtro)
select pg_temp.as_user('c0000000-0000-0000-0000-000000000005');
insert into ids select 'E', public.create_household('Lista E');
do $$
begin
  begin
    update public.household_members set household_id = (select id from ids where k = 'D');
    assert false, 'A1: household_id modificabile';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.household_members set user_id = 'c0000000-0000-0000-0000-000000000006';
    assert false, 'A1: user_id modificabile';
  exception when insufficient_privilege then null;
  end;
end $$;

-- R5 e token del link: l'anteprima non dà l'id; il token funziona; scaduto no
do $$
begin
  assert pg_get_function_result('public.get_household_invite(text)'::regprocedure) !~ 'household_id',
    'R5: get_household_invite non restituisce l''id';
  assert (select name from public.get_household_invite((select t from tok))) = 'Lista D', 'anteprima via token';
  assert (select count(*) from public.get_household_invite(lower((select t from tok)))) = 0,
    'il token distingue maiuscole e minuscole';
  assert public.join_household((select t from tok)) = (select id from ids where k = 'D'), 'join via token del link';
  assert char_length((select t from tok)) = 22, 'token di 22 caratteri (128 bit)';
end $$;

select pg_temp.as_admin();
update public.households set join_code_expires_at = now() - interval '1 minute'
where id = (select id from ids where k = 'D');
select pg_temp.as_user('c0000000-0000-0000-0000-000000000002');
do $$
begin
  assert public.join_household((select code from ids where k = 'D')) is null, 'codice corto scaduto rifiutato';
end $$;

-- R2: dopo 10 tentativi falliti in un'ora, errore 429 per qualunque codice
select pg_temp.as_user('c0000000-0000-0000-0000-000000000007');
do $$
declare i int;
begin
  for i in 1 .. 10 loop
    assert public.join_household('ZZZZ' || lpad(i::text, 4, '2')) is null, 'codice sbagliato -> null';
  end loop;
  begin
    perform public.join_household((select t from tok));
    assert false, 'R2: join non limitato dopo 10 tentativi';
  exception when sqlstate 'PT429' then null;
  end;
  begin
    perform * from public.get_household_invite((select t from tok));
    assert false, 'R2: anteprima non limitata dopo 10 tentativi';
  exception when sqlstate 'PT429' then null;
  end;
  assert not exists (select 1 from public.household_members where user_id = auth.uid()), 'R2: U7 non è entrato';
end $$;

select pg_temp.as_admin();
do $$
begin
  assert (select count(*) from public.invite_attempts where user_id = 'c0000000-0000-0000-0000-000000000007') = 10,
    'tentativi falliti registrati';
  assert exists (select 1 from cron.job where jobname = 'frigolo-invite-attempts-cleanup'), 'job di pulizia dei tentativi';
end $$;

-- Limite di 50 liste per utente (U5 ne ha già 2: E e D)
select pg_temp.as_user('c0000000-0000-0000-0000-000000000005');
do $$
declare i int;
begin
  for i in 3 .. 50 loop
    perform public.create_household('L' || i);
  end loop;
  begin
    perform public.create_household('L51');
    assert false, 'creata la 51esima lista';
  exception when raise_exception then null;
  end;
end $$;

-- Limite di 20 membri per lista: D ha U6 e U5, entrano altri 18, il 21esimo no
select pg_temp.as_admin();
do $$
declare i int; v_user uuid; v_tok text := (select t from tok);
begin
  for i in 1 .. 19 loop
    v_user := ('d0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    perform pg_temp.as_admin();
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm' || i || '@example.test', '{}', now(), now());
    perform pg_temp.as_user(v_user);
    if i < 19 then
      assert public.join_household(v_tok) is not null, 'membro entrato';
    else
      begin
        perform public.join_household(v_tok);
        assert false, 'entrato il 21esimo membro';
      exception when raise_exception then null;
      end;
    end if;
  end loop;
  perform pg_temp.as_admin();
  assert (select count(*) from public.household_members where household_id = (select id from ids where k = 'D')) = 20,
    'D ha 20 membri';
end $$;

-- M4: lunghezze e quote (scritture dirette dei client)
select pg_temp.as_user('c0000000-0000-0000-0000-000000000006');
do $$
declare v_d uuid := (select id from ids where k = 'D'); v_cat uuid := (select id from public.categories order by sort_order limit 1);
begin
  begin
    insert into public.list_entries (household_id, item_id, unit)
    select v_d, id, 'unitàlunghissima' from public.items where household_id is null limit 1;
    assert false, 'M4: unit troppo lunga accettata';
  exception when check_violation then null;
  end;
  begin
    update public.households set stores = stores || repeat('x', 41) where id = v_d;
    assert false, 'M4: supermercato troppo lungo accettato';
  exception when check_violation then null;
  end;
  insert into public.items (household_id, category_id, name, icon, created_by)
  select v_d, v_cat, 'Custom ' || g, 'Package', auth.uid() from generate_series(1, 500) g;
  begin
    insert into public.items (household_id, category_id, name, icon, created_by)
    values (v_d, v_cat, 'Custom 501', 'Package', auth.uid());
    assert false, 'M4: 501esimo prodotto personalizzato accettato';
  exception when raise_exception then null;
  end;
  insert into public.list_entries (household_id, item_id, status, added_by, checked_at)
  select v_d, id, 'cart', auth.uid(), now() from public.items where household_id = v_d order by name limit 300;
  begin
    insert into public.list_entries (household_id, item_id)
    select v_d, id from public.items where household_id is null limit 1;
    assert false, 'M4: 301esima voce accettata';
  exception when raise_exception then null;
  end;
end $$;

-- il salvataggio notturno non è mai bloccato dalle quote
-- (auto_cart è la tabella temporanea della chiamata precedente, nella stessa transazione)
select pg_temp.as_admin();
drop table if exists pg_temp.auto_cart;
do $$
begin
  assert public.auto_complete_trips((select id from ids where k = 'D')) >= 1, 'auto_complete_trips con 300 voci';
  assert (select count(*) from public.purchases where household_id = (select id from ids where k = 'D')) = 300,
    '300 acquisti salvati';
end $$;

-- M5: oggetti nuovi in public non danno permessi ad anon
create table public.zz_check_m5 (id int);
create function public.zz_check_m5_fn() returns int language sql as $$ select 1 $$;
do $$
begin
  assert not has_table_privilege('anon', 'public.zz_check_m5', 'select'), 'M5: anon legge una tabella nuova';
  assert has_table_privilege('authenticated', 'public.zz_check_m5', 'select'), 'M5: authenticated invariato';
  assert not has_function_privilege('anon', 'public.zz_check_m5_fn()', 'execute'), 'M5: anon esegue una funzione nuova';
  assert not has_function_privilege('anon', 'public.member_colors()', 'execute'), 'R3: funzioni di supporto non per anon';
  assert not has_function_privilege('anon', 'public.find_household_by_invite(text)', 'execute'), 'R3';
  assert not has_function_privilege('authenticated', 'public.find_household_by_invite(text)', 'execute'),
    'find_household_by_invite non chiamabile dai client';
end $$;

-- A2: anon non elenca le foto, un utente vede solo i propri file
insert into storage.objects (bucket_id, name, owner_id)
values ('avatars', 'c0000000-0000-0000-0000-000000000006/a.webp', 'c0000000-0000-0000-0000-000000000006'),
       ('avatars', 'c0000000-0000-0000-0000-000000000005/a.webp', 'c0000000-0000-0000-0000-000000000005');
select pg_temp.as_user('c0000000-0000-0000-0000-000000000006');
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'avatars') = 1, 'A2: un utente vede solo i propri file';
end $$;
select pg_temp.as_admin();
set local role anon;
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'avatars') = 0, 'A2: anon non elenca le foto';
end $$;
reset role;

-- anon non legge nulla
set local role anon;
do $$
begin
  begin
    perform 1 from public.profiles limit 1;
    assert false, 'anon legge profiles';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_household_invite('AAAAAAAA');
    assert false, 'anon usa get_household_invite';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

\o
\echo 'profili_liste: tutti i controlli passati'
rollback;
