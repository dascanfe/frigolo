# Proposta di catalogo esteso (migration 0029)

Bozza per la revisione di Daniele: i prodotti base **nuovi** che la migration `0029_catalogo_esteso.sql`
aggiunge al catalogo, per categoria. Il catalogo di oggi ha 234 prodotti, con questi arriva a **497**.

Cosa cambia in breve:

- **Carne e pesce** diventano due categorie: **Carne** (che prende il posto di "Carne e pesce", stesso id) e
  **Pesce**, subito dopo nel percorso del supermercato. I 9 prodotti di pesce già in catalogo
  (Salmone, Merluzzo, Orata, Branzino, Tonno fresco, Gamberi, Cozze, Vongole, Calamari) passano a Pesce; salumi e affettati restano in Carne.
- Prodotti personalizzati e liste esistenti non vengono toccati. Lo storico degli acquisti dei 9 prodotti
  di pesce segue la nuova categoria, così le analitiche per categoria restano giuste.
- Niente marchi commerciali. Mesi = stagionalità italiana (vuoto: tutto l'anno). Le icone sono tutte già presenti in app
  (a volte la più vicina: per esempio Mango usa la pesca, Polpo e Seppie usano la conchiglia).
- La sezione "Di stagione" del catalogo e quella di Ispirazioni usano i mesi di frutta, verdura e pesce.

| Categoria        | Prodotti già presenti |   Nuovi |  Totale |
| ---------------- | --------------------: | ------: | ------: |
| Frutta           |                    24 |      12 |      36 |
| Verdura          |                    31 |      28 |      59 |
| Pane e forno     |                    10 |      11 |      21 |
| Carne            |                    15 |      22 |      37 |
| Pesce            |                     9 |      16 |      25 |
| Latticini e uova |                    21 |      20 |      41 |
| Dispensa e secco |                    27 |      51 |      78 |
| Colazione        |                    12 |      13 |      25 |
| Snack e dolci    |                    11 |      16 |      27 |
| Bevande          |                    12 |      14 |      26 |
| Casa e pulizia   |                    24 |      12 |      36 |
| Igiene e cura    |                    19 |      17 |      36 |
| Animali          |                     5 |       8 |      13 |
| Surgelati        |                    10 |      15 |      25 |
| Altro            |                     4 |       8 |      12 |
| **Totale**       |               **234** | **263** | **497** |

(In "già presenti" Pesce conta i 9 prodotti spostati da "Carne e pesce".)

## Frutta (12 nuovi)

| Prodotto      | Icona     | Unità | Mesi di stagione        |
| ------------- | --------- | ----- | ----------------------- |
| Clementine    | Citrus    | kg    | nov, dic, gen           |
| Pesche noci   | Peach     | kg    | giu, lug, ago           |
| Nespole       | Plum      | kg    | mag, giu                |
| Fichi d'India | Fig       | kg    | ago, set, ott           |
| Mango         | Peach     | pz    | tutto l'anno            |
| More          | Raspberry | conf  | lug, ago, set           |
| Limette       | Citrus    | pz    | tutto l'anno            |
| Arance rosse  | Citrus    | kg    | dic, gen, feb, mar, apr |
| Cotogne       | Pear      | kg    | ott, nov                |
| Datteri       | Fig       | conf  | tutto l'anno            |
| Mele annurche | Apple     | kg    | ott, nov, dic, gen      |
| Cocco         | TreePalm  | pz    | tutto l'anno            |

## Verdura (28 nuovi)

| Prodotto              | Icona      | Unità | Mesi di stagione                  |
| --------------------- | ---------- | ----- | --------------------------------- |
| Patate dolci          | Potato     | kg    | ott, nov, dic, gen, feb           |
| Patate novelle        | Potato     | kg    | mag, giu, lug                     |
| Cipolle rosse         | Onion      | kg    | tutto l'anno                      |
| Cipolle di Tropea     | Onion      | kg    | giu, lug, ago, set                |
| Cipollotti            | Onion      | conf  | apr, mag, giu, lug                |
| Scalogno              | Onion      | pz    | tutto l'anno                      |
| Lattuga               | Salad      | pz    | mar, apr, mag, giu, set, ott, nov |
| Songino               | LeafyGreen | conf  | ott, nov, dic, gen, feb, mar      |
| Scarola               | LeafyGreen | pz    | ott, nov, dic, gen, feb, mar      |
| Cicoria               | LeafyGreen | kg    | ott, nov, dic, gen, feb, mar      |
| Cime di rapa          | LeafyGreen | kg    | nov, dic, gen, feb, mar, apr      |
| Cavolini di Bruxelles | Broccoli   | kg    | ott, nov, dic, gen, feb           |
| Cavolo cappuccio      | LeafyGreen | pz    | ott, nov, dic, gen, feb, mar      |
| Cavolo romanesco      | Broccoli   | pz    | ott, nov, dic, gen, feb, mar      |
| Ravanelli             | Carrot     | conf  | mar, apr, mag, giu, set, ott      |
| Barbabietola          | Carrot     | kg    | ott, nov, dic, gen, feb, mar      |
| Zenzero               | Leaf       | pz    | tutto l'anno                      |
| Fiori di zucca        | Flower     | conf  | mag, giu, lug, ago, set           |
| Pomodori cuore di bue | Tomato     | kg    | giu, lug, ago, set                |
| Insalata in busta     | Salad      | conf  | tutto l'anno                      |
| Rosmarino             | Leaf       | pz    | tutto l'anno                      |
| Salvia                | Leaf       | pz    | tutto l'anno                      |
| Menta                 | Leaf       | pz    | tutto l'anno                      |
| Timo                  | Leaf       | pz    | tutto l'anno                      |
| Erba cipollina        | Leaf       | pz    | tutto l'anno                      |
| Funghi porcini        | Mushroom   | conf  | set, ott, nov                     |
| Soffritto             | Carrot     | conf  | tutto l'anno                      |
| Peperoncini freschi   | Flame      | conf  | giu, lug, ago, set                |

## Pane e forno (11 nuovi)

| Prodotto           | Icona     | Unità | Mesi di stagione |
| ------------------ | --------- | ----- | ---------------- |
| Panini             | Bread     | conf  | tutto l'anno     |
| Baguette           | Bread     | pz    | tutto l'anno     |
| Ciabatta           | Bread     | pz    | tutto l'anno     |
| Pane di segale     | Bread     | pz    | tutto l'anno     |
| Pane senza glutine | Bread     | pz    | tutto l'anno     |
| Panini al latte    | Bread     | conf  | tutto l'anno     |
| Tortillas          | Flatbread | conf  | tutto l'anno     |
| Pane carasau       | Flatbread | conf  | tutto l'anno     |
| Pasta frolla       | Layers    | conf  | tutto l'anno     |
| Pinsa              | Pizza     | pz    | tutto l'anno     |
| Cornetti           | Croissant | conf  | tutto l'anno     |

## Carne (22 nuovi)

| Prodotto            | Icona     | Unità | Mesi di stagione |
| ------------------- | --------- | ----- | ---------------- |
| Pollo intero        | Drumstick | pz    | tutto l'anno     |
| Alette di pollo     | Drumstick | kg    | tutto l'anno     |
| Fesa di tacchino    | Drumstick | kg    | tutto l'anno     |
| Straccetti di pollo | Drumstick | kg    | tutto l'anno     |
| Cotolette impanate  | Drumstick | conf  | tutto l'anno     |
| Hamburger di manzo  | Hamburger | conf  | tutto l'anno     |
| Macinato misto      | Beef      | kg    | tutto l'anno     |
| Macinato di maiale  | Beef      | kg    | tutto l'anno     |
| Spezzatino          | Beef      | kg    | tutto l'anno     |
| Arrosto di vitello  | Beef      | kg    | tutto l'anno     |
| Costine di maiale   | Beef      | kg    | tutto l'anno     |
| Tagliata di manzo   | Beef      | kg    | tutto l'anno     |
| Scaloppine          | Beef      | kg    | tutto l'anno     |
| Salamella           | Sausage   | kg    | tutto l'anno     |
| Pancetta            | Ham       | g     | tutto l'anno     |
| Guanciale           | Ham       | g     | tutto l'anno     |
| Coppa               | Ham       | g     | tutto l'anno     |
| Cotechino           | Sausage   | pz    | nov, dic, gen    |
| Fegato              | Beef      | kg    | tutto l'anno     |
| Coniglio            | Rabbit    | kg    | tutto l'anno     |
| Agnello             | Beef      | kg    | mar, apr         |
| Polpette            | Beef      | conf  | tutto l'anno     |

## Pesce (16 nuovi)

| Prodotto             | Icona  | Unità | Mesi di stagione                       |
| -------------------- | ------ | ----- | -------------------------------------- |
| Alici                | Fish   | kg    | mar, apr, mag, giu, lug, ago, set, ott |
| Sardine              | Fish   | kg    | mag, giu, lug, ago, set                |
| Sgombro              | Fish   | kg    | apr, mag, giu, lug, ago, set           |
| Pesce spada          | Fish   | kg    | mag, giu, lug, ago, set                |
| Triglie              | Fish   | kg    | mag, giu, lug, ago, set, ott           |
| Polpo                | Shell  | kg    | giu, lug, ago, set, ott                |
| Seppie               | Shell  | kg    | mar, apr, mag, set, ott, nov           |
| Totani               | Shell  | kg    | giu, lug, ago, set, ott                |
| Mazzancolle          | Shrimp | kg    | mag, giu, lug, ago, set, ott           |
| Scampi               | Shrimp | kg    | tutto l'anno                           |
| Capesante            | Shell  | pz    | nov, dic, gen, feb, mar                |
| Ostriche             | Shell  | pz    | set, ott, nov, dic, gen, feb, mar, apr |
| Baccalà              | Fish   | kg    | nov, dic, gen, feb, mar                |
| Trota                | Fish   | pz    | tutto l'anno                           |
| Salmone affumicato   | Fish   | g     | tutto l'anno                           |
| Frutti di mare misti | Shell  | conf  | tutto l'anno                           |

## Latticini e uova (20 nuovi)

| Prodotto              | Icona      | Unità | Mesi di stagione |
| --------------------- | ---------- | ----- | ---------------- |
| Yogurt senza lattosio | Dessert    | conf  | tutto l'anno     |
| Yogurt vegetale       | Dessert    | conf  | tutto l'anno     |
| Skyr                  | Dessert    | pz    | tutto l'anno     |
| Kefir                 | Dessert    | pz    | tutto l'anno     |
| Panna da montare      | Carton     | ml    | tutto l'anno     |
| Margarina             | Cuboid     | pz    | tutto l'anno     |
| Burrata               | Mozzarella | pz    | tutto l'anno     |
| Bocconcini            | Mozzarella | conf  | tutto l'anno     |
| Mozzarella per pizza  | Mozzarella | conf  | tutto l'anno     |
| Provola               | Amphora    | pz    | tutto l'anno     |
| Fontina               | CakeSlice  | g     | tutto l'anno     |
| Asiago                | CakeSlice  | g     | tutto l'anno     |
| Taleggio              | CakeSlice  | g     | tutto l'anno     |
| Provolone             | CakeSlice  | g     | tutto l'anno     |
| Emmental              | CakeSlice  | g     | tutto l'anno     |
| Feta                  | CakeSlice  | g     | tutto l'anno     |
| Robiola               | Cloud      | pz    | tutto l'anno     |
| Caprino               | Cloud      | pz    | tutto l'anno     |
| Formaggio grattugiato | CakeSlice  | conf  | tutto l'anno     |
| Albumi                | Egg        | conf  | tutto l'anno     |

## Dispensa e secco (51 nuovi)

| Prodotto                | Icona      | Unità | Mesi di stagione |
| ----------------------- | ---------- | ----- | ---------------- |
| Penne                   | Utensils   | conf  | tutto l'anno     |
| Fusilli                 | Utensils   | conf  | tutto l'anno     |
| Rigatoni                | Utensils   | conf  | tutto l'anno     |
| Farfalle                | Utensils   | conf  | tutto l'anno     |
| Linguine                | Utensils   | conf  | tutto l'anno     |
| Orecchiette             | Utensils   | conf  | tutto l'anno     |
| Lasagne                 | Layers     | conf  | tutto l'anno     |
| Gnocchi                 | Potato     | conf  | tutto l'anno     |
| Tortellini              | Soup       | conf  | tutto l'anno     |
| Pasta all'uovo          | Wheat      | conf  | tutto l'anno     |
| Riso Arborio            | Soup       | conf  | tutto l'anno     |
| Riso Carnaroli          | Soup       | conf  | tutto l'anno     |
| Riso basmati            | Soup       | conf  | tutto l'anno     |
| Orzo perlato            | Wheat      | conf  | tutto l'anno     |
| Farro                   | Wheat      | conf  | tutto l'anno     |
| Polenta                 | Wheat      | conf  | tutto l'anno     |
| Semola                  | Wheat      | conf  | tutto l'anno     |
| Farina 00               | PaperBag   | kg    | tutto l'anno     |
| Farina integrale        | PaperBag   | kg    | tutto l'anno     |
| Zucchero a velo         | PaperBag   | conf  | tutto l'anno     |
| Zucchero di canna       | Cuboid     | kg    | tutto l'anno     |
| Lievito per dolci       | Package    | conf  | tutto l'anno     |
| Bicarbonato             | Package    | conf  | tutto l'anno     |
| Sale grosso             | SaltShaker | kg    | tutto l'anno     |
| Pepe nero               | SaltShaker | pz    | tutto l'anno     |
| Paprika                 | SaltShaker | pz    | tutto l'anno     |
| Curry                   | SaltShaker | pz    | tutto l'anno     |
| Cannella                | SaltShaker | pz    | tutto l'anno     |
| Noce moscata            | SaltShaker | pz    | tutto l'anno     |
| Zafferano               | SaltShaker | conf  | tutto l'anno     |
| Olio di semi            | Droplet    | l     | tutto l'anno     |
| Aceto balsamico         | Droplets   | pz    | tutto l'anno     |
| Salsa di soia           | Droplets   | pz    | tutto l'anno     |
| Polpa di pomodoro       | Carton     | pz    | tutto l'anno     |
| Concentrato di pomodoro | Jar        | pz    | tutto l'anno     |
| Olive                   | Jar        | pz    | tutto l'anno     |
| Capperi                 | Jar        | pz    | tutto l'anno     |
| Acciughe sott'olio      | Can        | pz    | tutto l'anno     |
| Piselli in scatola      | Can        | pz    | tutto l'anno     |
| Fagioli secchi          | Bean       | conf  | tutto l'anno     |
| Funghi secchi           | Mushroom   | conf  | tutto l'anno     |
| Brodo vegetale          | Carton     | pz    | tutto l'anno     |
| Besciamella             | Carton     | pz    | tutto l'anno     |
| Mandorle                | Nut        | conf  | tutto l'anno     |
| Noci                    | Nut        | conf  | tutto l'anno     |
| Nocciole                | Nut        | conf  | tutto l'anno     |
| Pistacchi               | Nut        | conf  | tutto l'anno     |
| Pinoli                  | Nut        | conf  | tutto l'anno     |
| Arachidi                | Nut        | conf  | tutto l'anno     |
| Uvetta                  | Grape      | conf  | tutto l'anno     |
| Fichi secchi            | Fig        | conf  | tutto l'anno     |

## Colazione (13 nuovi)

| Prodotto                       | Icona   | Unità | Mesi di stagione |
| ------------------------------ | ------- | ----- | ---------------- |
| Caffè in grani                 | Coffee  | conf  | tutto l'anno     |
| Orzo solubile                  | Coffee  | conf  | tutto l'anno     |
| Tisane                         | Leaf    | conf  | tutto l'anno     |
| Tè verde                       | Leaf    | conf  | tutto l'anno     |
| Fiocchi d'avena                | Wheat   | conf  | tutto l'anno     |
| Granola                        | Nut     | conf  | tutto l'anno     |
| Frollini                       | Cookie  | conf  | tutto l'anno     |
| Plumcake                       | Cake    | pz    | tutto l'anno     |
| Burro di arachidi              | Jar     | pz    | tutto l'anno     |
| Crema spalmabile al cioccolato | Jar     | pz    | tutto l'anno     |
| Marmellata di albicocche       | Jar     | pz    | tutto l'anno     |
| Sciroppo d'acero               | Droplet | pz    | tutto l'anno     |
| Cacao amaro                    | Bean    | conf  | tutto l'anno     |

## Snack e dolci (16 nuovi)

| Prodotto            | Icona    | Unità | Mesi di stagione |
| ------------------- | -------- | ----- | ---------------- |
| Savoiardi           | Cookie   | conf  | tutto l'anno     |
| Amaretti            | Cookie   | conf  | tutto l'anno     |
| Cantucci            | Cookie   | conf  | tutto l'anno     |
| Gallette di riso    | Circle   | conf  | tutto l'anno     |
| Barrette ai cereali | Grid3x3  | conf  | tutto l'anno     |
| Cioccolato bianco   | Grid3x3  | pz    | tutto l'anno     |
| Cioccolatini        | Candy    | conf  | tutto l'anno     |
| Panettone           | Cake     | pz    | nov, dic, gen    |
| Pandoro             | Cake     | pz    | nov, dic, gen    |
| Colomba             | Cake     | pz    | mar, apr         |
| Uova di Pasqua      | Egg      | pz    | mar, apr         |
| Chiacchiere         | Cookie   | conf  | gen, feb, mar    |
| Muffin              | Cupcake  | conf  | tutto l'anno     |
| Tiramisù            | Dessert  | pz    | tutto l'anno     |
| Tortilla chips      | ChipsBag | conf  | tutto l'anno     |
| Noccioline          | Nut      | conf  | tutto l'anno     |

## Bevande (14 nuovi)

| Prodotto          | Icona      | Unità | Mesi di stagione |
| ----------------- | ---------- | ----- | ---------------- |
| Acqua tonica      | Bubbles    | pz    | tutto l'anno     |
| Gassosa           | Bubbles    | pz    | tutto l'anno     |
| Limonata          | CanSoda    | pz    | tutto l'anno     |
| Chinotto          | CanSoda    | pz    | tutto l'anno     |
| Succo di mela     | Carton     | pz    | tutto l'anno     |
| Succo d'arancia   | Carton     | pz    | tutto l'anno     |
| Birra analcolica  | Beer       | conf  | tutto l'anno     |
| Spumante          | Wine       | pz    | tutto l'anno     |
| Amaro             | BottleWine | pz    | tutto l'anno     |
| Limoncello        | BottleWine | pz    | tutto l'anno     |
| Grappa            | BottleWine | pz    | tutto l'anno     |
| Gin               | Martini    | pz    | tutto l'anno     |
| Latte di soia     | Carton     | l     | tutto l'anno     |
| Latte di mandorla | Carton     | l     | tutto l'anno     |

## Casa e pulizia (12 nuovi)

| Prodotto                 | Icona         | Unità | Mesi di stagione |
| ------------------------ | ------------- | ----- | ---------------- |
| Detergente vetri         | SprayCan      | pz    | tutto l'anno     |
| Disinfettante            | SprayCan      | pz    | tutto l'anno     |
| Panni in microfibra      | BrushCleaning | conf  | tutto l'anno     |
| Sacchetti per il freezer | Layers        | conf  | tutto l'anno     |
| Asciugamani di carta     | Scroll        | conf  | tutto l'anno     |
| Brillantante             | Droplets      | pz    | tutto l'anno     |
| Sale per lavastoviglie   | SaltShaker    | pz    | tutto l'anno     |
| Smacchiatore             | Droplets      | pz    | tutto l'anno     |
| Piatti di carta          | Layers        | conf  | tutto l'anno     |
| Bicchieri di plastica    | CupSoda       | conf  | tutto l'anno     |
| Fiammiferi               | Flame         | conf  | tutto l'anno     |
| Alcool                   | FlaskRound    | pz    | tutto l'anno     |

## Igiene e cura (17 nuovi)

| Prodotto               | Icona                | Unità | Mesi di stagione |
| ---------------------- | -------------------- | ----- | ---------------- |
| Filo interdentale      | ToothbrushSparkles   | pz    | tutto l'anno     |
| Bastoncini cotonati    | Circle               | conf  | tutto l'anno     |
| Tamponi                | Feather              | conf  | tutto l'anno     |
| Pannolini              | Baby                 | conf  | tutto l'anno     |
| Salviette per bambini  | Baby                 | conf  | tutto l'anno     |
| Latte detergente       | Droplets             | pz    | tutto l'anno     |
| Crema mani             | TubeLotion           | pz    | tutto l'anno     |
| Burrocacao             | TubeLotion           | pz    | tutto l'anno     |
| Sapone                 | Cuboid               | pz    | tutto l'anno     |
| Acqua ossigenata       | FlaskRound           | pz    | tutto l'anno     |
| Garze                  | Bandage              | conf  | tutto l'anno     |
| Termometro             | Thermometer          | pz    | tutto l'anno     |
| Ibuprofene             | Pill                 | conf  | tutto l'anno     |
| Sciroppo per la tosse  | PillBottle           | pz    | tutto l'anno     |
| Gel igienizzante       | SoapDispenserDroplet | pz    | tutto l'anno     |
| Repellente per zanzare | Bug                  | pz    | tutto l'anno     |
| Doposole               | TubeLotion           | pz    | tutto l'anno     |

## Animali (8 nuovi)

| Prodotto                    | Icona    | Unità | Mesi di stagione |
| --------------------------- | -------- | ----- | ---------------- |
| Snack per cani              | Bone     | conf  | tutto l'anno     |
| Osso da masticare           | Bone     | pz    | tutto l'anno     |
| Snack per gatti             | Cat      | conf  | tutto l'anno     |
| Cibo per pesci              | Fish     | conf  | tutto l'anno     |
| Cibo per uccelli            | Bird     | conf  | tutto l'anno     |
| Mangime per conigli         | Rabbit   | conf  | tutto l'anno     |
| Antipulci                   | PawPrint | pz    | tutto l'anno     |
| Sacchetti igienici per cani | Trash2   | conf  | tutto l'anno     |

## Surgelati (15 nuovi)

| Prodotto                  | Icona     | Unità | Mesi di stagione |
| ------------------------- | --------- | ----- | ---------------- |
| Filetti di merluzzo       | Fish      | conf  | tutto l'anno     |
| Gamberi surgelati         | Shrimp    | conf  | tutto l'anno     |
| Calamari surgelati        | Shell     | conf  | tutto l'anno     |
| Frutti di mare surgelati  | Shell     | conf  | tutto l'anno     |
| Cotolette surgelate       | Drumstick | conf  | tutto l'anno     |
| Nuggets di pollo          | Drumstick | conf  | tutto l'anno     |
| Fagiolini surgelati       | Bean      | conf  | tutto l'anno     |
| Broccoli surgelati        | Broccoli  | conf  | tutto l'anno     |
| Mais surgelato            | Wheat     | conf  | tutto l'anno     |
| Funghi surgelati          | Mushroom  | conf  | tutto l'anno     |
| Frutti di bosco surgelati | Blueberry | conf  | tutto l'anno     |
| Gnocchi surgelati         | Potato    | conf  | tutto l'anno     |
| Croissant surgelati       | Croissant | conf  | tutto l'anno     |
| Sorbetto                  | IceCream2 | pz    | tutto l'anno     |
| Patate al forno surgelate | Potato    | conf  | tutto l'anno     |

## Altro (8 nuovi)

| Prodotto               | Icona    | Unità | Mesi di stagione |
| ---------------------- | -------- | ----- | ---------------- |
| Carta da regalo        | Gift     | conf  | tutto l'anno     |
| Biglietto d'auguri     | Gift     | pz    | tutto l'anno     |
| Palloncini             | Balloon  | conf  | tutto l'anno     |
| Candeline              | Flame    | conf  | tutto l'anno     |
| Pianta da appartamento | PlantPot | pz    | tutto l'anno     |
| Terriccio              | PaperBag | pz    | tutto l'anno     |
| Nastro adesivo         | Package  | pz    | tutto l'anno     |
| Ombrello               | Umbrella | pz    | tutto l'anno     |
