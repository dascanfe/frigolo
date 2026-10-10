# Quaderno di Basilio

Aggiornato da Basilio alla fine di ogni incarico. Il più recente in alto.

## Stato

Supabase in locale attivo e documentato (#1). Profili (#2), liste multiple (#3, backend),
inviti sicuri, limiti e quote, export e cancellazione account (#9, backend), email in
italiano e configurazione per l'apertura (#7) nel branch `basilio/profili-liste` (PR #16,
migration 0018-0023 e edge function `delete-account`). La 0017 è già in produzione.
Niente del resto è applicato in produzione.

## Da fare

- Dopo la revisione di Aglio e l'ok di Daniele: i passi di "Apertura al pubblico" qui sotto.
- Quando il frontend nuovo di Fragola è in produzione e nessuno usa più le colonne
  per-membro: migration che toglie `display_name`, `color`, `avatar_url` da
  `household_members` e i trigger di allineamento.
- Con Pepe: mostrare `invite_attempts_daily` (tentativi falliti per giorno) nel cruscotto,
  con una soglia di allarme; aggiungere la dimensione del database.
- Se un giorno ci sarà un dominio personalizzato per Supabase: aggiungerlo in
  `avatar_storage_hosts()` (0018) e negli origin della edge function.
- Valutare con Fragola il link di conferma con `{{ .TokenHash }}` verso `/auth/confirm`
  (funziona da qualunque browser; nota di Zenzero in `docs/comunicazione/email.md`).

## Apertura al pubblico (ordine dei passi)

Ogni passo che tocca la produzione si fa solo con l'ok di Daniele. Le registrazioni restano
chiuse fino al passo 9.

1. **Database.** `supabase db push` (migration 0018-0023). Compatibile con il frontend in
   produzione: si può fare prima del frontend nuovo. Verifica: profili dei 4 utenti, liste
   intatte, `supabase/checks/profili_liste.sql` non si lancia in produzione (crea utenti).
2. **Edge function.** `supabase functions deploy delete-account`.
3. **Foto orfane.** `node scripts/cleanup-avatar-orphans.mjs` con URL e service role di
   produzione nell'ambiente (prima senza `--apply` per contare, poi con `--apply`).
4. **Dominio.** Daniele: CNAME `frigolo` su Aruba verso Vercel, dominio aggiunto al
   progetto `frigolo-app`. Controllo: `https://frigolo.dascanfe.com/mascot.png` risponde
   (serve alle email) e l'app si apre.
5. **Frontend.** Merge della PR di Fragola (deploy su Vercel). Deve già mandare il token
   Turnstile a `signUp`, `signInWithPassword` e `resetPasswordForEmail`: finché il captcha
   è spento il token viene ignorato, quindi l'ordine è sicuro.
6. **SMTP.** Daniele nel pannello (vedi sotto). Prova: "Password dimenticata" verso una sua
   casella; mittente "Frigolo <frigolo@dascanfe.com>", SPF/DKIM pass, posta in arrivo.
7. **Configurazione Auth.** `supabase config diff --project-ref egvodwvnralxttxiovau`,
   controllo che compaiano solo le 10 modifiche attese (sotto), poi `supabase config push`.
   Da qui email in italiano, conferma dell'email, password da 10 caratteri, `site_url`
   nuovo.
8. **Captcha.** Daniele nel pannello (vedi sotto). Prova: accesso dall'app con un account
   esistente; con il captcha acceso e il widget nel frontend deve funzionare.
9. **Apertura.** In `config.toml` `[auth] enable_signup = true`, commit, `config diff` (una
   sola modifica), `config push`. Prova completa: registrazione con una casella di Daniele,
   email di conferma, onboarding (nome, foto, colore), prima lista, invito via link a un
   secondo account, export dati, cancellazione dell'account di prova.
10. **Dopo.** Controllo giornaliero la prima settimana: `invite_attempts_daily`, dimensione
    del database, log di Auth.

**Le 10 modifiche attese nel `config diff` del passo 7** (provato oggi, sola lettura):
`site_url` e `additional_redirect_urls` (frigolo.dascanfe.com, vecchio dominio, localhost),
`enable_confirmations` e `secure_password_change` a true, `minimum_password_length` 10,
oggetti dei template `confirmation`, `recovery`, `email_change`, notifica
`password_changed` attiva con il suo oggetto. Il diff mostra anche due voci "remote_only"
(SMS Twilio, trasformazione immagini) che il push non tocca. `rate_limit.email_sent` non
viene confrontato: per sicurezza si imposta anche dal pannello.

## Cosa fa Daniele nel pannello

**Resend:** crea una API key nuova con permesso "Sending access" solo per `dascanfe.com`.

**Supabase, Authentication > Emails > SMTP Settings** ("Enable custom SMTP"):

| Campo                           | Valore                 |
| ------------------------------- | ---------------------- |
| Sender email                    | `frigolo@dascanfe.com` |
| Sender name                     | `Frigolo`              |
| Host                            | `smtp.resend.com`      |
| Port                            | `465`                  |
| Username                        | `resend`               |
| Password                        | la API key di Resend   |
| Minimum interval between emails | `60` secondi           |

**Supabase, Authentication > Rate Limits:** email inviate all'ora = 30.

**Cloudflare, Turnstile:** nel widget con site key `0x4AAAAAAFTAwpin-ddEAezA` gli hostname
`frigolo.dascanfe.com` e `frigolo-app.vercel.app` (per lo sviluppo si usano le chiavi di
test, non serve localhost). Modalità "Managed". Copia la **secret key**.

**Supabase, Authentication > Attack Protection:** "Enable Captcha protection", provider
Cloudflare Turnstile, incolla la secret key. Solo al passo 8.

**Password compromesse:** "Leaked password protection" è solo sui piani a pagamento; sul
Free si compensa con il minimo di 10 caratteri (già nel file).

Le chiavi (Resend, secret di Turnstile) vanno solo nel pannello: mai nel repo, nei comandi o
in chat.

## SMTP e captcha: perché dal pannello

`supabase config push` (CLI 2.117) applica solo le proprietà che `config.toml` dichiara;
quelle non dichiarate restano come sono in produzione. Le sezioni `[auth.email.smtp]` e
`[auth.captcha]` restano commentate, con un avviso: un push non le tocca. Se fossero
scommentate, `enabled = false` spegnerebbe SMTP o captcha, e `pass`/`secret` con
`env(...)` richiederebbero la chiave nell'ambiente a ogni push, col rischio di scriverla
vuota. Prima di ogni push si guarda `supabase config diff`: non devono comparire voci
`smtp` o `captcha`.

**Captcha in locale** (provato): si scommenta `[auth.captcha]` solo sul proprio computer,
senza committare, con `provider = "turnstile"` e la secret di test di Cloudflare
`1x0000000000000000000000000000000AA` (accetta sempre); nel frontend la site key di test
`1x00000000000000000000AA`; poi `supabase stop` e `supabase start`. Senza token l'accesso
risponde `captcha_failed`, con il token di test `XXXX.DUMMY.TOKEN.XXXX` passa. Alla fine si
rimette il file com'era e si riavvia.

## Domande aperte per Daniele

- Password minima di 10 caratteri per i nuovi account e i cambi password: va bene?
  (I 4 account attuali continuano ad accedere con la password che hanno.)

## Diario

### 2026-10-10 - Terzo giro: limiti, email, captcha, account

- Unito `main` (0017 in produzione, documenti di Zenzero). Limiti di Daniele: 2 liste per
  utente, 5 persone per lista. Errori con chiave stabile in `hint` e testi dal glossario.
- 0021: supermercati di partenza generici (come `DEFAULT_STORES` di Fragola), liste
  esistenti intatte. 0022: `export_my_data`. Edge function `delete-account` (foto e
  account). 0023: massimo 5 foto per utente, `avatar_orphans` e script di pulizia.
- Rafforzati i controlli su inviti e quote dopo la revisione di Aglio; contatore
  giornaliero dei tentativi falliti per il cruscotto.
- Email: 4 template HTML da `docs/comunicazione/email.md`; `config.toml` pronto per
  l'apertura (conferma email, password 10, `site_url` nuovo, 30 email all'ora), SMTP e
  captcha dal pannello, registrazioni ancora chiuse. `config diff` contro la produzione
  (sola lettura) letto e riassunto sopra.
- Verifiche locali: catena 0001-0023 da zero, migrazione dei dati da uno stato 0017,
  idempotenza, `profili_liste.sql`, `api_e2e.mjs` (nuovo: inviti via API, export,
  cancellazione account), email di recupero letta in Mailpit, captcha con le chiavi di
  test. DB locale lasciato con tutte le migration e gli account di `seed_dev.sql`.

### 2026-10-10 - Secondo giro sulla PR #16 (revisione di Aglio)

- Unita la correzione urgente (`0017_security_hotfix`), migration rinumerate in 0018 e
  0019, nuova 0020. Catena 0001-0020 provata da zero con `supabase db reset` e migrazione
  dei dati da uno stato 0017 (`dati_pre_0018.sql`, con foto dall'host del progetto e da un
  host esterno). Migration rilanciate: idempotenti.
- R1: nel profilo solo il percorso della foto nel bucket (`avatar_path`), l'URL lo fa il
  client; nella colonna deprecata solo URL dello Storage del progetto. Scelto il percorso
  invece dell'elenco di host perché l'host smette di essere un dato scritto dall'utente.
- Colore: lista chiusa uguale a `MEMBER_COLORS`, obbligatorio, a caso se non scelto
  (avatar di default = mascotte sul colore, richiesta di Daniele).
- R2/M1: codice corto e token del link da `gen_random_bytes`, scadenza 7 giorni, limite di
  10 tentativi falliti all'ora e 30 al giorno con errore 429 uniforme, pulizia notturna con
  pg_cron. R4 limite delle liste atomico, R5 anteprima senza id. M2 era già chiuso.
- M4: lunghezze massime e quote per lista (solo scritture dei client). M5/R3: niente
  permessi di default ad anon in public.
- `seed_dev.sql`: 3 account locali per lo sviluppo. Il DB locale è lasciato con tutte le
  migration e questi account.
- Verifiche: `profili_liste.sql` (anche regressioni A1, A2, R1, R2, R5, limiti, quote, M5),
  giro end-to-end con supabase-js e login reale (upload della foto, URL pubblico, invito via
  link). `pnpm lint`, `typecheck`, `test` puliti.

### 2026-10-10 - Supabase in locale, profili, liste multiple (#1, #2, #3)

- `supabase start` con Docker: migration 0001-0016 e seed applicati, 14 categorie, 234
  prodotti; pg_cron funziona anche in locale (job di prova eseguito ogni 2 secondi).
  Flusso documentato in `docs/SVILUPPO.md` (avvio, reset, reset fino a una versione, tipi).
- Profili: tabella `profiles` creata da trigger su `auth.users` (scelto il trigger e non la
  RPC: ogni utente ha sempre un profilo, qualunque sia il modo di registrarsi). Nome da
  `raw_user_meta_data.display_name`, altrimenti "Utente" con `completed_at` null (profilo
  da completare). Migrazione dalla riga membro più vecchia, lele/pipi a null. Colonne
  per-membro deprecate e allineate in entrambe le direzioni da trigger, così l'app attuale
  continua a funzionare.
- Liste: RPC senza il vincolo "una casa per utente", nuove RPC per invito, rinomina, uscita
  ed eliminazione, `join_code` scrivibile solo con `rotate_join_code`, liste vuote eliminate
  da trigger.
- Bug trovato in prova e corretto: `leave_household` in invoker non vedeva più la lista
  dopo l'uscita e rispondeva sempre "eliminata".
