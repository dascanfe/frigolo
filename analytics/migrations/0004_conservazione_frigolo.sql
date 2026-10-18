-- =============================================================================
-- Analitiche di dascanfe.com - 0004: le statistiche della landing di Frigolo
-- si cancellano dopo 26 mesi (come scritto nell'informativa privacy).
-- Vale solo per le pagine con sito = 'frigolo' e per le visite rimaste senza
-- pagine; le statistiche del resto di dascanfe.com non vengono toccate.
-- Idempotente.
-- =============================================================================

create or replace function public.frigolo_pulizia()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limite timestamptz := now() - interval '26 months';
begin
  delete from public.eventi e
  using public.pagine p
  where e.pagina_id = p.id and p.sito = 'frigolo' and p.aperta < limite;

  delete from public.pagine p
  where p.sito = 'frigolo' and p.aperta < limite;

  delete from public.visite v
  where v.iniziata < limite
    and not exists (select 1 from public.pagine p where p.visita_id = v.id)
    and not exists (select 1 from public.eventi e where e.visita_id = v.id);
end
$$;
revoke all on function public.frigolo_pulizia() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'frigolo-pulizia';
select cron.schedule('frigolo-pulizia', '37 3 * * *', 'select public.frigolo_pulizia()');

select count(*) as job_pulizia from cron.job where jobname = 'frigolo-pulizia';
