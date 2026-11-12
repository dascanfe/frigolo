# Brief: espressioni della mascotte Frigolo

Per chi illustra (persona o strumento di generazione di immagini con immagine di riferimento).
Le versioni in `mascotte/` sono state fatte ridisegnando solo occhi, bocca e accessori sopra
l'illustrazione originale: funzionano, ma corpo e braccia sono sempre gli stessi. Questo brief
serve per una serie più espressiva, quando Daniele vorrà investirci.

## Il personaggio

- **Chi è:** Frigolo, un piccolo frigorifero a un'anta, verde acqua. È l'app stessa che parla:
  ti dà del tu, parla poco, è simpatico, pratico, mai sopra le righe.
- **Riferimento obbligatorio:** `assets/mascot.webp` (1254x1254, fondo trasparente).
- **Stile da mantenere:** cartone animato pulito, contorno verde scuro spesso e uniforme
  (`#04342f`, circa 1,2% della larghezza dell'immagine), colori piatti con un solo riflesso chiaro
  in alto a sinistra, nessuna texture, nessuna ombra portata.
- **Anatomia:** corpo arrotondato `#9de0d1`, lato destro più scuro per il volume, maniglia grigio
  chiaro sul lato sinistro, due piedini scuri, braccia corte a tubo dello stesso verde, mani a tre
  dita tonde. Faccia nella metà alta: occhi ovali scuri con un riflesso bianco, guance rosa
  `#fbabad` ovali, bocca grande con lingua `#f9867d`.
- **Accessori ricorrenti:** busta di carta della spesa con insalata, pomodoro, peperone giallo e
  baguette (nessuna marca, nessuna scritta). Lineette arancioni `#f7a017` per l'entusiasmo.

## Espressioni richieste

| Nome        | Faccia                                                                              | Corpo e accessori                                                                    | Uso nell'app                 |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------- |
| contenta    | occhi chiusi a mezzaluna, bocca aperta, guance più grandi                           | tutte e due le braccia in alto, busta piena ai piedi, stelline arancioni             | Spesa finita, conferme       |
| pensierosa  | occhi rivolti in alto a destra, un sopracciglio alzato, bocca piccola di lato       | una mano sotto il "mento", l'altra sul fianco, tre pallini di nuvoletta              | Stati vuoti, attese          |
| dispiaciuta | sopracciglia all'insù verso il centro, occhi grandi lucidi, bocca piccola all'ingiù | mani giunte davanti, leggermente inclinato, una goccia di sudore azzurra             | Errori                       |
| posta       | occhiolino e sorriso (come l'originale)                                             | tiene una busta da lettere crema con un bollino arancio, lineette attorno alla busta | "Controlla la posta", inviti |

Facoltative, utili per i social: **saluta** (mano aperta, per "Ciao"), **lista** (tiene un foglietto
lungo), **caffè** (tazzina in mano, per "Offrimi un caffè").

## Regole

- Mai arrabbiata, mai triste davvero, mai disgustata dal cibo.
- Niente marchi, loghi, scritte leggibili, prodotti riconoscibili.
- Stesse proporzioni e stessa inquadratura dell'originale (intera, centrata, piedi visibili), per
  poterle scambiare nell'app senza spostare nulla.
- Consegna: PNG 1254x1254 con fondo trasparente, più SVG se possibile.

## Prompt di partenza (per strumenti che accettano un'immagine di riferimento)

> Same character as the reference image: a small cute mint-green single-door fridge mascot,
> thick dark green outline, flat colors, one soft highlight, pink oval cheeks, short tube arms,
> two dark feet, transparent background, full body centered. Change only the pose and expression:
> [descrizione dalla tabella]. No text, no logos, no brands.

Senza immagine di riferimento i risultati cambiano troppo personaggio: meglio non usarli.

## Cosa c'è già (versione semplice)

`node marketing/kit/scripts/mascotte.mjs` genera le quattro espressioni coprendo occhi e bocca
originali col colore del corpo e ridisegnando i tratti in SVG. Limiti noti:

- il braccio col pollice alzato resta in tutte (nella dispiaciuta si legge come "scusa, ci
  riprovo", va bene ma non è ideale);
- nella pensierosa la mano non va al mento;
- la busta da lettere è disegnata dietro il pollice, come se la tenesse tra le dita.
