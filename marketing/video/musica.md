# Musica del video

Stato: **nessuna traccia inclusa**. I render attuali hanno solo i suoni di tocco (tic, plin, tada),
sintetizzati dallo script `scripts/make-audio.mjs`, quindi senza file di terzi.

Perché: Pixabay Music risponde 403 a chi scarica da script (protezione anti-bot) e il download
dei brani richiede comunque un accesso. Non creo account né scarico a mano.

## Come aggiungerla (2 minuti)

1. Su [pixabay.com/music](https://pixabay.com/music/) scegli un brano allegro e leggero
   (ukulele, chitarra acustica o glockenspiel, 100-120 BPM, almeno 45 secondi, senza voce).
2. Scarica l'MP3 e mettilo in `marketing/video/public/audio/musica.mp3`.
3. Annota qui sotto: titolo, autore, URL della pagina del brano e data del download. La licenza
   è la [Pixabay Content License](https://pixabay.com/service/license-summary/): uso gratuito anche
   commerciale, attribuzione non richiesta. Salva la pagina come prova per eventuali segnalazioni.
4. In `src/theme.ts` imposta `MUSIC = 'audio/musica.mp3'` e lancia `npm run render`.

## Traccia scelta

| Titolo | Autore | URL | Data download |
| ------ | ------ | --- | ------------- |
| (da scegliere) | | | |
