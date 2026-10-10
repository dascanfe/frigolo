# Quaderno di Aglio

Aggiornato da Aglio alla fine di ogni incarico. Il più recente in alto.

## Stato

- Audit di ottobre: A1 e A2 **corretti in produzione** (0017, PR #17) e documentati in
  `docs/sicurezza/audit-2026-10.md`; gli altri punti sono seguiti in privato (regola del repo
  pubblico). Non si può ancora aprire al pubblico.
- PR #16 (Basilio): **approvata** al terzo giro (`docs/sicurezza/revisione-pr16.md`).
- PR #18 (Fragola): **approvata con correzioni** (`docs/sicurezza/revisione-pr18.md`).
- PR #15 (mia): privacy, termini e registro aggiornati con le decisioni di Daniele; CSP con
  Turnstile e senza Google Fonts, sempre `Report-Only`.

## Cosa resta da fare

- Terzo giro di Basilio sulla PR #16 (limiti 2 liste e 5 persone, captcha, conferma email,
  template, export e cancellazione account): revisione rapida quando il PM avvisa.
- Verificare le correzioni chieste su #16 e #18, poi documentare i punti chiusi.
- Dopo il deploy degli header: verificare la CSP in produzione su tutte le schermate (con
  Turnstile) e passarla da `Report-Only` a effettiva.
- Script di regressione in `supabase/tests/` eseguibili a ogni migration.
- Revisione privacy del tracciamento di Pepe (Fase 2).

## Domande aperte per Daniele

1. Città e provincia da pubblicare nei documenti legali (segnaposto `[CITTÀ (PROVINCIA)]`).
2. Vercel: restare su Hobby (DPA non previsto) o passare a Pro? Copia firmata del DPA di Supabase
   se serve (vedi riepilogo al PM).
3. Revisione professionale di privacy e termini prima del lancio (consigliata, decisa).

## Diario

### 2026-10-10 - Terzo giro sulla PR #16 e DPA

- Migration 0018-0023, edge function `delete-account` e script delle foto orfane: prove in
  transazioni annullate e chiamate non distruttive all'API e alle funzioni locali.
- DPA: Supabase, Resend e Cloudflare vincolanti con i termini accettati; Vercel solo Pro ed
  Enterprise (domanda aperta per Daniele e per il professionista).

### 2026-10-10 - Revisione PR #18 e aggiornamento della PR #15

- PR #16 senza commit nuovi rispetto al secondo giro: verdetto invariato.
- PR #18 letta sul branch (sessione, cache, inviti, foto, service worker); verdetto pubblico solo
  con i punti verificati.
- Merge di `origin/main` nel mio branch; audit ridotto ai punti corretti in produzione (A1, A2);
  privacy, termini e registro con le decisioni di Daniele; CSP aggiornata.

### 2026-10-10 - Secondo giro sulla PR #16

- Catena 0001-0020 in locale, prove in transazioni annullate con gli utenti di `seed_dev.sql`;
  alcune chiamate all'API locale firmando un JWT con la chiave `oct` del JWKS di
  `PGRST_JWT_SECRET` (il segreto locale ora è un JWKS, non una stringa). Nessuna scrittura.
- Nuova regola: i problemi aperti vanno solo al PM, nei file pubblici solo verdetto e punti
  corretti. Il file di revisione è stato riscritto di conseguenza.

### 2026-10-10 - Revisione PR #16 e correzione urgente

- Prove in locale su `supabase_db_frigolo` (migration di Basilio applicate), sempre dentro
  `begin; ... rollback;`, impersonando gli utenti con `set_config('role')` e
  `request.jwt.claims`. Correzione urgente applicata nella stessa transazione per provarne la
  compatibilità. Script di Basilio `supabase/checks/profili_liste.sql`: passa.
- Precisata la riproduzione di A1 (dettagli solo al PM).
- Lezione: nei test con psql, i file inclusi con `\i` devono lasciare il ruolo a `postgres`,
  altrimenti le migration falliscono con "must be owner".

### 2026-10-10 - Audit prima dell'apertura

- Audit statico delle migration `0001`-`0016`, advisor e cataloghi di produzione in sola lettura
  (`supabase db advisors --linked`, query su `pg_policies`, `pg_proc`, grant, `pg_default_acl`,
  bucket, cron) lanciati dalla cartella `Frigolo App`, l'unica linkata. Il server MCP di Supabase
  non ha i permessi sul progetto. Produzione allineata alle migration.
- `pnpm audit` (serve `--registry=https://registry.npmjs.org/`, altrimenti errore 426): solo
  dipendenze di sviluppo.
- Header di sicurezza in `vercel.json`, CSP in `Report-Only`; provata in locale sulla schermata di
  accesso, nessuna violazione.
- Scritti `docs/sicurezza/audit-2026-10.md`, `docs/sicurezza/rilascio.md`,
  `docs/legale/privacy.md`, `docs/legale/termini.md`, `docs/legale/registro-trattamenti.md`.
