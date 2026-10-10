-- =============================================================================
-- Frigolo - 0016: job notturno del salvataggio automatico (pg_cron)
-- pg_cron ragiona in UTC: 01:00 UTC = 02:00 in inverno e 03:00 in estate in
-- Italia, sempre lontano dall'ora ambigua del cambio d'ora.
-- Un secondo job tiene solo l'ultima settimana del registro di pg_cron.
-- =============================================================================

create extension if not exists pg_cron;

select cron.schedule(
  'frigolo-auto-complete-trips',
  '0 1 * * *',
  'select public.auto_complete_trips()'
);

select cron.schedule(
  'frigolo-cron-cleanup',
  '30 1 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$
);
