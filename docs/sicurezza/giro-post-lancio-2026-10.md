# Giro di controllo dopo il lancio - ottobre 2026

Autore: Aglio (QA, sicurezza e privacy). Data: 2026-10-18.

Riepilogo pubblico. Come da regola del repo (`docs/DECISIONI.md`), qui ci sono solo esiti e
punti verificati: i problemi ancora aperti sono stati dati al PM in privato e verranno descritti
dopo la correzione.

## Come è stato fatto

- Produzione: solo letture (advisor, cataloghi di sistema, conteggi senza dati personali,
  richieste HTTP non distruttive con le chiavi pubbliche).
- Locale: migration fino alla 0026, prove in transazioni annullate, script di verifica.
- Codice: migration 0024-0026, migration del progetto statistiche, `src/lib/telemetry.ts`,
  `analytics/landing/track.js`, cruscotto.

## Esito per area

| Area                                 | Esito                                                                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advisor Supabase di Frigolo          | Ok: solo avvisi noti e voluti (funzioni `security definer` delle RPC, password compromesse non disponibili sul piano Free)                                                             |
| Metriche (`metrics.*`, Vault)        | Ok: schema non esposto dall'API, nessun permesso per `anon` e `authenticated`, funzioni interne non eseguibili dai client                                                              |
| RPC `metrics_record_*`               | Ok: solo utenti con accesso, limite orario per persona, valori ammessi da elenchi chiusi, testi ripuliti, nessuna lettura                                                              |
| Invio orario al progetto statistiche | Ok: destinazione fissa, segreto solo nel Vault, coda vuota, risposte senza contenuto                                                                                                   |
| Ricezione nel progetto statistiche   | Ok: senza segreto risponde 401; istantanea e chiave non leggibili con la chiave pubblica                                                                                               |
| Progetto statistiche, configurazione | Da sistemare (gravità bassa e media, dettagli al PM)                                                                                                                                   |
| App in produzione                    | Ok: header di sicurezza presenti, nella build solo la chiave pubblicabile, font locali, nessuna violazione CSP nelle schermate di accesso                                              |
| CSP                                  | Ancora `Report-Only`: da rendere effettiva dopo una prova completa da utente collegato                                                                                                 |
| Telemetria dell'app                  | Ok: niente email, id, nomi o liste; errori ripuliti prima dell'invio                                                                                                                   |
| Landing e cruscotto                  | Ok: nel `config.js` solo la chiave anon, `X-Robots-Tag: noindex` attivo, `track.js` rispetta `?no-stats`, Do Not Track e Global Privacy Control, cruscotto con testi sempre "escapati" |
| Informativa privacy                  | Da precisare (gravità media, vedi sotto)                                                                                                                                               |
| Account cancellati                   | Ok: nessuna lista senza persone, nessuna foto o riga di metriche di utenti cancellati                                                                                                  |
| Regressioni                          | Ok: `profili_liste.sql`, `metriche.sql`, `api_e2e.mjs`, lint, typecheck, 74 test, build e `pnpm audit --prod` puliti                                                                   |

## Informativa privacy: cosa precisare

1. **Giorni di utilizzo.** Sono collegati all'account per 180 giorni (la tabella dei tempi lo
   dice), ma il paragrafo sulle statistiche le chiama "anonime" e "senza identificativi": va
   scritto che è un dato legato all'account, usato solo per contare le persone attive.
2. **Statistiche della landing.** L'informativa vale anche per le pagine su dascanfe.com, ma non
   descrive cosa raccoglie `track.js` (pagine viste, provenienza, dimensioni dello schermo, stima
   dei visitatori unici sul server), per quanto tempo, né che Do Not Track, Global Privacy Control
   e `?no-stats` disattivano il conteggio.
3. **Registri di sicurezza.** Tentativi di invito falliti e limiti delle metriche sono legati
   all'account e cancellati entro 24 ore: basta una riga nella tabella dei tempi.

## Note

- Durante le prove locali il seed di sviluppo aveva inviti scaduti (validi 7 giorni): con inviti
  rinnovati `api_e2e.mjs` passa. Conviene che `seed_dev.sql` rinnovi le scadenze.
