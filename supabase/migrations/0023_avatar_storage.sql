-- =============================================================================
-- Frigolo - 0023: foto profilo, quota e file orfani
--
-- 1. Quota: al massimo 5 file nella propria cartella del bucket avatars.
--    Il frontend usa nomi con uuid e cancella la foto precedente, quindi di
--    norma ce n'è una sola; il limite ferma chi riempie lo Storage.
--    Sostituisce la policy di insert della 0006 (stessa regola sulla
--    cartella, più il conteggio).
-- 2. File orfani: avatar_orphans() elenca i file non usati da nessun profilo
--    né da nessuna riga membro (colonna deprecata), più vecchi di un giorno
--    (chi sta caricando una foto non l'ha ancora salvata nel profilo).
--    Si cancellano con la Storage API (il database non permette di
--    cancellare direttamente da storage.objects):
--      node scripts/cleanup-avatar-orphans.mjs
--    con SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nell'ambiente.
--    Solo service_role può chiamarla.
-- =============================================================================

-- Conta i file nella cartella del chiamante. security definer: dentro una
-- policy di storage.objects una sottoquery sulla stessa tabella ricorrerebbe
-- nelle sue policy. Nessun parametro: conta solo i file di auth.uid().
create or replace function public.my_avatar_file_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
  from storage.objects o
  where o.bucket_id = 'avatars'
    and (storage.foldername(o.name))[1] = (select auth.uid())::text;
$$;

revoke execute on function public.my_avatar_file_count() from public, anon;
grant execute on function public.my_avatar_file_count() to authenticated;

drop policy if exists "avatars: ognuno carica nella propria cartella" on storage.objects;
create policy "avatars: ognuno carica nella propria cartella"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.my_avatar_file_count() < 5
  );

create or replace function public.avatar_orphans(p_min_age interval default interval '1 day')
returns table (name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, o.created_at
  from storage.objects o
  where o.bucket_id = 'avatars'
    and o.created_at < now() - p_min_age
    and not exists (select 1 from public.profiles p where p.avatar_path = o.name)
    and not exists (
      select 1 from public.household_members m
      where m.avatar_url like '%/storage/v1/object/public/avatars/' || o.name
    )
  order by o.created_at;
$$;

revoke execute on function public.avatar_orphans(interval) from public, anon, authenticated;
grant execute on function public.avatar_orphans(interval) to service_role;
