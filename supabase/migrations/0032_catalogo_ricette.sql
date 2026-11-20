-- =============================================================================
-- 0032 - Catalogo: 4 prodotti base per le ricette di Ispirazioni (app 2.4.0)
--
-- Le idee per i piatti ora hanno ingredienti completi e il procedimento; questi
-- ingredienti servivano e nel catalogo base non c'erano:
-- - Alloro (agnello al forno, polpo, cotechino con lenticchie)
-- - Carne per brodo (tortellini in brodo)
-- - Ricotta salata (pasta alla Norma)
-- - Giardiniera (insalata di rinforzo)
--
-- - Solo prodotti base nuovi: categorie, prodotti personalizzati, liste e
--   acquisti non vengono toccati.
-- - Idempotente: si può rilanciare senza doppioni (un prodotto base che esiste
--   già con lo stesso nome non viene modificato).
-- - Nessuno è frutta o verdura di stagione: season_months vuoto (tutto l'anno).
-- =============================================================================

insert into public.items (household_id, category_id, name, icon, default_unit, season_months)
select null, c.id, v.name, v.icon, v.unit, v.months::int[]
from (values
  ('verdura', 'Alloro', 'Leaf', 'pz', '{}'),
  ('carne', 'Carne per brodo', 'Beef', 'kg', '{}'),
  ('latticini-uova', 'Ricotta salata', 'CakeSlice', 'g', '{}'),
  ('dispensa', 'Giardiniera', 'Jar', 'pz', '{}')
) as v(slug, name, icon, unit, months)
join public.categories c on c.slug = v.slug
on conflict (household_id, lower(name)) do nothing;
