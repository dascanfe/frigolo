# Quaderno di Basilio

Aggiornato da Basilio alla fine di ogni incarico. Il più recente in alto.

## Stato

Supabase in locale attivo e documentato (#1). Profili (#2) e backend delle liste multiple
(#3) pronti nel branch `basilio/profili-liste` (migration 0017 e 0018), provati solo in
locale. In attesa della revisione di Aglio e poi dell'ok di Daniele per la produzione.

## Da fare

- Dopo la revisione di Aglio: preparare per il PM il comando per la produzione
  (`supabase db push`, migration 0017 e 0018) e la verifica successiva.
- Quando il frontend nuovo di Fragola è in produzione e nessuno usa più le colonne
  per-membro: migration che toglie `display_name`, `color`, `avatar_url` da
  `household_members` e i trigger di allineamento.
- Resto della Fase 1: SMTP (Resend), conferma email, captcha, rate limit, cancellazione
  account ed export dati, registrazioni aperte, dominio.
- Possibile limite ai tentativi di `join_household` con codice sbagliato (ora un utente
  può provare codici a ripetizione; 31^8 combinazioni, ma con le registrazioni aperte va
  valutato con Aglio insieme al rate limit).

## Domande aperte per Daniele

- Limiti: 50 liste per utente e 20 membri per lista vanno bene?
- Lasciare una lista da ultimo membro la elimina con tutti i dati (il frontend avvisa).
  Preferisci invece che venga rifiutato finché non la elimini esplicitamente?

## Diario

### 2026-10-10 - Supabase in locale, profili, liste multiple (#1, #2, #3)

- `supabase start` con Docker: migration 0001-0016 e seed applicati, 14 categorie, 234
  prodotti; pg_cron funziona anche in locale (job di prova eseguito ogni 2 secondi).
  Flusso documentato in `docs/SVILUPPO.md` (avvio, reset, reset fino a una versione, tipi).
- 0017: tabella `profiles` creata da trigger su `auth.users` (scelto il trigger e non la
  RPC: ogni utente ha sempre un profilo, qualunque sia il modo di registrarsi). Nome da
  `raw_user_meta_data.display_name`, altrimenti "Utente" con `completed_at` null (profilo
  da completare). Migrazione dalla riga membro più vecchia, avatar-a/avatar-b a null. Foto
  accettate solo dalla propria cartella del bucket `avatars` (niente URL esterni, che
  farebbero da pixel di tracciamento). Colonne per-membro deprecate e allineate in
  entrambe le direzioni da trigger, così l'app attuale continua a funzionare.
- 0018: RPC senza il vincolo "una casa per utente", nuove RPC per invito, rinomina,
  uscita ed eliminazione, `join_code` scrivibile solo con `rotate_join_code`, liste vuote
  eliminate da trigger.
- Verifiche: `supabase/checks/profili_liste.sql` (assert su RLS e RPC con 5 utenti), prova
  della migrazione su `supabase/checks/dati_pre_0017.sql`, giro end-to-end con supabase-js
  (registrazione, due liste, invito, join, uscita, eliminazione, cancellazione account),
  migration rilanciate due volte (idempotenti). `pnpm lint`, `typecheck`, `test` puliti.
- Bug trovato in prova e corretto: `leave_household` in invoker non vedeva più la lista
  dopo l'uscita e rispondeva sempre "eliminata".
