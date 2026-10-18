# Checklist di rilascio

Da copiare nella descrizione della PR (o nel messaggio al PM) e spuntare **prima di ogni
pubblicazione in produzione**: push su `main`, migration, `supabase config push`, modifiche a
Vercel. Se un punto non riguarda il rilascio, scrivere "n/a" e il perché. Aglio firma in fondo.

## 1. Codice

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passano
- [ ] `pnpm audit --prod --registry=https://registry.npmjs.org/`: nessuna vulnerabilità alta o critica
- [ ] Nessun segreto nel diff: niente chiavi, password, token, `service_role`, email personali
      (`git diff main... | grep -iE "eyJ|service_role|secret|password|@"` e controllo a occhio)
- [ ] Nessun dato personale (nomi reali, foto, email) in codice, seed, test o screenshot
- [ ] Codice di debug solo dietro `import.meta.env.DEV`; nessun `console.log` con dati utente

## 2. Database (se ci sono migration)

- [ ] Migration provata in locale da zero (`supabase db reset`) e sopra i dati esistenti
- [ ] Ogni nuova tabella: `enable row level security`, `revoke all ... from anon`, policy per
      select, insert, update, delete; insert e update con `with check`
- [ ] Nessuna policy permette di cambiare colonne di appartenenza (`household_id`, `list_id`,
      `user_id`, `role`): grant per colonna dove serve
- [ ] Ogni funzione: `set search_path = ''`, nomi con schema, `revoke execute ... from public, anon`
      salvo quelle volutamente pubbliche
- [ ] Ogni `security definer`: controlla `auth.uid()` e l'appartenenza, non restituisce dati di
      altre liste, ha un commento che spiega perché è definer
- [ ] Ogni testo ha un limite di lunghezza; ogni crescita illimitata ha una quota
- [ ] Nuove tabelle in Realtime solo con RLS attiva
- [ ] Test RLS di regressione (utente A non vede né modifica nulla di B) passano in locale
- [ ] `supabase db advisors --local --type all`: nessun nuovo avviso, o avviso motivato
- [ ] Revisione di Aglio fatta sul branch

## 3. Auth, Storage e configurazione

- [ ] `config.toml` e produzione allineati; differenze volute scritte in `docs/SVILUPPO.md`
- [ ] `site_url` e redirect corretti per il dominio in uso; niente `localhost` in produzione
- [ ] Bucket Storage: niente policy `select` pubblica; limiti di dimensione e tipo MIME
- [ ] Conferma email, captcha e rate limit attivi (dalla apertura al pubblico in poi)

## 4. Vercel e header

- [ ] Header di sicurezza presenti (`curl -sI https://<dominio>/ | grep -iE "strict|content-security|frame|referrer|permissions|nosniff"`)
- [ ] CSP aggiornata se il rilascio aggiunge un dominio esterno (font, captcha, analitiche, immagini)
- [ ] Variabili d'ambiente: solo `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` lato client;
      nessun segreto con prefisso `VITE_`

## 5. Privacy e legale

- [ ] Nuovi dati raccolti o nuovi fornitori? Aggiornati `docs/legale/privacy.md`,
      `docs/legale/registro-trattamenti.md` e la data "ultimo aggiornamento"
- [ ] Nuovo tracciamento? Niente cookie né identificativi persistenti senza consenso; revisione di Aglio
- [ ] Le pagine privacy e termini nell'app e nella landing sono quelle aggiornate

## 6. Dopo il deploy (entro 30 minuti)

- [ ] L'app si apre, si accede, la lista si sincronizza tra due dispositivi di test
- [ ] Console del browser senza errori né violazioni CSP
- [ ] `supabase db advisors --linked --type security`: nessun nuovo avviso
- [ ] Dimensione del database sotto il 70% del piano (pannello Supabase > Reports)
- [ ] In caso di problemi: rollback da Vercel ("Promote" del deploy precedente) e, per le
      migration, migration di correzione già pronta

## Firma

- Rilascio: `<versione o PR>` - Data: `<AAAA-MM-GG>`
- Verificato da Aglio: `si può pubblicare` / `bloccato da: ...`
- Ok di Daniele: `<sì/no, data>`
