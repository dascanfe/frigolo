# Kit visivo di Frigolo

Come appare Frigolo fuori dall'app: social, landing, anteprime dei link, video.
Lo cura Paprika. I colori vengono dall'app (`src/lib/theme.ts`, `src/styles/tokens.css`):
se cambiano lì, si aggiornano qui e in `modelli/kit.css`.

## In una riga

Un frigorifero verde acqua simpatico su fondi caldi color crema e arancio. Pochi elementi,
tanto spazio, una frase per immagine.

## Palette

### Colori principali (tema Autunno, quello di default)

| Nome        | Hex       | Dove si usa                                                 |
| ----------- | --------- | ----------------------------------------------------------- |
| Crema fondo | `#f4ece2` | Sfondo principale delle immagini                            |
| Crema       | `#faf3ec` | Etichette, schede, testo su fondi scuri                     |
| Sabbia      | `#ebd5b3` | Forme morbide dietro la mascotte, bordi                     |
| Arancio     | `#db6a2e` | Sfondo "forte", colore della barra dell'app (`theme-color`) |
| Mattone     | `#ce5f36` | Accento: parola in corsivo nei titoli, bottoni              |
| Pesca       | `#e5987a` | Accento tenue, accento su fondo inchiostro                  |
| Salvia      | `#86a79b` | Stato "nel carrello" nell'app, dettagli                     |
| Inchiostro  | `#3a2c21` | Testo principale, sfondo scuro                              |
| Inchiostro2 | `#6b5844` | Testo secondario                                            |

### Colori della mascotte

| Nome         | Hex       | Note                                          |
| ------------ | --------- | --------------------------------------------- |
| Menta        | `#9de0d1` | Corpo di Frigolo. Ammesso anche come sfondo   |
| Verde scuro  | `#04342f` | Contorni della mascotte, testo su fondo menta |
| Arancio vivo | `#f7a017` | Lineette e stelline attorno alla mascotte     |
| Rosa guance  | `#fbabad` | Solo nella mascotte                           |

### Altri temi dell'app

Per post dedicati ai temi si usano i loro colori (accento / fondo):
Basilico `#2f7a41` / `#edf2ea`, Mare `#1f5d9e` / `#ebf1f7`, Prugna `#6a3a8b` / `#f3eff6`,
Lampone `#b02e50` / `#f8eef0`, Liquirizia `#c4472f` / `#efeeec`.

Colori delle persone di una lista (avatar, grafici): ottanio `#3e7c86`, mattone `#ce5f36`,
oliva `#7e7530`, ruggine `#a85641`, marrone `#7e5e29`, terracotta `#d9695c`, arancio `#db6a2e`,
ocra `#c2902f`, grigio `#6b5844`. Utili per le schermate d'esempio, non come colori del brand.

### Sfondi ammessi

| Sfondo       | Testo       | Accento (corsivo) | Quando                                                       |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------ |
| `crema`      | inchiostro  | mattone           | Default, la maggior parte dei contenuti                      |
| `arancio`    | crema       | inchiostro        | Annunci, momenti di festa (al massimo 1 post su 4)           |
| `menta`      | verde scuro | mattone           | Trucchi e funzioni                                           |
| `inchiostro` | crema       | pesca             | Citazioni, numeri, contenuti "seri" (privacy, codice aperto) |

Testo lungo mai su arancio: il contrasto basta solo per i titoli grandi.

## Font

Gli stessi dell'app, entrambi con licenza SIL Open Font License, già nel progetto via fontsource
(`@fontsource/playfair-display`, `@fontsource/lato`).

- **Playfair Display 700** (anche corsivo): titoli. Una parola o un pezzo di frase in corsivo
  colorato per dare il ritmo, mai tutto il titolo.
- **Lato 400 / 700 / 900**: testi, etichette, sottotitoli del video. Il 900 solo per etichette
  corte (l'indirizzo, un numero).

Dimensioni di riferimento su 1080 px di larghezza: titolo 80-110 px, testo 36-46 px, etichetta
30-40 px. Mai sotto i 28 px: sui telefoni diventa illeggibile.

## La mascotte

Si chiama **Frigolo**, come l'app. Ti dà del tu, parla poco, è simpatico (vedi
`docs/comunicazione/tono.md`).

File:

| File                                     | Espressione                    | Quando                                   |
| ---------------------------------------- | ------------------------------ | ---------------------------------------- |
| `assets/mascot.webp` (1254 px)           | classica: occhiolino e pollice | Default, presentazioni, landing          |
| `public/mascot.png` (512 px)             | classica                       | Nell'app                                 |
| `mascotte/frigolo-contenta.png/.webp`    | occhi a mezzaluna, stelline    | Spesa finita, conferme, invito accettato |
| `mascotte/frigolo-pensierosa.png/.webp`  | occhi in su, nuvoletta         | Stati vuoti, attese                      |
| `mascotte/frigolo-dispiaciuta.png/.webp` | sopracciglia in giù, goccia    | Errori (senza drammi)                    |
| `mascotte/frigolo-posta.png/.webp`       | occhiolino, busta da lettere   | "Controlla la posta", inviti             |

I `.png` sono a 1254 px con fondo trasparente, i `.webp` a 512 px per l'app. Si rigenerano con
`node marketing/kit/scripts/mascotte.mjs`: lo script parte dall'illustrazione originale e
ridisegna solo occhi, bocca e accessori.

### Come usarla

- **Spazio intorno:** almeno un quarto della sua larghezza libero su ogni lato (le lineette e le
  stelline contano come mascotte). Può uscire dal bordo solo dal basso, come se entrasse in scena.
- **Dimensione:** occupa tra un terzo e metà dell'immagine. Più piccola di 120 px non si legge:
  sotto quella misura si usa l'avatar tondo (`public/mascot-avatar.webp`).
- **Sfondi:** i quattro sfondi ammessi qui sopra. Dietro può avere una forma tonda morbida
  (sabbia sul crema, crema trasparente sugli altri). Mai su foto, mai su sfondi a righe o con
  gradienti forti, mai sul menta senza la forma tonda (si confonde col corpo).
- **Una sola per immagine**, sempre intera (niente tagli a metà faccia).

### Cosa non fare

- Non cambiarle colore, proporzioni o contorno, non ruotarla oltre 10 gradi.
- Non metterle in mano loghi, prodotti di marca o insegne di supermercati.
- Niente ombre nere, contorni aggiunti o effetti 3D.
- Mai arrabbiata, mai triste davvero, mai a disagio per il cibo, il peso o i soldi.
- Non farla parlare con fumetti lunghi: al massimo 4-5 parole, nel tono di Frigolo.

## Tono visivo

- **Una cosa per immagine.** Un titolo, al massimo una frase sotto, l'indirizzo in basso.
- **Caldo e ordinato.** Fondi crema, angoli tondi, tanta aria. Niente collage, niente
  sfondi pieni di icone.
- **Vero.** Le schermate sono dell'app vera, con dati d'esempio verosimili
  ([screenshot-lista.md](../screenshot-lista.md)), mai mockup inventati di funzioni che non ci sono.
- **Per tutti.** Nessuna immagine che dia per scontato chi vive con chi: si vede una persona
  sola, coinquilini, una coppia, una famiglia, a rotazione.
- **Testi:** le regole di `docs/comunicazione/tono.md` valgono anche sulle immagini. Solo
  trattino corto `-`, al massimo una emoji, niente "!!!", niente maiuscole per urlare.
- **Niente** loghi di supermercati o marchi, foto di stock, immagini prese dal web.

## Modelli

Un solo modello HTML, `modelli/modello.html` (stili in `modelli/kit.css`), configurato dai
parametri dell'indirizzo. Formati:

| `formato`   | Misura    | Uso                                  | Zone da lasciare libere                   |
| ----------- | --------- | ------------------------------------ | ----------------------------------------- |
| `post`      | 1080x1080 | Post quadrato                        | -                                         |
| `post45`    | 1080x1350 | Post verticale (Instagram, Facebook) | -                                         |
| `storia`    | 1080x1920 | Storie, Reel, TikTok (copertina)     | primi 250 px e ultimi 340 px              |
| `copertina` | 1500x500  | Intestazione di X, LinkedIn, YouTube | il terzo sinistro in basso (foto profilo) |
| `og`        | 1200x630  | Anteprima dei link                   | i bordi: alcune app tagliano al centro    |

Parametri: `sfondo`, `titolo` (con `*corsivo*` e `|` per andare a capo), `testo`, `mascotte`,
`chip` (l'etichetta in basso, `no` per toglierla), `schermata` (uno screenshot in una cornice di
telefono, per `post45` e `storia`), `nome=no` (per `og`: marchio piccolo invece del nome grande).
L'elenco completo è in testa a `modello.html`.

Per vedere un modello: aprire `modelli/modello.html?formato=post&titolo=...` in Chrome (servono le
`node_modules` installate per i font).

Per creare i PNG:

```sh
pnpm install
node marketing/kit/scripts/render.mjs              # tutte le immagini
node marketing/kit/scripts/render.mjs og post-1x1  # solo alcune
```

Lo script usa Chrome già installato sul Mac in modalità headless (variabile `CHROME` per un altro
percorso) e comprime i PNG con `sharp`. Le immagini da produrre si aggiungono all'oggetto `IMAGES`
dentro lo script: nome, file di uscita e parametri.

## File

| Percorso                          | Cosa                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `marketing/kit/brand.md`          | Questa guida                                                 |
| `marketing/kit/mascotte-brief.md` | Brief per un'illustrazione professionale delle espressioni   |
| `marketing/kit/mascotte/`         | Espressioni della mascotte                                   |
| `marketing/kit/modelli/`          | Modello HTML e CSS                                           |
| `marketing/kit/scripts/`          | `render.mjs` (PNG dai modelli), `mascotte.mjs` (espressioni) |
| `marketing/kit/esempi/`           | Un esempio per formato                                       |
| `marketing/og/`                   | Immagini Open Graph (copie di quelle in `public/`)           |
| `marketing/video/piano.md`        | Storyboard del video di lancio                               |
| `marketing/screenshot-lista.md`   | Screenshot da fare e dati d'esempio                          |
