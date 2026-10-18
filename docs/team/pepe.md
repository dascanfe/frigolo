# Quaderno di Pepe

Aggiornato da Pepe alla fine di ogni incarico. Il più recente in alto.

## Stato

Analitiche preparate (branch `pepe/analitiche`, draft PR verso main, dipende dalla #16).
Niente in produzione.

- `docs/metriche.md`: definizioni, obiettivi di lancio proposti (da concordare con Salvia).
- App: `supabase/migrations/0024_usage_metrics.sql` (schema privato `metrics`, contatori per
  giorno, giorni attivi per 180 giorni, RPC `metrics_app` solo per `metrics.admins`).
  Verifica: `supabase/checks/metriche.sql`. Applicata al Supabase locale.
- Landing: `analytics/landing/track.js` (senza cookie, stesso raccoglitore `c.php` del sito)
  e `analytics/migrations/0001_frigolo.sql` per il progetto delle statistiche (colonna
  `pagine.sito`, RPC `frigolo_landing`). Verifica: `analytics/checks/landing_locale.sql` su un
  database usa e getta.
- Cruscotto: `sub/00beea034254ed8e/` nel sito (non sotto git), sezioni Landing e App.
  Provato con `?finto` in locale e con la sezione App sul Supabase locale.

## Cosa resta

- Revisione di Aglio (privacy del tracciamento e di `metrics.active_days`) e di Basilio (0024).
- Collegare `track.js` alla landing di Fragola (istruzioni nella PR) con la chiave messa in build.
- In produzione, dopo l'ok di Daniele: 0001 sul progetto statistiche, 0024 su Frigolo, riga in
  `metrics.admins`, caricamento FTP della cartella del cruscotto.
- Metrica guida "attivi settimanali in liste condivise" quando Salvia la conferma.

## Domande aperte per Daniele

- Il cruscotto delle visite del sito conterà anche la landing (stesse tabelle): va bene o
  si filtra (serve toccare il suo `app.js`)?
- In produzione la colonna `pagine.stato` e la versione di `ingest()` che la scrive non ci sono:
  lo `schema.sql` dell'8 settembre non è stato rieseguito. Non blocca niente.

## Diario

### 2026-10-11 - Preparazione analitiche (Fase 2)

- Studiato il sistema esistente: `sub/s/t.js` (tracciante), `sub/s/c.php` (raccoglitore su
  Aruba, impronta giornaliera, IP buttato), `sub/s/schema.sql`, cruscotto `sub/6c967079504b504d/`.
  Letti solo i cataloghi del progetto statistiche in produzione (colonne, policy, funzioni,
  job): nessun dato.
- Scritte le due migration, i controlli, lo script della landing, il cruscotto, le definizioni.
