-- Ordine delle categorie = percorso tipico di un supermercato italiano:
-- freschi all'ingresso (ortofrutta, pane, banco carne e pesce, frigo),
-- poi scaffali (dispensa, colazione, dolci, bevande), il non alimentare
-- (casa, igiene, animali) e i surgelati per ultimi, cosi' restano freddi
-- fino alla cassa. La lista "Da comprare" segue questo ordine.
update public.categories as c
set sort_order = o.sort_order
from (values
  ('frutta', 10),
  ('verdura', 20),
  ('pane-forno', 30),
  ('carne-pesce', 40),
  ('latticini-uova', 50),
  ('dispensa', 60),
  ('colazione', 70),
  ('snack-dolci', 80),
  ('bevande', 90),
  ('casa-pulizia', 100),
  ('igiene-cura', 110),
  ('animali', 120),
  ('surgelati', 130),
  ('altro', 140)
) as o(slug, sort_order)
where c.slug = o.slug;
