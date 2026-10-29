# Quaderno di Paprika

Aggiornato da Paprika alla fine di ogni incarico. Il più recente in alto.

## Stato

Fase 3, preparazione: kit visivo, immagini Open Graph, espressioni della mascotte, storyboard del
video e lista degli screenshot pronti nel branch `paprika/kit-visivo` (draft PR, dipende dalla #18).
Niente pubblicato. Prossimi passi: screenshot (quando l'app nuova è stabile), video dopo l'ok
allo storyboard, primo pacchetto di post sul piano editoriale di Zenzero.

## Domande aperte per Daniele

- Storyboard del video (`marketing/video/piano.md`): va bene 40 secondi, senza voce, con i testi
  proposti?
- Musica: ok a Pixabay Music come prima fonte (gratis, senza attribuzione)?
- Espressioni della mascotte: bastano le versioni semplici o si investe in un'illustrazione
  nuova (brief in `marketing/kit/mascotte-brief.md`)? Il generatore di immagini di Figma c'è ma
  consuma crediti a pagamento e lavora solo da testo: non l'ho usato.
- Anteprima dedicata ai link d'invito (`public/og-invito.png`): serve che i link d'invito abbiano
  una pagina con i propri meta tag (l'app è una SPA, oggi tutti i link mostrano `og-image.png`).
  Da decidere con Fragola e Basilio.

## Diario

### 2026-10-18 - Video e schermate, versione 2

- Schermate e video rifatti con l'app vera: tema Lampone, status bar iOS (9:41, Dynamic Island, segnale, Wi-Fi, batteria) come livello SVG sopra la cattura, 1170x2532 (390x844 a 3x), niente barre del browser.
- Persone: Giulia e Lele (prima Sara e Ale), avatar = mascotte su colori diversi. `marketing/demo/dati_demo.sql` aggiornato; DB locale tornato a `seed_dev.sql`.
- `marketing/video/capture/` (Playwright): `statics.mjs` rifà le schermate statiche (nuove: s03-lista-lele, s04-lista-giulia, s14-suggeriti, s17-offline, s15-temi), `clips.mjs` registra clip vere con due contesti (Giulia e Lele in tempo reale), tocchi reali salvati in `src/clips.json`.
- Video 44,5 s (9:16, 16:9, 15 s): Giulia aggiunge l'Ananas e compare sul telefono di Lele; al tocco il prodotto passa in "Nel carrello"; Spesa finita vera; scene nuove: analitiche (spese per mese, andamento) e scelta del tema. Lo schermo non è mai ingrandito né ritagliato.
- Musica: Fun Day di AShamaluevMusic (credito in `marketing/video/musica.md`), mp3 fuori da git, dissolvenze 1 s / 2 s, volume 0,22.
- Limiti: le clip girano a circa 16-20 fotogrammi al secondo (la cattura è un po' meno fluida del telefono vero); `s04-lista-giulia` mostra il catalogo con l'Ananas appena toccata; i MP4 sono in `out/` (fuori da git, 3-9 MB).

### 2026-10-11 - Screenshot reali e video di presentazione

- `marketing/demo/dati_demo.sql` (e `rimuovi_demo.sql`): dati inventati (Sara, Luca, Marta, Ale; liste Casa e
  Coinquilini; 20 spese in 12 settimane), solo in locale, rilanciabile. Il DB locale è tornato com'era (`seed_dev.sql`).
- `marketing/screenshot/`: 15 PNG 1170x2532 dell'app vera (catalogo prima e dopo il tocco, lista in ordine di corsia,
  carrello, Spesa finita, cambio lista, lista Coinquilini, invito, analitiche, temi, profilo con la mascotte).
- `marketing/video/`: pacchetto Remotion con `Frigolo9x16`, `Frigolo16x9`, `Frigolo15s`, sottotitoli `.srt`, suoni di
  tocco sintetizzati. Render in `out/` (fuori da git). Senza musica: Pixabay blocca il download da script, vedi `musica.md`.

### 2026-10-10 - Kit visivo (Fase 3, preparazione)

- `marketing/kit/brand.md`: palette con hex (tema Autunno, colori della mascotte, altri temi),
  font (Playfair Display e Lato, OFL), regole per la mascotte, sfondi ammessi, tono visivo.
- Modello unico `marketing/kit/modelli/modello.html` per post 1:1, post 4:5, storia 9:16,
  copertina 3:1 e Open Graph, con parametri nell'indirizzo; `scripts/render.mjs` lo rende in PNG
  con Chrome headless e comprime con sharp. Esempi in `marketing/kit/esempi/`.
- Open Graph definitiva 1200x630 (109 KB) in `public/og-image.png` e `marketing/og/`, più la
  variante d'invito "Ti invitano in una lista su Frigolo" (114 KB). Aggiunto `og:image:alt`.
- Espressioni contenta, pensierosa, dispiaciuta e con la busta (`marketing/kit/mascotte/`,
  PNG 1254 trasparente e WebP 512), generate da `scripts/mascotte.mjs` ridisegnando occhi, bocca
  e accessori sopra l'originale. Limite: il braccio col pollice alzato resta in tutte.
- `marketing/video/piano.md`: storyboard 40 s 9:16 in 9 scene, adattamento 16:9, musica, Remotion
  4.0.534 (licenza gratuita per persone singole, verificata sul LICENSE.md del repo).
- `marketing/screenshot-lista.md`: 17 schermate con dati d'esempio inventati.
- Nessun file oltre i 20 MB (cartella `marketing/` circa 2 MB).
