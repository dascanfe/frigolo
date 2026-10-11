# Video di Frigolo (Remotion)

Pacchetto separato dall'app. Remotion 4.0.534, licenza gratuita per persone singole (vedi `piano.md`).
Il render usa Google Chrome già installato (percorso in `remotion.config.ts`).

```sh
cd marketing/video
npm install
npm run assets     # copia font, screenshot, mascotte in public/ e sintetizza i suoni
npm run studio     # anteprima interattiva
npm run render     # MP4 9:16, 16:9, 15 s, WebM e poster in out/ (non va in git)
node scripts/render-all.mjs 15s   # una sola uscita: 9x16, 16x9 o 15s
node scripts/stills.mjs Frigolo9x16 60,200,350   # fotogrammi di controllo in out/check
```

Composizioni: `Frigolo9x16` (1080x1920, 40 s), `Frigolo16x9` (1920x1080, 40 s), `Frigolo15s` (9:16, 15 s).
Le scene sono in `src/Scenes.tsx`, i componenti (telefono 3D, tocchi, coriandoli) in `src/ui.tsx`,
l'ordine e le durate in `src/Compositions.tsx`. Gli screenshot vengono da `marketing/screenshot/`
(dati demo: `marketing/demo/dati_demo.sql`). Sottotitoli: `frigolo-lancio.srt`. Musica: `musica.md`.
