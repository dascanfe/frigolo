-- =============================================================================
-- Frigolo - 0010: supermercati personalizzati per household + Realtime su households
-- Oltre alla lista fissa dell'app, ogni casa puo' aggiungere i propri
-- supermercati dal long press ("+ Aggiungi").
-- =============================================================================

alter table public.households
  add column if not exists custom_stores text[] not null default '{}'
  check (cardinality(custom_stores) <= 30);

comment on column public.households.custom_stores is 'Supermercati aggiunti dalla casa, oltre a quelli predefiniti nell app.';

alter table public.households replica identity full;
alter publication supabase_realtime add table public.households;
