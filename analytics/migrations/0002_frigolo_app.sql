-- =============================================================================
-- Analitiche di dascanfe.com - 0002: metriche dell'app di Frigolo
--
-- Progetto Supabase: quello delle statistiche di dascanfe.com.
--
-- Perché: il cruscotto di Frigolo deve chiedere un solo accesso, quello di
-- questo progetto. Le metriche d'uso dell'app (solo aggregati) arrivano ogni
-- ora dal database di Frigolo (job frigolo-metrics-push, migration 0025 di
-- Frigolo) attraverso la RPC frigolo_app_ingest, e restano qui in una riga
-- sola che si legge con le stesse regole delle visite.
--
-- Cosa fa:
--   1. frigolo_app_snapshot: una riga, l'ultima istantanea ricevuta;
--      leggibile solo da chi vede stato_sistema (cioè solo il proprietario:
--      stessa regola "lettura proprietario", senza scrivere l'email qui);
--   2. frigolo_app_chiave: l'hash SHA-256 del segreto condiviso con Frigolo.
--      Nessun accesso dai client. Il segreto in chiaro non sta qui;
--   3. frigolo_app_ingest(p_segreto, p_dati): chiamabile con la chiave
--      pubblica, scrive solo se l'hash del segreto torna e i dati hanno la
--      forma attesa. Non legge e non restituisce niente.
--
-- Idempotente. Non tocca visite, pagine, eventi né le loro regole.
-- =============================================================================

create table if not exists public.frigolo_app_snapshot (
  id         int primary key default 1,
  dati       jsonb not null,
  ricevuto   timestamptz not null default now(),
  constraint frigolo_app_snapshot_una_riga check (id = 1)
);

comment on table public.frigolo_app_snapshot is 'Ultime metriche aggregate dell app di Frigolo, inviate ogni ora dal suo database. Solo conteggi.';

alter table public.frigolo_app_snapshot enable row level security;
revoke all on public.frigolo_app_snapshot from public, anon, authenticated;
grant select on public.frigolo_app_snapshot to authenticated;

drop policy if exists "lettura proprietario" on public.frigolo_app_snapshot;
create policy "lettura proprietario" on public.frigolo_app_snapshot
  for select to authenticated
  using (exists (select 1 from public.stato_sistema));

create table if not exists public.frigolo_app_chiave (
  id    int primary key default 1,
  hash  text not null check (hash ~ '^[0-9a-f]{64}$'),
  constraint frigolo_app_chiave_una_riga check (id = 1)
);

comment on table public.frigolo_app_chiave is 'Hash SHA-256 del segreto con cui il database di Frigolo invia le metriche. Si imposta a mano.';

alter table public.frigolo_app_chiave enable row level security;
revoke all on public.frigolo_app_chiave from public, anon, authenticated;

create or replace function public.frigolo_app_ingest(p_segreto text, p_dati jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_segreto is null
     or char_length(p_segreto) > 200
     or not exists (
       select 1 from public.frigolo_app_chiave
       where hash = encode(sha256(convert_to(p_segreto, 'UTF8')), 'hex')
     ) then
    raise exception 'Non autorizzato.' using errcode = '42501';
  end if;

  if p_dati is null
     or jsonb_typeof(p_dati -> 'periodi') <> 'object'
     or pg_column_size(p_dati) > 2000000 then
    raise exception 'Dati non validi.' using errcode = '22023';
  end if;

  insert into public.frigolo_app_snapshot as s (id, dati, ricevuto)
  values (1, p_dati, now())
  on conflict (id) do update set dati = excluded.dati, ricevuto = excluded.ricevuto;
end;
$$;

revoke execute on function public.frigolo_app_ingest(text, jsonb) from public;
grant execute on function public.frigolo_app_ingest(text, jsonb) to anon;

-- Esito: deve dire tabella = 1, funzione = 1
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'frigolo_app_snapshot') as tabella,
  (select count(*) from pg_proc where proname = 'frigolo_app_ingest') as funzione;
