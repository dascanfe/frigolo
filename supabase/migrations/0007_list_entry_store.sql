-- =============================================================================
-- Frigolo - 0007: supermercato per articolo
-- Dal long press sulla tile si sceglie dove comprare il prodotto; il nome
-- viene mostrato come pill nella tile. Testo libero (lista chiusa nel client),
-- null = nessuna preferenza.
-- =============================================================================

alter table public.list_entries
  add column if not exists store text
  check (store is null or char_length(store) <= 40);

comment on column public.list_entries.store is 'Supermercato scelto per questo articolo (es. Lidl), null = nessuno.';
