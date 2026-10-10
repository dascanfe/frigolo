-- =============================================================================
-- Frigolo - 0017: correzioni di sicurezza urgenti (audit di Aglio, ottobre 2026)
--
-- 1. Bucket avatars: la policy di SELECT aperta a tutti permetteva, con la sola
--    chiave pubblica, di elencare tutte le cartelle e scaricare ogni foto.
--    Il bucket resta "public": gli URL pubblici delle foto continuano a
--    funzionare senza policy. La SELECT ora vale solo per i propri file
--    (serve all'upload con upsert).
-- 2. household_members: la policy di UPDATE controllava solo user_id, quindi un
--    utente poteva cambiare il proprio household_id ed entrare in un'altra casa
--    senza codice. Ora si possono aggiornare solo le colonne del profilo.
--    Gli RPC security definer non sono toccati da questi grant.
-- =============================================================================

drop policy if exists "avatars: lettura pubblica" on storage.objects;

drop policy if exists "avatars: ognuno legge i propri file" on storage.objects;
create policy "avatars: ognuno legge i propri file"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

revoke update on public.household_members from anon, authenticated;
grant update (display_name, color, avatar_url) on public.household_members to authenticated;
