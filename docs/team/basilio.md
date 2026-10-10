# Quaderno di Basilio

Aggiornato da Basilio alla fine di ogni incarico. Il più recente in alto.

## Stato

Supabase in locale attivo e documentato (#1). Profili (#2), backend delle liste multiple
(#3) e correzioni della revisione di Aglio pronti nel branch `basilio/profili-liste`
(migration 0018, 0019, 0020, dopo la correzione urgente 0017 del PM), provati solo in
locale. Piano SMTP (#7) pronto, niente applicato.

## Da fare

- Dopo la nuova revisione di Aglio e l'ok di Daniele: preparare per il PM il comando per la
  produzione (`supabase db push`, prima la 0017 da sola, poi 0018-0020) e la verifica
  successiva.
- SMTP (#7): vedi il piano qui sotto, poi M3 (conferma email, captcha, password).
- Quando il frontend nuovo di Fragola è in produzione e nessuno usa più le colonne
  per-membro: migration che toglie `display_name`, `color`, `avatar_url` da
  `household_members` e i trigger di allineamento.
- `delete_my_account` (#9) deve cancellare anche i file in `avatars/<user_id>/` (R6, M7).
- Quota sui file del bucket `avatars` per utente (oggi solo 2 MB a file, numero libero).
- Se un giorno ci sarà un dominio personalizzato per Supabase: aggiungerlo in
  `avatar_storage_hosts()` (0018).

## Piano SMTP (#7), da approvare

Mittente "Frigolo <frigolo@dascanfe.com>", dominio già verificato su Resend.

**Come si comporta `supabase config push`** (CLI 2.117): applica solo le proprietà che
`config.toml` dichiara, quelle non dichiarate restano come sono in produzione. Oggi la
sezione `[auth.email.smtp]` è tutta commentata, quindi un push non tocca lo SMTP. Se invece
la si scommentasse con `enabled = false`, il push spegnerebbe lo SMTP del pannello; con
`enabled = true` e `pass = "env(...)"` servirebbe la chiave nell'ambiente a ogni push,
altrimenti si rischia di scriverla vuota.

**Strada sicura proposta:** lo SMTP si configura **solo dal pannello** e in `config.toml`
la sezione `[auth.email.smtp]` resta commentata, con un avviso sopra ("gestito dal pannello:
non scommentare, un config push lo sovrascriverebbe"). La chiave di Resend non passa mai dal
repo né dai comandi. Prima di ogni `config push` si lancia `supabase config diff` e si
controlla che non compaiano voci `smtp`.

**Cosa incolla Daniele nel pannello** (Authentication > Emails > SMTP Settings, "Enable
custom SMTP"):

| Campo                           | Valore                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| Sender email                    | `frigolo@dascanfe.com`                                                      |
| Sender name                     | `Frigolo`                                                                   |
| Host                            | `smtp.resend.com`                                                           |
| Port                            | `465`                                                                       |
| Username                        | `resend`                                                                    |
| Password                        | una API key di Resend nuova, permesso "Sending access", solo `dascanfe.com` |
| Minimum interval between emails | `60` secondi (come `max_frequency` di oggi)                                 |

Poi in Authentication > Rate Limits: email inviate all'ora da 2 a **30**.

**Cosa va in `config.toml`** (nello stesso PR della conferma email, M3):

- l'avviso sopra `[auth.email.smtp]`, sezione sempre commentata;
- `[auth.rate_limit] email_sent = 30`: oggi il file dichiara `2` e un push riporterebbe il
  limite a 2 email all'ora anche con Resend attivo;
- `[auth.email] enable_confirmations = true` quando si attiva la conferma (M3), insieme ai
  template in italiano (testi di Zenzero) in `supabase/templates/`, dichiarati con
  `content_path`: i template si possono gestire nel file perché non contengono segreti.

In locale non cambia nulla: le email finiscono in Mailpit (`http://127.0.0.1:54324`).

**Prova dopo l'attivazione:** "password dimenticata" verso una casella di Daniele, controllo
mittente, SPF/DKIM "pass" nelle intestazioni e consegna in posta in arrivo, non spam.

## Domande aperte per Daniele

- Limiti: 50 liste per utente e 20 membri per lista vanno bene? (Aglio nell'audit
  suggeriva 20 liste.)
- Lasciare una lista da ultimo membro la elimina con tutti i dati (il frontend avvisa).
  Preferisci invece che venga rifiutato finché non la elimini esplicitamente?
- Inviti validi 7 giorni: va bene, o preferisci più lunghi?

## Diario

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
  da completare). Migrazione dalla riga membro più vecchia, avatar-a/avatar-b a null. Colonne
  per-membro deprecate e allineate in entrambe le direzioni da trigger, così l'app attuale
  continua a funzionare.
- Liste: RPC senza il vincolo "una casa per utente", nuove RPC per invito, rinomina, uscita
  ed eliminazione, `join_code` scrivibile solo con `rotate_join_code`, liste vuote eliminate
  da trigger.
- Bug trovato in prova e corretto: `leave_household` in invoker non vedeva più la lista
  dopo l'uscita e rispondeva sempre "eliminata".
