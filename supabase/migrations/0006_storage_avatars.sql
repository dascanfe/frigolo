-- =============================================================================
-- Frigolo - 0006: bucket Storage per le foto profilo
-- Bucket pubblico in lettura (l'URL dell'avatar e' salvato in
-- household_members.avatar_url), scrittura solo nella propria cartella
-- avatars/<user_id>/...
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars: lettura pubblica"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars: ognuno carica nella propria cartella"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: ognuno aggiorna i propri file"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: ognuno cancella i propri file"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
