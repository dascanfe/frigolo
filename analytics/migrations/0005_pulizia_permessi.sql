-- =============================================================================
-- Analitiche di dascanfe.com - 0005: pulizia dei permessi (giro di Aglio)
--
-- 1. anon non ha nessuna policy di scrittura, quindi questi permessi non
--    servivano a nulla: li togliamo per pulizia. Le scritture arrivano dal
--    raccoglitore sul server con la sua chiave e non cambiano.
-- 2. search_path fissato per due funzioni dell'app lav_*.
-- Idempotente.
-- =============================================================================

do $$
declare t text;
begin
  for t in
    select distinct table_name from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  loop
    execute format('revoke insert, update, delete on public.%I from anon', t);
  end loop;
end $$;

alter function public.lav_tocca() set search_path = public, pg_temp;
alter function public.lav_riepilogo() set search_path = public, pg_temp;

select
  (select count(*) from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'
     and privilege_type in ('INSERT', 'UPDATE', 'DELETE')) as scritture_anon_rimaste;
