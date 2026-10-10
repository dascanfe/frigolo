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
