# Revisione della PR #16 (profili e liste multiple)

Autore: Aglio (QA, sicurezza e privacy). Ultimo aggiornamento: 2026-10-10 (secondo giro).

Questo file riporta solo il verdetto e i punti già corretti nel branch. I punti ancora aperti
sono stati segnalati al PM a parte e saranno descritti qui solo dopo la correzione in
produzione.

## Verdetto

| Cosa                                                               | Verdetto                     |
| ------------------------------------------------------------------ | ---------------------------- |
| Correzione urgente `0017_security_hotfix` (PR #17)                 | **Approvata**                |
| PR #16 (`0018_profiles`, `0019_multi_lists`, `0020_limits_quotas`) | **Approvata con correzioni** |

Ordine di rilascio: prima la `0017` da sola, poi `0018`-`0020`. La PR #16 si può unire dopo le
correzioni segnalate al PM e una verifica di Aglio.

## Come è stato verificato

- Lettura delle migration `0017`-`0020`, di `supabase/checks/` e del quaderno di Basilio
  (compreso il piano SMTP).
- Prove su Supabase locale (catena `0001`-`0020`, utenti di `seed_dev.sql`), sempre dentro
  transazioni annullate, impersonando gli utenti come fa PostgREST; alcune chiamate
  direttamente all'API locale.
- Script di Basilio `supabase/checks/profili_liste.sql`: tutti i controlli passati.

## Punti corretti nel branch (verificati)

| ID      | Cosa                                                                                                                     | Esito                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| A1      | Righe membro: aggiornabili solo nome, colore, foto (correzione urgente unita nel branch)                                 | Ok                                     |
| A2      | Bucket `avatars`: niente elenco pubblico, ognuno vede solo la propria cartella                                           | Ok                                     |
| R1      | Foto profilo salvata come percorso nel bucket (`avatar_path`); la colonna deprecata accetta solo lo Storage del progetto | Ok                                     |
| R2 / M1 | Codici e token da `gen_random_bytes`, scadenza 7 giorni, rinnovo con `rotate_join_code`, limite ai tentativi falliti     | Ok, con una correzione segnalata al PM |
| R3 / M5 | Permessi di default di `postgres` in `public` senza `anon`; funzioni nuove senza `PUBLIC`; solo `ping` per `anon`        | Ok                                     |
| R4      | Limite delle 50 liste atomico (blocco sulla riga del profilo)                                                            | Ok                                     |
| R5      | Anteprima dell'invito senza id della lista; appartenenza controllata prima del blocco                                    | Ok                                     |
| R7      | Regressioni per A1, A2, R1, R2, R5, limiti, quote, M5 e colori nello script di verifica                                  | Ok                                     |
| M2      | `join_code` non scrivibile dai client                                                                                    | Ok                                     |
| M4      | Lunghezze massime dei testi e quote per lista                                                                            | Ok, con correzioni segnalate al PM     |

Altre verifiche passate:

- `profiles`: visibili solo il proprio e quelli di chi condivide una lista; in update solo
  `display_name`, `avatar_path`, `color` (colore da lista chiusa); niente insert né delete.
- Percorsi della foto fuori dalla propria cartella, con sottocartelle, `..` o URL completi:
  rifiutati.
- Codici: formato e distribuzione dei caratteri corretti (prova su 20.000 codici); token di 22
  caratteri base64url; codice scaduto rifiutato senza errore distinto.
- Limiti: 51esima lista e 21esimo membro rifiutati.
- `invite_attempts`: nessun accesso dai client; funzioni di supporto non eseguibili dai client.
- Job pg_cron `frigolo-invite-attempts-cleanup`: idempotente, pulizia coerente con la finestra
  di 24 ore del limite.
- Piano SMTP: configurazione solo dal pannello, sezione `[auth.email.smtp]` commentata e
  `supabase config diff` prima di ogni push. Così la chiave di Resend non passa dal repo e un
  `config push` non tocca lo SMTP. Da ricordare: `email_sent = 2` in `config.toml` va portato a
  30 nello stesso momento in cui si cambia il pannello.

## Prima revisione

Il primo giro (stesso giorno) aveva trovato R0-R7: sono tutti corretti nel branch tranne R6
(file della foto alla cancellazione dell'account), rimandato alla #9.
