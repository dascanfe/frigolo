# Quaderno di Aglio

Aggiornato da Aglio alla fine di ogni incarico. Il più recente in alto.

## Stato

Primo audit fatto (branch `aglio/audit-legale`, issue #11, #12, requisiti per #9). Verdetto:
**non si può aprire al pubblico** finché non sono chiusi A1, A2 e i punti media bloccanti di
`docs/sicurezza/audit-2026-10.md`. Con le registrazioni chiuse il rischio attuale è basso.

## Cosa resta da fare

- Secondo giro: test RLS in locale con utenti di test (A1, A2, M1, M2, B1) e script di regressione
  in `supabase/tests/`, appena Basilio libera `supabase start`.
- Revisione di `basilio/profili-liste`: controllare per primo M5 (permessi di default ad `anon`) e
  A1 (colonne di appartenenza non modificabili dal client).
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
