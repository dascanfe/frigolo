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
| `seed.sql`                 | Categorie e catalogo base italiano                                  |

### Opzione A: Supabase CLI (consigliata)

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

### Opzione B: SQL editor del dashboard

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

Atteso: 14 categorie, 234 prodotti, 13 policy.

## Autenticazione

Accesso con **email e password** (Supabase Auth). L'app è pensata per due persone, quindi
la registrazione non richiede la conferma dell'email: ci si registra dall'app e si entra
subito. La protezione vera è il codice di invito della casa: senza quello un account non
vede nulla.

"Password dimenticata" invia un'email con un link (template standard di Supabase, in
inglese); il link va aperto nello stesso browser da cui è stato richiesto e porta alla
schermata "Nuova password". Il mailer integrato del piano Free consente al massimo 2 email
all'ora, più che sufficienti per questo uso.

Una volta creati i due account si può chiudere la registrazione impostando
`enable_signup = false` in `supabase/config.toml` e lanciando `supabase config push`.

Il primo accesso porta all'onboarding: si crea la casa (household) oppure si entra in
quella del partner con il codice di 8 caratteri mostrato nelle Impostazioni.

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
categoria. Il motivo ("Di solito lo comprate ogni 7 giorni", "Di stagione a ottobre")
si legge tenendo premuta la tile.

## Offline e sincronizzazione

- **Realtime**: ogni telefono è iscritto ai cambiamenti di `list_entries`, `items` e
  `household_members` del proprio household (Supabase Realtime): se una persona
  aggiunge il latte, sull'altro telefono compare entro un secondo.
- **Cache persistente**: la cache di TanStack Query vive anche su IndexedDB (7 giorni),
  quindi catalogo e lista si leggono anche senza rete.
- **Coda offline**: le modifiche alla lista fatte senza rete restano visibili
  (optimistic update), vengono salvate su IndexedDB e inviate al ritorno online, anche
  dopo aver chiuso e riaperto l'app. Un banner in alto lo segnala.
- **Service worker** (Workbox): app shell in precache, `NetworkFirst` per le letture
  Supabase, `CacheFirst` per i font. Gli aggiornamenti non si installano da soli: si
  applicano dal bottone "Aggiorna" in Impostazioni.
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

- `pnpm lint`, `pnpm typecheck` e `pnpm test` (41 test: ricerca fuzzy, motore dei
  suggerimenti, serie temporali, contrasti dei temi, icone del catalogo, campi di testo
  a 16px per evitare lo zoom automatico di iOS) girano puliti.
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
