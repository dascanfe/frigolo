# Metriche di Frigolo

A cura di Pepe. Definizioni delle metriche del cruscotto, da dove vengono e gli obiettivi di
lancio proposti (da concordare con Salvia).

Regola generale: **solo numeri aggregati**. Nessuna riga di visita o di utente arriva al
cruscotto, nessun cookie, nessun IP salvato, nessun identificativo persistente nel browser.

## Dove stanno i dati

| Cosa                | Progetto Supabase                | Come si legge            | Chi può leggere                                     |
| ------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| Visite alla landing | statistiche di dascanfe.com      | `frigolo_landing(da, a)` | solo l'account di Daniele (regole già in vigore)    |
| Uso dell'app        | Frigolo (`egvodwvnralxttxiovau`) | `metrics_app(da, a)`     | solo gli account in `metrics.admins` (uno: Daniele) |

Il cruscotto è una pagina statica nel sito (`sub/<id casuale>/`, stesso stile e stesso accesso
del cruscotto delle visite del sito), con due sezioni: **Landing** e **App**.

## Landing (`www.dascanfe.com/sub/frigolo/`)

### Come si raccoglie

- La landing include `track.js` (sorgente: `analytics/landing/track.js`). Parla con lo stesso
  raccoglitore del sito (`/sub/s/c.php`) con lo stesso formato di `t.js`, quindi le righe
  finiscono nelle tabelle `visite`, `pagine`, `eventi` del progetto delle statistiche.
- Le pagine sotto `/sub/frigolo` sono riconosciute dalla colonna calcolata `pagine.sito`
  (`analytics/migrations/0001_frigolo.sql`): non serve toccare `c.php` né `ingest()`.
- Cosa manda il browser: percorso, titolo, lingua della pagina, fuso orario, tempo con la scheda
  in primo piano, scorrimento massimo, numero di clic, dimensioni dello schermo e della finestra
  (servono al raccoglitore per scartare i robot), provenienza **senza parametri** (solo
  `https://sito/percorso`), dei parametri dell'indirizzo **solo** `utm_source`, `utm_medium`,
  `utm_campaign`, e i clic sugli elementi marcati `data-track` più i link verso altri siti
  (senza parametri).
- Cosa fa il server (`c.php`, già in produzione per tutto il sito): ricava paese, regione, città,
  rete e tipo di dispositivo dall'IP e dal browser, calcola l'**impronta** (SHA-256 di un sale
  segreto che cambia ogni giorno, IP e browser) e poi butta l'IP. Su Supabase arrivano solo
  l'impronta e i nomi dei luoghi.
- Non viene contato: chi ha Global Privacy Control o Do Not Track attivi, i browser pilotati da
  programmi, chi ha aperto la landing con `?no-stats` (come sul resto del sito), i robot
  riconosciuti dal raccoglitore (esclusi dai numeri, contati a parte).

### Definizioni

| Metrica                     | Definizione                                                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visita                      | Serie di messaggi con la stessa impronta senza pause di più di 30 minuti, non di robot, con almeno una pagina sotto `/sub/frigolo` aperta nel periodo.                                       |
| Visitatori unici (stima)    | Impronte distinte per giorno, sommate sul periodo. L'impronta cambia ogni notte: chi torna un altro giorno conta di nuovo (stima per eccesso sui periodi lunghi, esatta sul giorno singolo). |
| Pagine viste                | Aperture di pagine della landing (ricaricare conta).                                                                                                                                         |
| Tempo mediano               | Mediana del tempo con la scheda in primo piano, sulle aperture con tempo > 0.                                                                                                                |
| Rimbalzo                    | Visite con una sola pagina, meno di 10 secondi e nessun clic che conta, sul totale delle visite.                                                                                             |
| Provenienza                 | Canale calcolato da `c.php`: `campagna` (con UTM), `diretto`, `organico` (motori di ricerca), `social`, `ia`, `referral`, `interno`. Più il sito di provenienza (`referente_host`).          |
| UTM                         | `utm_source`, `utm_medium`, `utm_campaign` del primo messaggio della visita. Tutti i link che pubblichiamo devono averli (vedi sotto).                                                       |
| Dispositivo e sistema       | `mobile` / `desktop` / `tablet` e sistema operativo, dal browser. Serve per le istruzioni di installazione (iPhone/Safari, Android/Chrome).                                                  |
| Visite verso l'app          | Visite con almeno un clic su un link verso `frigolo.dascanfe.com` (pulsanti "Apri Frigolo" e link dentro le istruzioni). **È la conversione principale della landing.**                      |
| Clic "Apri Frigolo"         | Clic su elementi `data-track="apri-app"`. Visite e clic totali.                                                                                                                              |
| Clic "Offrimi un caffè 💚"  | Clic su `data-track="caffe"` (in mancanza del nome, link verso `paypal.me`). Misura l'interesse, non la donazione: PayPal non ci dice se poi si dona.                                        |
| Istruzioni di installazione | Clic su `data-track="installa-ios"` e `data-track="installa-android"` (o apertura di un `<details data-track="...">`).                                                                       |
| GitHub                      | Clic su `data-track="github"`.                                                                                                                                                               |

### Convenzione UTM per i link pubblicati

`?utm_source=<piattaforma>&utm_medium=<social|email|post|bio>&utm_campaign=<lancio|nome>`, tutto
minuscolo, senza spazi. Esempio: `https://www.dascanfe.com/sub/frigolo/?utm_source=instagram&utm_medium=bio&utm_campaign=lancio`.
Zenzero e Paprika li usano in ogni post.

## App (database di Frigolo)

### Come si raccoglie

Migration `supabase/migrations/0024_usage_metrics.sql`, schema privato `metrics` (non esposto
dalle API, nessun permesso ai client):

- `metrics.daily_counts`: contatori per giorno (ora italiana), aggiornati da trigger. Servono
  perché le righe di origine spariscono (le liste vuote si eliminano, la spesa svuota la lista,
  gli account si cancellano). Solo numeri.
- `metrics.active_days`: coppie (utente, giorno) in cui l'utente ha fatto almeno un'azione. È
  l'unico dato per utente: tenuto **180 giorni** (job notturno), cancellato insieme all'account,
  mai esposto riga per riga. Serve a persone attive e retention.
- All'installazione i contatori vengono riempiti dai dati già presenti (stima per difetto: quello
  già cancellato non si ricostruisce).
- Nessuna modifica all'app: niente chiamate in più, niente tracciamento delle aperture.

### Definizioni

"Giorno" è la data in ora italiana (Europe/Rome).
"Attivo" vuol dire che quel giorno la persona ha fatto almeno una di queste cose: aggiunto,
spuntato o tolto un prodotto; completato una spesa; creato, rinominato o modificato una lista;
creato o modificato un prodotto del catalogo; modificato il profilo; è entrata in una lista.
Aprire l'app e guardare la lista **non** conta (non lascia tracce, ed è voluto).

| Metrica                          | Definizione                                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registrazioni                    | Account creati nel giorno (profilo creato alla registrazione). Restano nello storico anche se l'account viene chiuso.                                      |
| Iscritti oggi                    | Profili esistenti in questo momento.                                                                                                                       |
| Profili completati               | Profili in cui l'utente ha scelto il nome (nel periodo), anche sulle registrazioni dello stesso periodo.                                                   |
| Liste create / eliminate         | Liste create nel periodo; liste eliminate (l'ultimo membro è uscito o ha chiuso l'account).                                                                |
| Liste con 2+ persone             | Liste che oggi hanno almeno due membri, sul totale delle liste; più la media di persone per lista.                                                         |
| Persone attive giornaliere (DAU) | Persone attive in quel giorno.                                                                                                                             |
| Persone attive settimanali (WAU) | Persone attive in almeno un giorno dei 7 giorni fino a quel giorno compreso. Nel cruscotto anche a 30 giorni (MAU).                                        |
| Persone attive nel periodo       | Persone attive in almeno un giorno del periodo.                                                                                                            |
| Prodotti aggiunti                | Righe inserite nella lista (da tutte le liste).                                                                                                            |
| Spese completate                 | Spese chiuse, distinte fra "a mano" (pulsante Spesa finita) e "automatiche" (salvataggio notturno).                                                        |
| Inviti usati                     | Ingressi in una lista dove c'era già almeno un'altra persona (codice o link).                                                                              |
| Inviti sbagliati                 | Tentativi falliti di usare un codice o un link di invito, da `invite_attempts_daily`. Allarme: 30 o più in un giorno (il tetto per utente è 30 al giorno). |
| Retention a 1 giorno             | Fra chi si è registrato nel periodo: quota attiva il giorno dopo la registrazione. Conta solo chi si è registrato almeno 2 giorni fa.                      |
| Retention a 7 giorni             | Quota attiva in almeno un giorno fra il 7° e il 13° dopo la registrazione (la seconda settimana). Conta solo chi si è registrato almeno 14 giorni fa.      |
| Retention a 30 giorni            | Quota attiva in almeno un giorno fra il 30° e il 59° (il secondo mese). Conta solo chi si è registrato almeno 60 giorni fa.                                |
| Dimensione del database          | `pg_database_size` rispetto al limite del piano Free (500 MB). Avviso all'80%, allarme al 90%.                                                             |
| Spazio file                      | Somma delle dimensioni dei file nello Storage (foto profilo) rispetto a 1 GB.                                                                              |

Retention a finestra (non "esattamente il giorno N") perché una lista della spesa si usa una o
due volte a settimana: chi fa la spesa il sabato non apre l'app il settimo giorno esatto.

Avvertenza sui numeri piccoli: con pochi iscritti le percentuali saltano. Il cruscotto mostra
sempre anche i valori assoluti ("9 su 22").

## Obiettivi di lancio (proposta di Pepe, da concordare con Salvia)

Primi 30 giorni dopo il lancio. Sono ipotesi ragionevoli per un'app gratuita lanciata con i
canali personali di Daniele, da rivedere quando Salvia avrà il piano di lancio.

| Metrica                               | Obiettivo 30 giorni | Soglia d'allarme    |
| ------------------------------------- | ------------------- | ------------------- |
| Visite alla landing                   | 1.500               | sotto 300           |
| Visite verso l'app / visite           | 25%                 | sotto 10%           |
| Rimbalzo landing                      | sotto 50%           | sopra 70%           |
| Registrazioni                         | 150                 | sotto 30            |
| Profili completati / registrazioni    | 85%                 | sotto 60%           |
| Liste con 2+ persone / liste          | 30%                 | sotto 10%           |
| Retention a 7 giorni                  | 35%                 | sotto 15%           |
| Retention a 30 giorni (dal 2° mese)   | 20%                 | sotto 8%            |
| Persone attive settimanali / iscritti | 40%                 | sotto 20%           |
| Clic sul caffè / visite               | 1-2%                | (solo osservazione) |
| Inviti sbagliati in un giorno         | sotto 10            | 30 o più            |
| Database                              | sotto 80% di 500 MB | 90%                 |

La metrica guida proposta è **persone attive settimanali in liste condivise**: dice se Frigolo
fa quello per cui esiste (una lista usata in compagnia). Per misurarla basta incrociare
`active_days` con le liste con 2+ persone: la aggiungo quando Salvia la conferma.

## Privacy (da rivedere con Aglio)

- Landing: nessun cookie, nessuna memoria locale (salvo la chiave di esclusione `?no-stats`
  per Daniele, come sul resto del sito), nessun identificativo persistente; IP usato solo in
  memoria dal raccoglitore per luogo, rete e impronta giornaliera, mai salvato. Da citare nella
  privacy della landing: "statistiche anonime senza cookie; il server ricava paese e città
  dall'indirizzo IP, che non viene conservato".
- App: `metrics.active_days` è un dato personale (pseudonimo, per utente): finalità statistica,
  180 giorni, cancellato con l'account. Va nell'informativa e, se Aglio lo ritiene, nell'export
  dei dati (`export_my_data`).
- Il cruscotto riceve solo aggregati; nessuna email nel repo (gli amministratori stanno in una
  tabella riempita a mano).
