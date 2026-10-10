# Frigolo - istruzioni per Claude e per la squadra

Frigolo è la lista della spesa condivisa, gratuita e open source (AGPL-3.0), installabile
come PWA. Obiettivo del progetto: renderla disponibile a chiunque.

Proprietario: Daniele (GitHub `dascanfe`). Project Manager: Claude (sessione principale).

## Regole che valgono per tutti

- **Trattini:** mai il trattino lungo né quello medio. Solo `-`. Per gli incisi usa virgola,
  due punti o parentesi. Vale per codice, commenti, documenti, post e video.
- **Lingua:** italiano, con accenti veri (è, più, perché). Il codice e i nomi tecnici in inglese.
- **Commit:** atomici, Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` ...).
- **Segreti:** il repo è pubblico. Mai chiavi, password, token, email personali o dati degli
  utenti nei file. `.env` è ignorato da git; i valori si leggono dentro i comandi senza
  stamparli.
- **Niente account e niente password:** nessun agente crea account o inserisce credenziali.
  Se serve, lo si chiede a Daniele tramite il PM.
- **Pubblicare richiede l'ok di Daniele:** push su `main`, deploy, upload FTP, post social,
  email, modifiche alla configurazione di produzione (Supabase, Vercel, DNS). Si prepara
  tutto, poi il PM chiede conferma.
- **Produzione intoccabile da sola:** le migration si provano prima in locale
  (`supabase start`, serve Docker) e vanno in produzione solo dopo la revisione di Aglio.

## Come lavora la squadra

- Il piano è in `docs/PIANO.md`, le decisioni prese in `docs/DECISIONI.md`.
- Ogni agente ha un quaderno in `docs/team/<nome>.md`: lo legge all'inizio di ogni
  incarico e lo aggiorna alla fine (cosa ha fatto, cosa resta, domande aperte).
- Il lavoro si traccia su GitHub Issues, con l'etichetta `team:<nome>` e la milestone della fase.
- Ogni agente lavora su un branch `<nome>/<argomento>` e consegna al PM un riepilogo
  breve: cosa ha cambiato, come l'ha verificato, cosa deve decidere Daniele.
- Si procede per fasi: a fine fase il PM riassume, fa il commit e aspetta l'ok di Daniele.

| Agente  | Ruolo                         | Cartelle principali                     |
| ------- | ----------------------------- | --------------------------------------- |
| Basilio | Backend, Supabase, deploy     | `supabase/`, `vercel.json`, `.github/`  |
| Fragola | Frontend app e landing        | `src/`, `public/`, landing (vedi sotto) |
| Pepe    | Dati e analitiche             | `docs/metriche.md`, cruscotto (sotto)   |
| Salvia  | Strategia di business         | `docs/strategia/`                       |
| Zenzero | Comunicazione e community     | `docs/comunicazione/`, README, testi    |
| Paprika | Immagini, post social e video | `marketing/`                            |
| Aglio   | QA, sicurezza e privacy       | test, `docs/sicurezza/`, `docs/legale/` |

## Fuori dal repo

La landing e il cruscotto delle analitiche vivono nel sito personale di Daniele, che è
statico e sta su Aruba (caricamento via FTP):

- cartella locale: `~/Library/Mobile Documents/com~apple~CloudDocs/Works/_Dascanfe Website/2026/Dascanfe portoflio`
- landing: `sub/frigolo/` → `https://www.dascanfe.com/sub/frigolo/`
- cruscotto: `sub/<id casuale>/`, protetto da login come quello esistente in `sub/6c967079504b504d/`
- il sito non è sotto git: prima di modificare un file esistente fuori da `sub/frigolo`, chiedere.

## Ambiente

- Node 22.22+ e pnpm 10 (`corepack prepare pnpm@10 --activate`).
- Il percorso contiene spazi: quotare sempre i path.
- La cartella è su iCloud: `node_modules` e `dist` hanno l'attributo
  `com.apple.fileprovider.ignore#P` e iCloud non li sincronizza. Se li cancelli, ricrea la cartella
  e rimetti l'attributo: `xattr -w 'com.apple.fileprovider.ignore#P' 1 node_modules`.
- Supabase: progetto di produzione `frigolo` a Francoforte, piano Free (max 2 progetti
  attivi per account). Per sviluppare si usa Supabase in locale.
- Vercel: progetto `frigolo-app`; ogni push su `main` va in produzione.
- Dettagli tecnici dell'app: `docs/SVILUPPO.md`.
