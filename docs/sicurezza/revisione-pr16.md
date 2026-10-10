# Revisione della PR #16 (profili e liste multiple) e della correzione urgente

Autore: Aglio (QA, sicurezza e privacy). Data: 2026-10-10.
Oggetto: PR #16 di Basilio (branch `basilio/profili-liste`, migration `0017_profiles.sql` e
`0018_multi_lists.sql`, da rinumerare `0018` e `0019`) e correzione urgente del PM (branch
`fix/sicurezza-urgente`, `0017_security_hotfix.sql`).

## Verdetti

| Cosa                                      | Verdetto                     |
| ----------------------------------------- | ---------------------------- |
| Correzione urgente `0017_security_hotfix` | **Approvata**                |
| PR #16 (profili e liste multiple)         | **Approvata con correzioni** |

La correzione urgente chiude A1 e A2 e va in produzione **prima** della PR #16: nel branch di
Basilio A1 è ancora aperto (vedi sotto). Le due cose sono compatibili, in qualunque ordine.

La PR #16 si può unire dopo la correzione di **R1** (foto da host esterni). **R2** (forza bruta sui
codici) non blocca l'unione con le registrazioni chiuse, ma blocca l'apertura al pubblico come M1
dell'audit.

| ID  | Gravità | Problema                                                                               | Blocca                 |
| --- | ------- | -------------------------------------------------------------------------------------- | ---------------------- |
| R0  | Alta    | Nel branch della PR, A1 è ancora aperto (chiuso solo dalla correzione urgente)         | Sì, ordine di rilascio |
| R1  | Media   | `avatar_url` accetta qualsiasi host: la protezione dai pixel di tracciamento si aggira | Sì, l'unione           |
| R2  | Media   | Nessun limite ai tentativi su `get_household_invite` e `join_household`                | L'apertura (M1)        |
| R3  | Bassa   | Permessi di default di `public` invariati (M5): funzioni nuove eseguibili da `anon`    | No                     |
| R4  | Bassa   | Limite delle 50 liste non atomico (richieste in parallelo)                             | No                     |
| R5  | Bassa   | `get_household_invite` restituisce l'id della lista a chi non è membro                 | No                     |
| R6  | Bassa   | Foto in Storage non cancellate con l'account (M7 dell'audit, ora più evidente)         | No (con la #9)         |
| R7  | Bassa   | Verifiche di Basilio senza test di regressione per A1, R1 e i limiti                   | No                     |

## Come è stato verificato

- Lettura delle due migration della PR, della correzione urgente, delle migration `0001`, `0002`,
  `0003`, `0006` e del codice del frontend che scrive su `household_members`, `households` e
  Storage.
- Supabase locale (migration della PR applicate, dati finti: 4 utenti, 2 liste). Tutte le prove
  dentro `begin; ... rollback;`, impersonando gli utenti come fa PostgREST (ruolo `authenticated`
  e JWT nelle impostazioni di sessione). Il database è rimasto com'era (verificato alla fine).
- La correzione urgente applicata dentro la stessa transazione, dopo le migration di Basilio, per
  provare la compatibilità.
- Lo script di Basilio `supabase/checks/profili_liste.sql`: tutti i controlli passati.

## Cosa funziona (provato)

- `profiles`: RLS attiva, `anon` senza permessi; un utente vede solo il proprio profilo e quelli di
  chi condivide una lista con lui (provato prima e dopo un `join`). Niente insert né delete dai
  client; in update solo `display_name`, `avatar_url`, `color` del proprio profilo; `completed_at`,
  `id`, `created_at` protetti (grant e trigger).
- `households`: `join_code` non più scrivibile dai client (chiude M2); insert diretti su
  `households` e `household_members` bloccati dalla RLS.
- Liste altrui: `delete_household`, `leave_household`, `rotate_join_code`, `rename_household` su una
  lista di cui non si è membri danno errore; delete e update diretti toccano 0 righe.
  `delete_household` rifiuta se ci sono altri membri.
- Ultimo membro che esce, e cancellazione dell'account: la lista viene eliminata con voci e
  acquisti; nelle liste condivise restano gli altri membri e i dati, i riferimenti all'utente
  diventano nulli; nessuna riga con l'id dell'utente in `profiles`, `household_members`,
  `list_entries`, `purchases`.
- Limiti: la 51esima lista e il 21esimo membro vengono rifiutati.
- `get_household_invite` e `join_household` non eseguibili da `anon`; con codice sbagliato nessun
  dato.
- Trigger `security definer` (`handle_new_user`, `sync_profile_to_members`,
  `members_fill_from_profile`, `delete_empty_household`): tutti con `search_path = ''`, nessuno
  eseguibile dai client, nessuno prende id dal chiamante senza controllo. `sync_member_to_profile`
  è invoker e passa dalla policy di `profiles`: non si può modificare il profilo di un altro
  passando dalle righe membro. Nessuna escalation trovata.
- Foto lele/pipi e URL arbitrari (non Storage) rifiutati; un URL non valido scritto dal vecchio
  client sulla riga membro viene azzerato.

## Correzione urgente (`0017_security_hotfix.sql`): approvata

**A1.** Dopo la correzione, l'update di `household_id` o `user_id` sulla propria riga membro dà
`permission denied`, sia con filtro sia senza. Le colonne aggiornabili da `authenticated` sono
solo `display_name`, `color`, `avatar_url`.

Nota sull'audit: la riproduzione di A1 descritta nell'audit (update filtrato per `user_id`) in
realtà fallisce, perché quando l'update legge colonne della tabella Postgres controlla anche la
policy di lettura sulla riga nuova. **Senza filtro** l'update riesce: provato in locale senza la
correzione, l'utente finisce nella lista altrui e ne legge acquisti e profili dei membri. A1 era
quindi reale e la gravità resta alta.

**A2.** Con la correzione, `anon` non vede nessun file del bucket, un utente vede solo i file della
propria cartella (serve all'upload con `upsert`), le policy di insert, update e delete restano
quelle della `0006`. Gli URL pubblici continuano a funzionare perché il bucket resta pubblico.
Restano da fare i punti 2 e 3 di A2 (nome file non indovinabile, cancellazione dei file vecchi):
non bloccano.

**Compatibilità con la PR #16** (provata con la correzione applicata sopra le migration di
Basilio):

- Il vecchio frontend che aggiorna nome, colore e foto sulla riga membro funziona; il trigger
  `sync_member_to_profile` aggiorna il profilo (grant di `profiles` sulle stesse 3 colonne).
- `update_my_profile` funziona e il trigger `sync_profile_to_members` (`security definer`, non
  soggetto ai grant) allinea tutte le righe membro.
- `create_household`, `join_household`, `leave_household`, `delete_household`,
  `rotate_join_code` funzionano (sono `security definer` o non toccano colonne revocate).
- Le migration di Basilio non toccano i grant di `household_members` né le policy di Storage:
  l'ordine di applicazione non conta. Dopo la rinumerazione aggiornare i riferimenti a "0017" in
  `supabase/checks/dati_pre_0017.sql`, `docs/SVILUPPO.md` e nei commenti.
- Il frontend attuale non aggiorna altre colonne di `household_members` e non elenca file di
  Storage: nessuna regressione attesa.

---

## R0 - A1 ancora aperto nel branch della PR (alta, risolto dalla correzione urgente)

La PR revoca l'update di tabella su `households` ma non su `household_members`. Con le migration
della PR e senza la correzione urgente, un utente autenticato che fa un update **senza filtro**
sulle proprie righe membro, cambiando `household_id`, entra in qualsiasi lista di cui conosce l'id,
senza codice e **oltre il limite di 20 membri**. Provato in locale.

**Correzione:** già nella correzione urgente. Basta che vada in produzione prima della PR (o
insieme) e che, dopo la rinumerazione, nessuna migration rimetta un `grant update` di tabella su
`household_members`.

## R1 - La foto profilo accetta qualsiasi host (media, blocca l'unione)

**Dove:** `is_valid_avatar_url` in `0017_profiles.sql`.

La PR dichiara "niente URL esterni", ma il controllo verifica solo il **percorso** dell'URL
(`/storage/v1/object/public/avatars/<proprio id>/<file>`), non l'host, ed è ammesso anche `http`.
Un utente può quindi puntare la propria foto a un server suo, purché l'URL abbia quel percorso.
Provato in locale, sia con update diretto su `profiles` sia con `update_my_profile`: l'URL viene
accettato e copiato sulle righe membro, visibili agli altri membri.

**Effetto:** ogni volta che un altro membro apre la lista, il suo browser chiede la foto a quel
server, che ne registra IP, orario e user agent (pixel di tracciamento). Insieme a R2 diventa
tracciamento di sconosciuti. La CSP `img-src` lo bloccherebbe, ma oggi è solo in osservazione.

**Correzione proposta (Basilio):** accettare solo gli host del progetto. Due opzioni:

1. Elenco esplicito nel controllo: `https://egvodwvnralxttxiovau.supabase.co` (più l'eventuale
   dominio personalizzato), e in locale `http://127.0.0.1:54321` / `http://localhost:54321`.
   Solo `https` in produzione.
2. Meglio a lungo termine: salvare nel profilo solo il **percorso** nel bucket
   (`<user_id>/<file>.webp`) e costruire l'URL nel frontend con `getPublicUrl`. Così l'host non è
   più un dato scritto dall'utente.

Aggiungere a `supabase/checks/profili_liste.sql` un caso con host esterno e percorso corretto.

## R2 - Forza bruta sui codici di invito (media, blocca l'apertura)

**Dove:** `get_household_invite`, `join_household` (`0018_multi_lists.sql`); `generate_join_code`
(`0001`).

È il punto M1 dell'audit (segnalato anche da Basilio nella PR), ma con le liste multiple peggiora:

- sparisce il freno "una sola casa per utente": ogni account può entrare in 50 liste;
- `get_household_invite` è un oracolo gratuito: non crea righe, non ha limiti, non conta per le 50
  liste, e per ogni codice giusto restituisce nome della lista e numero di membri. Chi cerca
  codici prova solo con lei e poi entra solo nelle liste che gli interessano;
- i codici non scadono e sono generati con `random()`, che non è pensato per segreti.

Con le registrazioni chiuse il rischio è basso; con l'apertura no (tabella dei tempi in M1
dell'audit).

**Correzione proposta (Basilio):** quella di M1: tabella dei tentativi falliti per utente,
condivisa da `get_household_invite` e `join_household` (es. 10 all'ora e 30 al giorno, poi errore
uniforme); codici da `extensions.gen_random_bytes`; per i link di invito un token lungo (128 bit)
con scadenza e revocabile, separato dal codice corto da scrivere a mano; captcha alla
registrazione. Notifica ai membri quando entra qualcuno (Fragola).

## R3 - Permessi di default invariati (bassa)

`pg_default_acl` dà ancora ad `anon` tutti i permessi su tabelle, sequenze e funzioni nuove in
`public` (M5 dell'audit). Le funzioni nuove senza `revoke` esplicito sono eseguibili da `anon`:
`is_valid_avatar_url`, `max_households_per_user`, `max_members_per_household`,
`normalize_join_code` e la funzione di trigger `profiles_before_update`. Sono innocue (calcoli
puri, o non richiamabili come RPC), e `profiles` ha il suo `revoke all ... from anon`. Il rischio è
per la prossima tabella o funzione dimenticata.

**Correzione:** in questa PR o nella prossima migration, `alter default privileges in schema public
revoke all on tables from anon` e `revoke execute on functions from anon, public` (vedi M5), più
`revoke execute` esplicito sulle quattro funzioni sopra.

## R4 - Limite delle 50 liste non atomico (bassa)

`create_household` e `join_household` contano le liste dell'utente senza blocco: richieste in
parallelo possono superare 50. Il limite dei 20 membri invece è protetto dal `for update` sulla
lista. Effetto modesto (qualche lista in più). **Correzione:** bloccare la riga del profilo
(`select ... from profiles where id = auth.uid() for update`) prima del conteggio.

## R5 - `get_household_invite` restituisce l'id della lista (bassa)

L'anteprima serve a mostrare nome e numero di membri; l'id della lista non serve a chi non è
ancora membro. Con A1 aperto era la chiave per entrare senza codice; dopo la correzione urgente non
dà accesso a nulla, ma è un dato in più senza motivo. **Correzione:** togliere `household_id` dal
risultato (o restituirlo solo se `is_member`). Nota a margine: `leave_household` e
`delete_household` bloccano la riga della lista prima di controllare l'appartenenza; meglio
controllare prima (blocco brevissimo, nessun effetto pratico).

## R6 - Foto non cancellate con l'account (bassa, con la #9)

Provato: cancellando un utente spariscono profilo, righe membro e liste in cui era solo, ma i file
in `avatars/<user_id>/` restano. È M7 dell'audit: va risolto dentro `delete_my_account` (#9), che
deve cancellare anche i file (Storage API o `storage.objects` con `service_role`).

## R7 - Verifiche senza regressioni per A1, R1 e limiti (bassa)

`supabase/checks/profili_liste.sql` è ben fatto, ma non prova: update di `household_id` o
`user_id` sulla riga membro **senza filtro**, URL di foto con host esterno e percorso corretto,
limiti di 50 liste e 20 membri. Aggiungerli, così restano coperti a ogni migration.

## Note minori (nessuna azione richiesta ora)

- `households.stores`: massimo 60 elementi, ma nessun limite di lunghezza per elemento (M4).
- `authenticated` ha ancora `TRUNCATE`, `REFERENCES`, `TRIGGER` sulle tabelle vecchie (B3).
- Il frontend attuale prende la prima lista con `.limit(1)`: dopo il deploy, un utente che entra in
  una seconda lista dal vecchio frontend potrebbe vedere una lista a caso. Non è un problema di
  sicurezza, ma conviene non pubblicizzare il secondo ingresso finché il frontend nuovo non c'è.
