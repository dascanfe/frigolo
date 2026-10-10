-- =============================================================================
-- Frigolo - 0009: ping per il keep-alive
-- Il piano Free mette in pausa il progetto dopo 7 giorni senza richieste:
-- un workflow GitHub chiama questa funzione ogni due giorni. Non tocca dati.
-- =============================================================================

create or replace function public.ping()
returns text
language sql
stable
set search_path = ''
as $$
  select 'pong';
$$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
