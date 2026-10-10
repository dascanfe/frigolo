-- Icone piu' precise per alcuni prodotti di base (prima usavano Cherry o
-- Circle): lamponi, mirtilli, piadine e mozzarelle. I prodotti creati dalle
-- case (household_id non nullo) non vengono toccati.
update public.items as i
set icon = v.icon
from (values
  ('Lamponi', 'Raspberry'),
  ('Mirtilli', 'Blueberry'),
  ('Piadine', 'Flatbread'),
  ('Mozzarella', 'Mozzarella'),
  ('Mozzarella di bufala', 'Mozzarella')
) as v(name, icon)
where i.household_id is null
  and i.name = v.name;
