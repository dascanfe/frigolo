# Quaderno di Aglio

Aggiornato da Aglio alla fine di ogni incarico. Il più recente in alto.

## Stato

Primo audit fatto (branch `aglio/audit-legale`, issue #11, #12, requisiti per #9). Verdetto:
**non si può aprire al pubblico** finché non sono chiusi A1, A2 e i punti media bloccanti di
`docs/sicurezza/audit-2026-10.md`. Con le registrazioni chiuse il rischio attuale è basso.

PR #16, secondo giro (`docs/sicurezza/revisione-pr16.md`): correzione urgente **approvata**,
PR #16 **approvata con correzioni**. I punti aperti sono stati dati solo al PM (regola: niente
vulnerabilità aperte in file, PR, commenti o issue pubbliche).

## Cosa resta da fare

- Verificare le correzioni chieste a Basilio sulla PR #16 (terzo giro), poi aggiornare il file
  di revisione con i punti chiusi.
- Dopo il deploy della correzione urgente: ricontrollare in produzione (sola lettura) grant di
  `household_members` e policy di `storage.objects`.
- Test RLS in locale su M1, B1 e script di regressione in `supabase/tests/` (A1, A2, M2 già provati
  a mano nella revisione della PR #16).
- Dopo il deploy degli header: verificare la CSP in produzione su tutte le schermate e passarla da
  `Report-Only` a effettiva; aggiornarla per Turnstile, analitiche e font in locale.
- Verificare le correzioni di Basilio e Fragola sui punti dell'audit.
- Revisione privacy del tracciamento di Pepe (Fase 2).

## Domande aperte per Daniele

1. Dati per i documenti legali: email di contatto per la privacy e indirizzo postale da pubblicare.
2. Cancellazione automatica degli account inattivi: va bene dopo 24 mesi, con avviso 30 giorni prima?
3. Età minima 14 anni: va bene?
4. Vuoi far rivedere privacy e termini da un professionista prima del lancio? I punti sono in fondo
   ai due documenti.
5. DPA dei fornitori: vanno accettati dal pannello di Supabase e Vercel (serve il tuo account).

## Diario

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
