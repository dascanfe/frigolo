# Screenshot da fare

Si fanno quando l'app nuova (profili e liste multiple, PR #18) è stabile, su un ambiente con
**soli dati d'esempio** (Supabase in locale o un progetto di prova), mai sul database di
produzione e mai con dati di persone vere.

## Come

- Browser a misura di telefono: 390x844 punti a 3x (PNG 1170x2532), come un iPhone recente.
  Per la landing anche 360x800 a 3x (Android).
- App installata come PWA (senza barra del browser), tranne S10 che mostra proprio Safari.
- Ora di stato fissa 9:41, batteria piena, nessuna notifica (si ritaglia la barra di stato se
  serve).
- Tema Autunno, salvo dove indicato. Lingua italiana.
- File in `marketing/screenshot/` con il nome della tabella (`s02-catalogo.png`, ...).

## Dati d'esempio

Account di prova creati apposta, nomi inventati e neutri, nessun cognome.

| Persona | Colore     | Foto                      | Liste             |
| ------- | ---------- | ------------------------- | ----------------- |
| Giulia    | ottanio    | nessuna (avatar mascotte) | Casa, Coinquilini |
| Luca    | arancio    | nessuna (avatar mascotte) | Coinquilini       |
| Marta   | ocra       | nessuna (avatar mascotte) | Coinquilini       |
| Lele     | terracotta | nessuna (avatar mascotte) | Casa              |

Niente foto di persone: anche se fossero generate, sembrerebbero utenti veri.

- **Lista "Casa"** (Giulia e Lele). Da comprare: Latte (2), Pane, Mele (1 kg), Zucchine, Yogurt
  bianco (4), Pasta (2), Passata di pomodoro, Uova (6), Caffè, Detersivo piatti, Piselli
  surgelati. Nota su Latte: "Quello senza lattosio".
- **Lista "Coinquilini"** (Giulia, Luca, Marta). Da comprare: Carta igienica, Olio, Sale grosso,
  Spugne, Birra (6), Patatine, Pomodori.
- **Supermercati:** "Supermercato sotto casa" e "Mercato del sabato" (nessuna insegna vera).
- **Storico:** 10-12 spese su 6 settimane in "Casa", 8-20 prodotti ciascuna, per avere grafici
  pieni nelle analitiche. Si può generare con uno script di seed.
- **Prodotti creati dalla lista:** "Biscotti della nonna", "Pesto di Lele".

## Elenco

| #   | Schermata                                    | Stato e dati                                                                        | Serve per                                                        |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| S1  | Accesso (Crea l'account)                     | Campi vuoti, mascotte visibile                                                      | Landing ("come si comincia")                                     |
| S2  | Catalogo                                     | Categoria Frutta e verdura aperta, 3-4 tessere già arancio (in lista)               | Video scena 2, social, landing                                   |
| S3  | Lista "Casa" vista da Lele (a casa, vede l'Ananas appena aggiunto)           | Da comprare pieno, Yogurt appena aggiunto                                           | Video scena 3                                                    |
| S4  | Lista "Casa" vista da Giulia (al supermercato) | Stessa lista, 4 prodotti già nel carrello, Yogurt in cima ai "Da comprare"          | Video scena 3, social                                            |
| S5  | Lista in ordine di corsia                    | Supermercato "Supermercato sotto casa" scelto, sezioni ordinate per corsia          | Video scena 4, post "trucchi"                                    |
| S6  | Lista con carrello                           | Metà prodotti "Nel carrello" (verde salvia), metà "Da comprare"                     | Video scena 5, landing                                           |
| S7  | Spesa finita                                 | Messaggio "Spesa finita: 12 prodotti", effetto di festa                             | Video scena 6, social                                            |
| S8  | Cambia lista                                 | Foglio aperto con "Casa" e "Coinquilini"                                            | Video scena 7, landing                                           |
| S9  | Persone della lista "Coinquilini"            | Giulia, Luca, Marta con avatar mascotte su colori diversi, codice d'invito            | Video scena 7, post sugli inviti                                 |
| S10 | Installazione su iPhone                      | Safari su frigolo.dascanfe.com, foglio Condividi con "Aggiungi alla schermata Home" | Video scena 8, landing (istruzioni)                              |
| S11 | Installazione su Android                     | Chrome con "Installa app"                                                           | Landing (istruzioni)                                             |
| S12 | Invito ricevuto                              | Schermata d'ingresso con "Marta ti invita nella lista Coinquilini"                  | Post sugli inviti                                                |
| S13 | Analitiche                                   | Lista "Casa", andamento a linea morbida, prodotti più comprati, frequenza           | Landing, post                                                    |
| S14 | Suggeriti per te                             | 3-4 suggerimenti in cima alla lista ("Di solito ogni 5 giorni")                     | Post "trucchi"                                                   |
| S15 | Temi                                         | Impostazioni, scelta del tema; 3 copie della lista in Autunno, Basilico, Mare       | Post sui temi                                                    |
| S16 | Stato vuoto                                  | Lista nuova vuota con Frigolo pensierosa ("Lista vuota")                            | Social (presentazione della mascotte)                            |
| S17 | Senza rete                                   | Banner "Offline", lista ancora utilizzabile                                         | Post "funziona anche senza rete" (se vero al momento delle foto) |

## Controllo prima di consegnare

- [ ] Nessun nome, email, foto o lista di persone reali (nemmeno nelle barre in alto).
- [ ] Nessun marchio di supermercato o prodotto di marca leggibile.
- [ ] Solo funzioni che ci sono davvero nella versione pubblicata.
- [ ] Testi dell'app allineati al glossario (se uno screenshot mostra un testo vecchio, si
      aspetta la correzione).
