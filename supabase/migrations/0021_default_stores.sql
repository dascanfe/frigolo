-- =============================================================================
-- Frigolo - 0021: supermercati di partenza per le liste nuove
--
-- Perché: il default di households.stores era la lista di casa di Daniele
-- (catene venete come Cadoro, Lando, Prix, Maxi, Alì e negozi personali).
-- Per un'app pubblica le liste nuove partono da catene presenti in tutta
-- Italia più il mercato, la stessa lista di DEFAULT_STORES nel frontend
-- (src/types/domain.ts): se cambia una, va cambiata anche l'altra.
--
-- Cambia solo il default: le liste esistenti tengono i loro supermercati.
-- =============================================================================

alter table public.households alter column stores set default array[
  'Lidl', 'Eurospin', 'Conad', 'Coop', 'Carrefour', 'MD', 'Mercato'
]::text[];

comment on column public.households.stores is 'Supermercati della lista: all inizio quelli di DEFAULT_STORES, poi modificabili (aggiungi, rinomina, elimina).';
