# Video di lancio: piano e storyboard

Stato: **versione 2 realizzata** (clip vere dell'app, tema Lampone, 44,5 s, musica Fun Day; scene in più: analitiche e temi). Storyboard originale qui sotto (vedi `README.md`, `musica.md`). Scena 7 mostra il cambio lista e gli avatar; le analitiche non sono nella versione da 40 s (si possono aggiungere come scena in più).

## In breve

- **Durata:** 40 secondi (9 scene). Versione corta da 15 secondi per le storie: scene 1, 3, 6, 9.
- **Formato:** 1080x1920 (9:16) per Reel, TikTok, Shorts, storie. Adattamento 1920x1080 (16:9)
  per YouTube, landing e LinkedIn.
- **Idea:** la spesa raccontata in 40 secondi, dal "chi compra il latte?" a "Spesa finita".
  Protagonista l'app vera; Frigolo (la mascotte) apre, festeggia e chiude.
- **Senza voce:** musica, piccoli suoni di tocco e testo a schermo. Il testo a schermo è il
  sottotitolo: si capisce tutto anche senza audio. Se Daniele vuole una voce, i sottotitoli
  diventano la trascrizione e restano sempre visibili.
- **Schermate:** screenshot veri dell'app (elenco in [../screenshot-lista.md](../screenshot-lista.md)),
  animati nel video: il dito che tocca è un cerchio disegnato, non una registrazione dello
  schermo. Così il video resta nitido e si rifà in un attimo se l'app cambia.

## Storyboard 9:16

Testo a schermo: Lato 900 per le frasi, Playfair Display per i titoli, sempre nella zona sicura
(non nei primi 250 px né negli ultimi 340 px). Al massimo 7-8 parole per riga, ogni frase
resta a schermo almeno 2 secondi.

| #   | Tempo     | Cosa si vede                                                                                                                                | Testo a schermo                                                        | Schermate                   | Suono                 |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------- | --------------------- |
| 1   | 0:00-0:03 | Fondo crema. Frigolo (pensierosa) entra dal basso con un piccolo rimbalzo, nuvoletta.                                                       | **Chi compra il latte?**                                               | -                           | parte la musica       |
| 2   | 0:03-0:08 | Telefono al centro sul catalogo. Il dito tocca Latte, Pane, Mele: le tessere si colorano di arancio.                                        | Tocca un prodotto: è in lista.                                         | S2 catalogo                 | "tic" a ogni tocco    |
| 3   | 0:08-0:14 | Due telefoni affiancati. A sinistra Giulia aggiunge l'Ananas dal catalogo, sul telefono di Lele l'Ananas compare in lista (registrazione vera). | Chi fa la spesa con te lo vede subito.                                 | S3 lista A, S4 lista B      | "plin" quando compare |
| 4   | 0:14-0:19 | Zoom sulla lista: le sezioni scorrono in ordine, Frutta e verdura in alto, Surgelati in fondo. Etichetta del supermercato in alto.          | In ordine di corsia: i surgelati alla fine.                            | S5 lista per corsia         | scorrimento           |
| 5   | 0:19-0:24 | Il dito tocca 3 prodotti: scendono in "Nel carrello" e diventano verde salvia.                                                              | Preso? Un tocco ed è nel carrello.                                     | S6 carrello                 | "tic" più acuto       |
| 6   | 0:24-0:28 | Tocco su "Spesa finita". Coriandoli arancio e menta, Frigolo (contenta) salta dentro dal lato.                                              | **Spesa finita**                                                       | S7 spesa finita             | piccolo "tadà"        |
| 7   | 0:28-0:32 | Il selettore delle liste si apre: "Casa", "Coinquilini". Accanto, gli avatar delle persone (mascotte su colori diversi).                    | Per conto tuo o in compagnia.                                          | S8 cambia lista, S9 persone | -                     |
| 8   | 0:32-0:36 | Telefono con Safari e il foglio "Aggiungi alla schermata Home", poi l'icona di Frigolo sulla Home.                                          | Gratis, senza pubblicità. Si installa dal browser.                     | S10 installazione           | -                     |
| 9   | 0:36-0:40 | Cartolina finale: fondo crema, Frigolo classica, nome grande, frase, indirizzo.                                                             | **Frigolo** La lista della spesa sempre in tasca. frigolo.dascanfe.com | -                           | la musica chiude      |

Note di regia:

- Ritmo: un'idea per scena, un solo movimento per volta. Transizioni a scorrimento orizzontale
  (come girare pagina), niente effetti vistosi.
- Nella scena 3 i nomi d'esempio cambiano per genere e situazione: niente "lui" e "lei", si vede
  solo un nome e un pallino.
- I tempi si allineano al battito della musica scelta (±5 frame).
- Nessun marchio di supermercato: i supermercati d'esempio si chiamano "Supermercato sotto casa"
  e "Mercato del sabato".

## Adattamento 16:9

Stessa sequenza e stessi tempi. Il telefono sta a sinistra (alto 80% dello schermo), il testo a
destra, allineato a sinistra, più grande (titoli 96 px, frasi 56 px). Nella scena 3 i due
telefoni stanno ai lati e il testo al centro in basso. La cartolina finale riprende l'immagine
Open Graph (`marketing/og/og-image.png`) animata.

## Sottotitoli

- Il testo a schermo coincide con i sottotitoli: è disegnato nel video (sempre visibile, anche
  dove la piattaforma non mostra i sottotitoli automatici).
- In più si esporta un file `.srt` con le stesse frasi, per YouTube e LinkedIn (accessibilità e
  ricerca).
- Solo trattino corto, accenti veri, al massimo una emoji in tutto il video (nessuna, per ora).

## Musica

Brano strumentale allegro e acustico (ukulele, chitarra, fischio o glockenspiel), 100-120 BPM,
almeno 45 secondi o con un loop pulito. Niente voce. Fonti con licenza chiara:

| Fonte                                                                                                                          | Licenza                                                                                                                                                         | Attribuzione                          | Note                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pixabay Music](https://pixabay.com/music/)                                                                                    | [Pixabay Content License](https://pixabay.com/service/license-summary/): uso gratuito, anche commerciale, modifiche ammesse; vietato rivendere il brano da solo | Non richiesta (gradita)               | Prima scelta. Salvare la pagina del brano e la data di download insieme al progetto: alcuni autori registrano i brani su sistemi di riconoscimento e può arrivare una segnalazione su YouTube, che si contesta con quella prova |
| [Incompetech (Kevin MacLeod)](https://incompetech.com/music/royalty-free/licenses/)                                            | Creative Commons, gratuita con credito; licenza a pagamento senza credito                                                                                       | Obbligatoria, testo generato dal sito | Il credito va nella descrizione del post                                                                                                                                                                                        |
| Libreria audio di Instagram e TikTok (per account aziendali: "Sound Collection" di Meta, "Commercial Music Library" di TikTok) | Licenza valida solo dentro quella piattaforma                                                                                                                   | No                                    | Alternativa: si pubblica il video senza musica e il brano si sceglie nell'app al momento del post (decisione per la Fase 4)                                                                                                     |

Proposta: Pixabay, 2-3 brani scelti da Paprika e fatti ascoltare a Daniele prima del montaggio.
I suoni di tocco li sintetizziamo noi (nessun file di terzi).

## Strumento: Remotion

- **Cos'è:** video scritti in React, resi in MP4 dal computer. Usiamo lo stesso linguaggio e gli
  stessi font dell'app, e il video si rigenera quando cambiano le schermate.
- **Versione:** 4.0.534 (ultima su npm, pubblicata il 7 ottobre 2026; verificata con
  `npm view remotion version`). Si fissa la versione esatta nel `package.json`.
- **Licenza:** non è open source ma "source available" con due livelli. Dal file
  [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) (versione 2026):
  l'uso è gratuito, anche commerciale, per "an individual", per aziende for-profit "with up to 3
  employees", per le organizzazioni non profit e per la prova. Serve una licenza aziendale
  ([remotion.pro](https://www.remotion.pro/license)) solo oltre quella soglia. Frigolo è un
  progetto personale di Daniele: rientra nella licenza gratuita. Il file avvisa anche che con
  Remotion 5.0 la licenza cambierà un po': prima di aggiornare alla 5 si rilegge.
- **Compatibilità con il repo AGPL:** Remotion resta una dipendenza di sviluppo del solo progetto
  video, non entra nell'app né viene ridistribuito. Il codice del video (nostro) resta AGPL.
- **Dove:** `marketing/video/` come pacchetto a parte (con il suo `package.json`), così le
  dipendenze del video non toccano l'app.
- **Uscite:** `frigolo-lancio-9x16.mp4`, `frigolo-lancio-16x9.mp4`, `frigolo-lancio-15s.mp4`,
  `frigolo-lancio.srt`. Gli MP4 finali (stimati 5-15 MB) vanno in git solo se restano sotto
  i 20 MB; altrimenti in una release di GitHub o in una cartella condivisa, e lo segnalo al PM.

## Cosa serve per partire

1. Ok di Daniele a questo storyboard (testi, durata, niente voce).
2. Gli screenshot S2-S10 dell'app nuova stabile, fatti con i dati d'esempio di
   [../screenshot-lista.md](../screenshot-lista.md).
3. Scelta del brano tra quelli proposti.
