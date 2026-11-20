-- =============================================================================
-- 0032 - Catalogo: ingredienti delle ricette e prodotti comuni, 124 base nuovi (app 2.4.0)
--
-- Le idee di Ispirazioni ora hanno ingredienti completi e il procedimento.
-- 1. Ingredienti che nel catalogo base non c'erano: Alloro, Carne per brodo,
--    Ricotta salata, Giardiniera, e quelli giusti al posto dei prodotti
--    "vicini" usati prima: Ditalini (pasta e ceci, pasta e fagioli), Trofie
--    (pesto), Riso parboiled (insalata di riso), Fagioli borlotti (pasta e
--    fagioli, minestrone), Fagioli cannellini (ribollita), Gallina (tortellini
--    in brodo), Lievito di birra (schiacciata all'uva).
-- 2. Prodotti comuni al supermercato che mancavano, in tutte le categorie.
-- In tutto 124 prodotti base nuovi: il catalogo base passa da 497 a 621.
--
-- - Solo prodotti base nuovi: categorie, prodotti personalizzati, liste e
--   acquisti non vengono toccati.
-- - Idempotente: si può rilanciare senza doppioni (un prodotto base che esiste
--   già con lo stesso nome non viene modificato).
-- - Niente marchi commerciali. season_months solo per frutta, verdura, pesce
--   e dolci di stagione; vuoto = tutto l'anno.
-- =============================================================================

insert into public.items (household_id, category_id, name, icon, default_unit, season_months)
select null, c.id, v.name, v.icon, v.unit, v.months::int[]
from (values
  -- Ingredienti delle ricette (prima versione della 0032)
  ('verdura', 'Alloro', 'Leaf', 'pz', '{}'),
  ('carne', 'Carne per brodo', 'Beef', 'kg', '{}'),
  ('latticini-uova', 'Ricotta salata', 'CakeSlice', 'g', '{}'),
  ('dispensa', 'Giardiniera', 'Jar', 'pz', '{}'),
  -- Frutta
  ('frutta', 'Ribes', 'Raspberry', 'conf', '{6,7,8}'),
  ('frutta', 'Fragoline di bosco', 'Strawberry', 'conf', '{5,6,7}'),
  ('frutta', 'Papaya', 'Peach', 'pz', '{}'),
  ('frutta', 'Litchi', 'Cherry', 'conf', '{11,12,1}'),
  ('frutta', 'Alchechengi', 'Cherry', 'conf', '{9,10,11,12}'),
  -- Verdura
  ('verdura', 'Topinambur', 'Potato', 'kg', '{10,11,12,1,2,3}'),
  ('verdura', 'Sedano rapa', 'Carrot', 'pz', '{10,11,12,1,2,3}'),
  ('verdura', 'Puntarelle', 'Sprout', 'conf', '{11,12,1,2,3}'),
  ('verdura', 'Agretti', 'Sprout', 'conf', '{3,4,5}'),
  ('verdura', 'Cardi', 'Sprout', 'kg', '{11,12,1,2}'),
  ('verdura', 'Indivia belga', 'LeafyGreen', 'pz', '{10,11,12,1,2,3}'),
  ('verdura', 'Cavolo rosso', 'LeafyGreen', 'pz', '{10,11,12,1,2,3}'),
  ('verdura', 'Friggitelli', 'BellPepper', 'kg', '{6,7,8,9}'),
  ('verdura', 'Fagioli freschi', 'Bean', 'kg', '{7,8,9}'),
  ('verdura', 'Aneto', 'Leaf', 'pz', '{}'),
  ('verdura', 'Maggiorana', 'Leaf', 'pz', '{}'),
  ('verdura', 'Coriandolo', 'Leaf', 'pz', '{}'),
  -- Pane e forno
  ('pane-forno', 'Rosette', 'Bread', 'conf', '{}'),
  ('pane-forno', 'Friselle', 'Bread', 'conf', '{}'),
  ('pane-forno', 'Pane per tramezzini', 'Sandwich', 'conf', '{}'),
  ('pane-forno', 'Pan di Spagna', 'Cake', 'pz', '{}'),
  ('pane-forno', 'Pasta brisée', 'Layers', 'conf', '{}'),
  -- Carne
  ('carne', 'Fettine di manzo', 'Beef', 'kg', '{}'),
  ('carne', 'Filetto di manzo', 'Beef', 'kg', '{}'),
  ('carne', 'Ossobuco', 'Beef', 'kg', '{}'),
  ('carne', 'Lonza di maiale', 'Beef', 'kg', '{}'),
  ('carne', 'Filetto di maiale', 'Beef', 'kg', '{}'),
  ('carne', 'Trippa', 'Beef', 'kg', '{}'),
  ('carne', 'Gallina', 'Drumstick', 'pz', '{}'),
  ('carne', 'Faraona', 'Drumstick', 'pz', '{}'),
  ('carne', 'Cappone', 'Drumstick', 'pz', '{11,12}'),
  ('carne', 'Zampone', 'Sausage', 'pz', '{11,12,1}'),
  ('carne', 'Porchetta', 'Ham', 'g', '{}'),
  -- Pesce
  ('pesce', 'Sogliola', 'Fish', 'pz', '{}'),
  ('pesce', 'Platessa', 'Fish', 'kg', '{}'),
  ('pesce', 'Rana pescatrice', 'Fish', 'kg', '{}'),
  ('pesce', 'Cernia', 'Fish', 'kg', '{}'),
  ('pesce', 'Pesce persico', 'Fish', 'kg', '{}'),
  ('pesce', 'Stoccafisso', 'Fish', 'kg', '{11,12,1,2,3}'),
  ('pesce', 'Moscardini', 'Shell', 'kg', '{3,4,5,6}'),
  ('pesce', 'Cannolicchi', 'Shell', 'kg', '{}'),
  -- Latticini e uova
  ('latticini-uova', 'Fiocchi di latte', 'Cloud', 'pz', '{}'),
  ('latticini-uova', 'Squacquerone', 'Cloud', 'pz', '{}'),
  ('latticini-uova', 'Primosale', 'Cloud', 'pz', '{}'),
  ('latticini-uova', 'Caciocavallo', 'Amphora', 'pz', '{}'),
  ('latticini-uova', 'Quartirolo', 'CakeSlice', 'g', '{}'),
  ('latticini-uova', 'Montasio', 'CakeSlice', 'g', '{}'),
  ('latticini-uova', 'Brie', 'CakeSlice', 'g', '{}'),
  -- Dispensa e secco
  ('dispensa', 'Ditalini', 'Utensils', 'conf', '{}'),
  ('dispensa', 'Trofie', 'Utensils', 'conf', '{}'),
  ('dispensa', 'Bucatini', 'Utensils', 'conf', '{}'),
  ('dispensa', 'Paccheri', 'Utensils', 'conf', '{}'),
  ('dispensa', 'Mezze maniche', 'Utensils', 'conf', '{}'),
  ('dispensa', 'Pastina', 'Soup', 'conf', '{}'),
  ('dispensa', 'Riso parboiled', 'Soup', 'conf', '{}'),
  ('dispensa', 'Quinoa', 'Wheat', 'conf', '{}'),
  ('dispensa', 'Fecola di patate', 'PaperBag', 'conf', '{}'),
  ('dispensa', 'Amido di mais', 'PaperBag', 'conf', '{}'),
  ('dispensa', 'Lievito di birra', 'Package', 'conf', '{}'),
  ('dispensa', 'Vanillina', 'Package', 'conf', '{}'),
  ('dispensa', 'Gocce di cioccolato', 'Grid3x3', 'conf', '{}'),
  ('dispensa', 'Dolcificante', 'Cuboid', 'conf', '{}'),
  ('dispensa', 'Purè in fiocchi', 'Potato', 'conf', '{}'),
  ('dispensa', 'Fagioli borlotti', 'Can', 'pz', '{}'),
  ('dispensa', 'Fagioli cannellini', 'Can', 'pz', '{}'),
  ('dispensa', 'Sgombro in scatola', 'Can', 'conf', '{}'),
  ('dispensa', 'Latte di cocco', 'Can', 'pz', '{}'),
  ('dispensa', 'Pomodori secchi', 'Jar', 'pz', '{}'),
  ('dispensa', 'Carciofini sott''olio', 'Jar', 'pz', '{}'),
  ('dispensa', 'Aceto di mele', 'Droplets', 'pz', '{}'),
  ('dispensa', 'Brodo di carne', 'Carton', 'pz', '{}'),
  ('dispensa', 'Curcuma', 'SaltShaker', 'pz', '{}'),
  ('dispensa', 'Chiodi di garofano', 'SaltShaker', 'pz', '{}'),
  ('dispensa', 'Anacardi', 'Nut', 'conf', '{}'),
  ('dispensa', 'Prugne secche', 'Plum', 'conf', '{}'),
  -- Colazione
  ('colazione', 'Caffè decaffeinato', 'Coffee', 'conf', '{}'),
  ('colazione', 'Caffè solubile', 'Coffee', 'conf', '{}'),
  -- Snack e dolci
  ('snack-dolci', 'Salatini', 'Cookie', 'conf', '{}'),
  ('snack-dolci', 'Crostatine', 'Cake', 'conf', '{}'),
  ('snack-dolci', 'Budino', 'Dessert', 'conf', '{}'),
  ('snack-dolci', 'Torrone', 'Grid3x3', 'pz', '{11,12,1}'),
  ('snack-dolci', 'Liquirizia', 'Candy', 'conf', '{}'),
  ('snack-dolci', 'Gomme da masticare', 'Candy', 'conf', '{}'),
  -- Bevande
  ('bevande', 'Vino rosato', 'Wine', 'pz', '{}'),
  ('bevande', 'Marsala', 'BottleWine', 'pz', '{}'),
  ('bevande', 'Vermouth', 'Martini', 'pz', '{}'),
  ('bevande', 'Vodka', 'Martini', 'pz', '{}'),
  ('bevande', 'Rum', 'BottleWine', 'pz', '{}'),
  ('bevande', 'Whisky', 'BottleWine', 'pz', '{}'),
  ('bevande', 'Succo ACE', 'Carton', 'pz', '{}'),
  ('bevande', 'Latte di riso', 'Carton', 'l', '{}'),
  -- Casa e pulizia
  ('casa-pulizia', 'Igienizzante bucato', 'Droplets', 'pz', '{}'),
  ('casa-pulizia', 'Sapone di Marsiglia', 'Cuboid', 'pz', '{}'),
  ('casa-pulizia', 'Acido citrico', 'FlaskConical', 'conf', '{}'),
  ('casa-pulizia', 'Deodorante per ambienti', 'SprayCan', 'pz', '{}'),
  ('casa-pulizia', 'Lucidante per mobili', 'SprayCan', 'pz', '{}'),
  ('casa-pulizia', 'Panni cattura polvere', 'BrushCleaning', 'conf', '{}'),
  ('casa-pulizia', 'Pagliette', 'BrushCleaning', 'conf', '{}'),
  ('casa-pulizia', 'Mollette', 'Hand', 'conf', '{}'),
  ('casa-pulizia', 'Stuzzicadenti', 'Utensils', 'conf', '{}'),
  -- Igiene e cura
  ('igiene-cura', 'Testine per spazzolino', 'ToothbrushSparkles', 'conf', '{}'),
  ('igiene-cura', 'Dopobarba', 'FlaskRound', 'pz', '{}'),
  ('igiene-cura', 'Lacca', 'SprayCan', 'pz', '{}'),
  ('igiene-cura', 'Gel per capelli', 'TubeLotion', 'pz', '{}'),
  ('igiene-cura', 'Elastici per capelli', 'Circle', 'conf', '{}'),
  ('igiene-cura', 'Proteggislip', 'Feather', 'conf', '{}'),
  ('igiene-cura', 'Cotone idrofilo', 'Cloud', 'conf', '{}'),
  ('igiene-cura', 'Pasta per il cambio', 'TubeLotion', 'pz', '{}'),
  ('igiene-cura', 'Fermenti lattici', 'PillBottle', 'conf', '{}'),
  ('igiene-cura', 'Preservativi', 'Package', 'conf', '{}'),
  -- Animali
  ('animali', 'Traversine per cani', 'Layers', 'conf', '{}'),
  ('animali', 'Cibo per tartarughe', 'Turtle', 'conf', '{}'),
  ('animali', 'Fieno', 'Rabbit', 'conf', '{}'),
  -- Surgelati
  ('surgelati', 'Verdure miste surgelate', 'Carrot', 'conf', '{}'),
  ('surgelati', 'Soffritto surgelato', 'Carrot', 'conf', '{}'),
  ('surgelati', 'Carciofi surgelati', 'Flower', 'conf', '{}'),
  ('surgelati', 'Salmone surgelato', 'Fish', 'conf', '{}'),
  ('surgelati', 'Lasagne surgelate', 'Layers', 'conf', '{}'),
  -- Altro
  ('altro', 'Carbonella', 'Flame', 'conf', '{}'),
  ('altro', 'Concime', 'PlantPot', 'conf', '{}')
) as v(slug, name, icon, unit, months)
join public.categories c on c.slug = v.slug
on conflict (household_id, lower(name)) do nothing;
