# Frigolo - guida tecnica

Lista della spesa condivisa, installabile come PWA su iOS e Android.
Catalogo a griglia stile Bring!, un tap per aggiungere e uno per togliere, con in più:

- suggerimenti intelligenti basati su stagionalità e abitudini di acquisto reali,
- lista "Da comprare" in un'unica fila nell'ordine del percorso al supermercato
  (ortofrutta, pane, banco, frigo, scaffali, bevande, casa e igiene, surgelati per ultimi),
  con quantità, nota e supermercato direttamente sulla tile,
- analitiche sullo storico degli acquisti.

## Stack

- Vite 8 + React 19 + TypeScript 6 (SPA client-side)
- Tailwind CSS v4 con design token custom in CSS
- Supabase: Postgres, Auth (email e password) e Realtime
- TanStack Query per fetching, cache e optimistic update
- vite-plugin-pwa (Workbox) per service worker, manifest e offline
- lucide-react per le icone, Recharts per i grafici, React Router v8 per il routing
- Deploy su Vercel, package manager pnpm

## Requisiti

- Node.js 22.22 o superiore
- pnpm 10 (`corepack enable && corepack prepare pnpm@10 --activate`)
- Un progetto Supabase (piano gratuito sufficiente)

## Setup locale

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone https://github.com/dascanfe/frigolo.git
   cd frigolo
   pnpm install
   ```

2. Crea il file `.env` partendo dall'esempio e compila i valori dal pannello
   Supabase (Project Settings > API):

   ```bash
   cp .env.example .env
   ```

   | Variabile                | Descrizione                         |
   | ------------------------ | ----------------------------------- |
   | `VITE_SUPABASE_URL`      | URL del progetto Supabase           |
   | `VITE_SUPABASE_ANON_KEY` | Chiave anon (pubblica) del progetto |

3. Applica le migration e il seed al database (vedi la sezione "Database" qui sotto).

4. Avvia il server di sviluppo:

   ```bash
   pnpm dev
   ```

   L'app è raggiungibile su `http://localhost:5173`. Per provarla dal telefono sulla
   stessa rete usa `pnpm dev --host`.

## Database

Lo schema vive in `supabase/migrations/` (file numerati, applicati in ordine) e i dati iniziali in
`supabase/seed.sql` (14 categorie, 234 prodotti di catalogo base). Entrambi sono
idempotenti: rilanciare il seed non crea duplicati.

| File                       | Contenuto                                                           |
| -------------------------- | ------------------------------------------------------------------- |
| `0001_schema.sql`          | Tabelle, vincoli, indici, Realtime su `list_entries`                |
| `0002_rls.sql`             | Row Level Security: ogni utente vede solo il proprio household      |
| `0003_functions.sql`       | RPC: `create_household`, `join_household`, `complete_shopping_trip` |
| `0004_analytics_views.sql` | Funzioni di aggregazione per le analitiche                          |
| `0005`-`0011`              | Filtri analitiche, avatar, supermercati per casa, ping keep-alive   |
| `0012_supermarket_order`   | Ordine delle categorie = percorso tipico del supermercato           |
| `0013_item_icons`          | Icone dedicate (lamponi, mirtilli, mozzarella, piadine)             |
| `0014_accenti`             | Accenti veri nei nomi (Caffè, Tè, Pancarrè, Alì)                    |
| `0015`-`0016`              | Salvataggio automatico notturno della spesa (funzione + pg_cron)    |
| `0017_security_hotfix`     | Foto non elencabili, membri vincolati alla propria lista            |
| `0018_profiles`            | Profilo unico per utente (nome, foto, colore) e migrazione dei dati |
| `0019_multi_lists`         | Liste multiple: crea, entra, rinomina, lascia, elimina, invito      |
| `0020_limits_quotas`       | Lunghezze massime dei testi e quote per lista                       |
| `0021_default_stores`      | Supermercati di partenza generici per le liste nuove                |
| `0022_export_my_data`      | Export dei dati dell'utente (`export_my_data`)                      |
| `0023_avatar_storage`      | Massimo 5 foto per utente, elenco dei file orfani                   |
| `seed.sql`                 | Categorie e catalogo base italiano                                  |

### Sviluppo in locale (consigliato)

Ogni migration si prova prima qui. Serve Docker (Docker Desktop o OrbStack) acceso e la
[Supabase CLI](https://supabase.com/docs/guides/local-development).

```bash
supabase start
```

La prima volta scarica le immagini (qualche minuto), poi avvia Postgres, Auth, Storage,
Realtime e Studio, applica tutte le migration in ordine e il seed. `supabase status` mostra
URL e chiavi locali: per far girare l'app contro il database locale crea `.env.local`
(ignorato da git, ha la precedenza su `.env`) con

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<la "anon key" di supabase status>
```

| Cosa                      | Dove                                                      |
| ------------------------- | --------------------------------------------------------- |
| API (PostgREST, Auth)     | `http://127.0.0.1:54321`                                  |
| Postgres                  | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio                    | `http://127.0.0.1:54323`                                  |
| Email catturate (Mailpit) | `http://127.0.0.1:54324`                                  |

Comandi utili:

```bash
supabase db reset                      # ricrea il DB da zero: tutte le migration + seed
supabase migration new <nome>          # nuovo file in supabase/migrations (poi rinominalo NNNN_nome.sql)
supabase migration up --local          # applica solo le migration nuove, senza perdere i dati
supabase db reset --version 0016       # riparte fermandosi a una migration (per provare la successiva su dati finti)
supabase db lint --local               # controlla le funzioni plpgsql
supabase stop                          # spegne tutto (i dati restano nel volume Docker)
```

Tipi TypeScript dal database locale:

```bash
supabase gen types typescript --local --schema public > src/types/database.ts
```

Il generatore locale omette il blocco `__InternalSupabase` (`PostgrestVersion: "14.5"`) in
cima al tipo `Database`: rimettilo a mano, così il diff resta pulito e il client tipizzato
non cambia.

In locale `enable_signup = false` vale come in produzione: gli utenti di prova si creano
via SQL. Dopo ogni `supabase db reset` lancia

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/checks/seed_dev.sql
```

che crea tre account con cui accedere all'app in locale (password valide solo nel database
locale; lo script si ferma se trova account veri):

| Email                | Password           | Situazione                                        |
| -------------------- | ------------------ | ------------------------------------------------- |
| `alice@frigolo.test` | `frigolo-locale-1` | liste "Casa prova" (con Bruno) e "Ufficio prova"  |
| `bruno@frigolo.test` | `frigolo-locale-2` | lista "Casa prova"                                |
| `carla@frigolo.test` | `frigolo-locale-3` | nessuna lista, profilo da completare (onboarding) |

pg_cron funziona anche in locale: i job `frigolo-auto-complete-trips` e
`frigolo-cron-cleanup` (e dalla 0019 `frigolo-invite-attempts-cleanup`) compaiono in `cron.job`.

Verifiche ripetibili di profili, liste, inviti e limiti (utenti finti, RLS, RPC, regressioni
della revisione di sicurezza, tutto in una transazione annullata alla fine):

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/checks/profili_liste.sql
```

Verifiche sull'API locale (PostgREST, Auth, Storage, edge function `delete-account`, export),
con gli account di `seed_dev.sql`:

```bash
node supabase/checks/api_e2e.mjs
```

Per provare la migrazione dei profili su dati simili a quelli di produzione:

```bash
supabase db reset --version 0017
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/checks/dati_pre_0018.sql
supabase migration up --local
```

### Produzione: Supabase CLI

Solo dopo la prova in locale e la revisione di Aglio, con l'ok di Daniele.

```bash
supabase login
```

```bash
supabase link --project-ref <ref-del-progetto>
```

```bash
supabase db push --include-seed
```

Il CLI chiede la password Postgres del progetto (Project Settings > Database). Per
rigenerare i tipi TypeScript dopo una modifica allo schema:

```bash
supabase gen types typescript --linked --schema public > src/types/database.ts
```

### Alternativa: SQL editor del dashboard

Apri il progetto su [supabase.com/dashboard](https://supabase.com/dashboard), vai in
**SQL Editor > New query** e incolla ed esegui, nell'ordine, il contenuto di:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_functions.sql`
4. `supabase/migrations/0004_analytics_views.sql`
5. `supabase/seed.sql`

Ogni file va eseguito da solo (un file per query). Se un file fallisce a metà, il
blocco viene annullato per intero: correggi e rilancia lo stesso file.

### Verifica

Nel SQL editor:

```sql
select
  (select count(*) from public.categories) as categorie,
  (select count(*) from public.items where household_id is null) as prodotti_base,
  (select count(*) from pg_policies where schemaname = 'public') as policy;
```

Atteso: 14 categorie, 234 prodotti, 15 policy.

## Autenticazione

Accesso con **email e password** (Supabase Auth). Configurazione in `supabase/config.toml`:

- conferma dell'email obbligatoria (`enable_confirmations`), cambio password solo con
  sessione recente (`secure_password_change`), password di almeno 10 caratteri (la
  protezione dalle password compromesse non c'è sul piano Free);
- email in italiano: template HTML in `supabase/templates/` (testi di Zenzero in
  `docs/comunicazione/email.md`), collegati in `[auth.email.template.*]` e
  `[auth.email.notification.password_changed]`. In locale si leggono in Mailpit
  (`http://127.0.0.1:54324`);
- **SMTP (Resend) e captcha (Cloudflare Turnstile) si gestiscono dal pannello di Supabase**,
  non dal file: le due sezioni restano commentate, così un `supabase config push` non li
  spegne e non ne cancella le chiavi. Prima di ogni push: `supabase config diff`;
- `site_url` è `https://frigolo.dascanfe.com`; tra i redirect anche il vecchio
  `https://frigolo-app.vercel.app` e localhost;
- le registrazioni (`[auth] enable_signup`) restano chiuse fino all'apertura al pubblico.

Il captcha si prova in locale scommentando `[auth.captcha]` solo sul proprio computer (non
si committa) con le chiavi di test di Cloudflare: secret `1x0000000000000000000000000000000AA`
nel file, site key `1x00000000000000000000AA` nel frontend, poi `supabase stop` e
`supabase start`. Il token di test che accettano è `XXXX.DUMMY.TOKEN.XXXX`.

"Password dimenticata" invia un'email con un link che va aperto nello stesso browser da cui
è stato richiesto (flusso PKCE) e porta alla schermata "Nuova password".

**Account e dati (GDPR).** `rpc('export_my_data')` restituisce un JSON con account,
profilo e, per ogni lista, prodotti in lista, prodotti della lista e spese (senza id né nomi
delle altre persone: per ogni riga solo `da_me`). La cancellazione dell'account passa dalla
edge function `delete-account` (`supabase/functions/delete-account/`):
`supabase.functions.invoke('delete-account', { body: { confirm: 'ELIMINA' } })`. Cancella
le foto e l'account; le liste in cui l'utente era solo spariscono, in quelle condivise
restano prodotti e spese senza riferimenti a lui. Dopo, il frontend fa `signOut` e pulisce
la cache. In produzione si pubblica con `supabase functions deploy delete-account`.

Il primo accesso porta all'onboarding (`src/features/onboarding/`, testi in
`src/i18n/it.ts`): "Come ti chiami?" se il profilo è da completare, poi "La tua prima
lista" (per conto mio, con altre persone, ho un codice) ed eventualmente l'invito. Chi
apre un link `/invito/<token>` senza essere dentro l'app passa prima da registrazione o
accesso: il token resta in `localStorage` (`frigolo:pending-invite`) e alla fine compare
"Ti invitano in {lista}". La schermata "Controlla la posta" è già pronta per quando la
conferma email sarà attiva.

**Lista aperta.** La lista mostrata si sceglie dal titolo della schermata principale
("Cambia lista") e resta sul dispositivo (`frigolo:current-list:<user_id>`); se non
esiste più si apre la più vecchia. Analitiche, spesa e supermercati seguono la lista
aperta. Senza foto l'avatar è la mascotte (`public/mascot-avatar.webp`, generata da
`scripts/generate-mascot-avatar.mjs`) sul colore del profilo.

## Profili e liste (API)

Nella UI una "lista" è una riga di `households`: le tabelle non cambiano nome.

**Profilo** (`profiles`, uno per utente, uguale in tutte le liste). Nasce da solo alla
registrazione: nome e colore arrivano da
`signUp({ options: { data: { display_name, color } } })`. Senza nome il profilo ha
"Utente" e `completed_at` null, cioè è da completare nell'onboarding; senza colore ne
riceve uno a caso. Ognuno legge il proprio profilo e quelli di chi condivide almeno una
lista con lui, e modifica solo il proprio.

- `display_name`: 1-40 caratteri.
- `color`: sempre valorizzato, solo uno dei token di `MEMBER_COLORS` (`src/lib/colors.ts`):
  `c-teal`, `c-brick`, `c-olive-deep`, `c-rust`, `c-brown`, `c-terracotta`, `c-burnt`,
  `c-ochre`, `c-ink-soft`. La lista chiusa sta anche nel DB (`member_colors()`): se cambia la
  tavolozza vanno aggiornati tutti e due.
- `avatar_path`: facoltativo. È il **percorso** nel bucket `avatars`, nella propria cartella
  (`<user_id>/<file>`), non un URL. L'URL lo costruisce il client con
  `supabase.storage.from('avatars').getPublicUrl(avatar_path)`, così nessuno può far
  caricare agli altri un'immagine da un server suo. Null = mascotte di Frigolo sullo sfondo
  di `color`.

| Chiamata                                                                             | Cosa fa                                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `from('profiles').select().eq('id', userId).single()`                                | Il mio profilo (`completed_at` null = da completare)                                                       |
| `rpc('update_my_profile', { p_display_name, p_color, p_avatar_path })`               | Aggiorna il profilo (null = non cambiare, `p_avatar_path: ''` = togli la foto). Lo segna completo          |
| `from('households').select('*, household_members(user_id, joined_at, profiles(*))')` | Le mie liste con membri e profili (con `join_code`, `invite_token` e le loro scadenze)                     |
| `rpc('create_household', { p_name })`                                                | Nuova lista, ritorna l'id                                                                                  |
| `rpc('get_household_invite', { p_code })`                                            | Anteprima di un invito: `name`, `member_count`, `is_member`. Nessuna riga = codice sbagliato o scaduto     |
| `rpc('join_household', { p_code })`                                                  | Entra con il codice corto o il token del link. Ritorna l'id, o `null` se il codice è sbagliato o scaduto   |
| `rpc('rename_household', { p_household_id, p_name })`                                | Rinomina                                                                                                   |
| `rpc('rotate_join_code', { p_household_id })`                                        | Nuovo codice corto e nuovo token (7 giorni); i vecchi smettono subito di funzionare (= revoca dell'invito) |
| `rpc('leave_household', { p_household_id })`                                         | Esci. Ritorna `true` se eri l'ultimo membro: la lista è stata eliminata con tutti i dati                   |
| `rpc('delete_household', { p_household_id })`                                        | Elimina con tutti i dati, solo se sei l'unico membro                                                       |

**Inviti.** Ogni lista ha due segreti, generati con `gen_random_bytes` e validi 7 giorni:
il codice corto `join_code` (8 caratteri, da dettare o scrivere a mano; maiuscole, spazi e
trattini ignorati) e il token del link `invite_token` (22 caratteri, distingue maiuscole e
minuscole): `https://<app>/invito/<invite_token>`. Il frontend conserva il token durante
registrazione e conferma email, poi chiama `join_household`. Dopo 10 tentativi falliti in
un'ora (o 30 in un giorno) `join_household` e `get_household_invite` rispondono con
errore HTTP 429 (codice `PT429`, "Troppi tentativi, riprova più tardi") per qualunque
codice. L'anteprima non restituisce l'id della lista.

**Limiti.** 2 liste per utente, 5 persone per lista, 500 prodotti creati e 300 prodotti in
lista per lista, 30 spese al giorno per lista, 300 prodotti per spesa, 5 foto per utente; testi con
lunghezza massima (`unit` 10, supermercati 40, `quantity` fino a 9999). Una lista che resta
senza membri (anche per account cancellati) viene eliminata. Realtime: `profiles` è nella
pubblicazione (gli eventi rispettano la RLS).

**Errori.** Ogni errore delle RPC e delle quote ha in `hint` una chiave stabile: il
frontend deve riconoscere gli errori da quella, non dal testo (che può cambiare).

| `hint`              | Quando                                                       | HTTP |
| ------------------- | ------------------------------------------------------------ | ---- |
| `lists_limit`       | Hai già 2 liste (crea o entra)                               | 400  |
| `members_limit`     | La lista ha già 5 persone                                    | 400  |
| `rate_limited`      | Troppi codici sbagliati (10 in un'ora o 30 in un giorno)     | 429  |
| `use_post`          | Richiesta non in POST (`supabase.rpc` usa già POST)          | 405  |
| `not_member`        | Non fai parte della lista                                    | 403  |
| `has_other_people`  | Eliminare una lista con altre persone (si può solo lasciare) | 400  |
| `not_found`         | Lista o profilo non trovati                                  | 400  |
| `not_authenticated` | Sessione mancante                                            | 403  |
| `items_quota`       | 500 prodotti creati nella lista                              | 400  |
| `entries_quota`     | 300 prodotti in lista                                        | 400  |
| `trips_quota`       | 30 spese in un giorno                                        | 400  |
| `purchases_quota`   | 300 prodotti in una spesa                                    | 400  |

**Supermercati.** Le liste nuove partono con Lidl, Eurospin, Conad, Coop, Carrefour, MD e
Mercato (default di `households.stores`, uguale a `DEFAULT_STORES` del frontend); le liste
esistenti tengono i loro.

**Foto.** Al massimo 5 file nella propria cartella: il frontend usa nomi con uuid e
cancella la foto precedente. I file non più usati da nessuno si elencano con
`avatar_orphans()` e si cancellano con `node scripts/cleanup-avatar-orphans.mjs`
(`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nell'ambiente; senza `--apply` conta e
basta).

Le colonne `display_name`, `color` e `avatar_url` di `household_members` sono deprecate:
restano allineate al profilo da trigger finché il frontend in produzione le usa (in
`avatar_url` c'è l'URL completo ricostruito dal percorso), poi una migration futura le
toglierà.

## Suggerimenti

La sezione "Suggeriti per te" della home è calcolata nel client da
`src/features/suggestions/engine.ts`, una funzione pura coperta da test. Regole:

- stagionalità (peso 1.0): prodotti con il mese corrente in `season_months`, con bonus
  se già comprati almeno una volta;
- ricorrenza (peso 1.5): con almeno 3 acquisti, quando sono passati almeno l'80% dei
  giorni dell'intervallo medio tra un acquisto e l'altro;
- frequenza recente (peso 1.0): almeno 2 acquisti negli ultimi 60 giorni.

Mai suggeriti: prodotti già in lista o nel carrello, archiviati, o comprati troppo di
recente rispetto al proprio ritmo. Al massimo 9 suggerimenti e non più di 3 per
categoria. Il motivo ("Di solito ogni 7 giorni", "Di stagione a ottobre")
si legge tenendo premuta la tile.

## Offline e sincronizzazione

- **Realtime**: ogni telefono è iscritto ai cambiamenti di `list_entries`, `items`,
  `household_members` e `households` della lista aperta (il canale cambia con la lista),
  più `profiles` (nome, foto, colore) e le proprie righe di `household_members` (entrate
  e uscite da un altro telefono): se una persona aggiunge il latte, sugli altri telefoni
  compare entro un secondo.
- **Cache persistente**: la cache di TanStack Query vive anche su IndexedDB (7 giorni),
  quindi catalogo e lista si leggono anche senza rete.
- **Coda offline**: le modifiche alla lista fatte senza rete restano visibili
  (optimistic update), vengono salvate su IndexedDB e inviate al ritorno online, anche
  dopo aver chiuso e riaperto l'app. Un banner in alto lo segnala.
- **Service worker** (Workbox): app shell e font in precache, `NetworkFirst` per le letture
  Supabase. I font (Lato e Playfair Display) arrivano dai pacchetti `@fontsource`, serviti dall'app: nessuna richiesta a Google. Gli aggiornamenti non si installano da soli: si
  applicano dal bottone "Aggiorna" in Impostazioni.
- **Uscita dall'account**: "Esci" (e ogni fine sessione) cancella dal dispositivo la cache
  di TanStack Query su IndexedDB, le modifiche offline in attesa e la cache `supabase-rest`
  del service worker (`src/lib/localData.ts`).
- **Installazione**: manifest con icone (192, 512, maskable), icona e splash screen iOS,
  invito a installare dalla seconda sessione (su iOS spiega il gesto manuale).

Le icone e le splash si rigenerano con `node scripts/generate-icons.mjs`.

## Deploy su Vercel

Il repository è pronto per Vercel (`vercel.json`: build con pnpm, rewrite SPA, `sw.js`
mai in cache, asset immutabili).

1. Su [vercel.com/new](https://vercel.com/new) importa il repository GitHub
   `dascanfe/frigolo`. Framework: Vite (rilevato da solo).
2. In **Environment Variables** aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   con gli stessi valori del tuo `.env`.
3. Deploy. Ogni push su `main` rideploya.

Dopo il primo deploy, se il dominio non è `frigolo-app.vercel.app`, aggiorna `site_url` e
`additional_redirect_urls` in `supabase/config.toml` e lancia `supabase config push`:
servono al link "password dimenticata".

Le registrazioni sono chiuse (`enable_signup = false` in `[auth]` e `[auth.email]`,
già pushato): esistono solo i due account di casa. Per aprirle di nuovo, ad esempio per
cambiare email, basta rimettere `true` e lanciare `supabase config push`.

## Keep-alive di Supabase

Sul piano Free un progetto senza richieste per 7 giorni va in pausa. Il workflow
`.github/workflows/keepalive.yml` chiama `rpc/ping` ogni due giorni (secret `SUPABASE_URL` e
`SUPABASE_ANON_KEY` nel repository GitHub) e si può lanciare a mano da Actions.

## Spesa finita e salvataggio automatico

Toccare un articolo in lista lo mette "Nel carrello"; solo questi diventano acquisti (gli
articoli tolti dalla lista non contano mai). Il bottone "Spesa finita" chiude subito la
spesa. Se nessuno lo preme, ogni notte alle 01:00 UTC (02:00/03:00 in Italia) il job
`frigolo-auto-complete-trips` di pg_cron chiama `auto_complete_trips()`: una spesa per
casa, giorno e supermercato, con la data del tocco. Gli articoli "Ovunque" vanno nel
supermercato più frequente del giorno. Le spese automatiche hanno `completed_by` nullo
("salvata da sola"). In Analitiche, "Le spese" (divise per mese) permette di togliere un
articolo da una spesa o di eliminarla. Un secondo job tiene una settimana di log di pg_cron.

## Temi

In Impostazioni si sceglie tra sei temi, ognuno di una famiglia di colore diversa:
Autunno (arancio, il default), Basilico (verde), Mare (blu), Prugna (viola), Lampone
(rosso lampone) e Liquirizia (grafite con accento rosso). Le palette stanno in
`src/lib/theme.ts` (unica fonte, anche per le anteprime) e vengono scritte come variabili
CSS su `<html>`; il tema Autunno è quello di `tokens.css`. Cambiano fondi, bordi, tile,
accento e inchiostro; i colori delle categorie e dei membri restano fissi. I contrasti di
ogni tema sono verificati da `theme.test.ts`. La scelta è salvata sul dispositivo.

## Qualità

- `pnpm lint`, `pnpm typecheck` e `pnpm test` (58 test: ricerca fuzzy, motore dei
  suggerimenti, serie temporali, contrasti dei temi, icone del catalogo, campi di testo
  a 16px per evitare lo zoom automatico di iOS, codici d'invito, lista aperta, errori
  delle quote) girano puliti.
- Lighthouse 13 sulla build di produzione (mobile simulato): accessibilità 100, best
  practices 100, performance 83 (bundle iniziale ~215 kB gzip: React, Supabase Auth,
  Router; dal secondo avvio il service worker serve tutto dalla cache). La categoria PWA
  non esiste più in Lighthouse: manifest, icone e service worker sono verificati a mano.
- Ogni tile ha un `aria-label` completo ("Latte, in lista, tocca per segnarlo come
  preso"), il focus da tastiera è sempre visibile, i tre stati della tile si distinguono
  anche senza colore (spunta e barratura). I colori di categoria della palette non
  superano da soli il test di contrasto: nei separatori e nei grafici sono sempre
  accompagnati da icona e testo.

## Script disponibili

| Comando             | Cosa fa                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Server di sviluppo con hot reload                |
| `pnpm build`        | Type check e build di produzione in `dist/`      |
| `pnpm preview`      | Serve la build di produzione in locale           |
| `pnpm lint`         | ESLint su tutto il progetto                      |
| `pnpm format`       | Formatta i file con Prettier                     |
| `pnpm format:check` | Verifica la formattazione senza modificare nulla |
| `pnpm typecheck`    | Solo type check TypeScript                       |
| `pnpm test`         | Test Vitest (suggerimenti, ricerca fuzzy)        |
| `pnpm test:watch`   | Test in modalità watch                           |

## Struttura del progetto

```
index.html            Entry point HTML, font e meta PWA
vite.config.ts        Vite, Tailwind, PWA e Vitest
public/icons/         Icone PWA (generate in Fase 8)
supabase/
  migrations/         Migration SQL numerate
  seed.sql            Categorie e catalogo base
src/
  main.tsx            Bootstrap React
  App.tsx             Root dell'app
  router.tsx          Route dell'app
  styles/             tokens.css (design token) e global.css
  lib/                Client Supabase, query client, coda offline, icone, formattazione
  types/              Tipi generati da Supabase e tipi di dominio
  components/         Componenti UI condivisi (tile, griglia, bottom nav, ...)
  features/           Una cartella per area funzionale (list, catalog, search, ...)
```

## Convenzioni

- TypeScript strict, nessun `any`.
- Tutta l'interfaccia è in italiano.
- Nei testi si usa sempre il trattino semplice `-`, mai il trattino lungo.
- Commit atomici in stile Conventional Commits (`feat:`, `fix:`, `chore:`, ...).
- Nessuna chiave segreta nel repository: `.env` è ignorato da git, esiste solo `.env.example`.

## Fasi di sviluppo

| Fase | Contenuto                                       | Stato      |
| ---- | ----------------------------------------------- | ---------- |
| 0    | Setup progetto, tooling, repo                   | Completata |
| 1    | Migration, seed, tipi TypeScript                | Completata |
| 2    | Design system e componenti base                 | Completata |
| 3    | Auth con magic link e household                 | Completata |
| 4    | Lista, catalogo, toggle, completamento spesa    | Completata |
| 5    | Ricerca fuzzy e prodotti custom                 | Completata |
| 6    | Motore dei suggerimenti                         | Completata |
| 7    | Analitiche                                      | Completata |
| 8    | Realtime, offline, PWA                          | Completata |
| 9    | Impostazioni, export CSV, accessibilità, deploy | Completata |
