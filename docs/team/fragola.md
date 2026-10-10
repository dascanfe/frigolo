# Quaderno di Fragola

Aggiornato da Fragola alla fine di ogni incarico. Il più recente in alto.

## Stato

Frontend di profili, liste multiple, onboarding, captcha, link delle email e "I tuoi dati"
nel branch `fragola/profili-liste` (draft PR #18 verso `main`, dipende dalla #16 di Basilio).
Provato solo in locale (migration 0001-0023, utenti di `supabase/checks/seed_dev.sql`).

## Da fare

- Con SMTP e conferma email attivi: provare "Controlla la posta", "Mandala di nuovo" e i
  link `/auth/confirm` con email vere (in locale provati con link generati dall'API admin).
- Captcha con Supabase attivo: provarlo in locale con le chiavi di test (vedi SVILUPPO.md).
- Immagine Open Graph definitiva di Paprika al posto di `public/og-image.png` (segnaposto).
  Un'anteprima per singolo invito ("Ti invitano nella lista ...") richiede una pagina
  servita dal server: da valutare.
- `og:image` è un percorso relativo: alcune app (WhatsApp) vogliono l'URL assoluto; quando
  il dominio `frigolo.dascanfe.com` è attivo, metterlo assoluto.
- i18n: restano nei componenti i testi di catalogo, analitiche, pannelli dei prodotti e
  password.

## Domande aperte per Daniele

- Supermercati di partenza (Lidl, Eurospin, Conad, Coop, Carrefour, MD, Mercato): in attesa
  della sua risposta tramite il PM.

## Diario

### 2026-10-10 - Secondo giro: limiti, captcha, link delle email, i tuoi dati

- Limiti di Daniele (2 liste, 5 persone) spiegati prima di provare: "Nuova lista" e "Ho un
  codice" disattivati con spiegazione, invito che avvisa a lista piena, link d'invito che
  dice se la lista è piena o se le liste sono già due.
- Captcha Turnstile su accesso, registrazione, recupero e "Mandala di nuovo"; script
  caricato solo lì; senza site key o se lo script non si carica si invia lo stesso.
- `/auth/confirm` con `token_hash` e `verifyOtp` (conferma, recupero, cambio email); link
  scaduto con "Mandala di nuovo".
- Errori del database riconosciuti da `error.hint`; password minima 10 caratteri.
- "I tuoi dati": export JSON ed eliminazione account con doppia conferma (#9).
- Primo uso: "Cosa manca?" con prodotti "Per cominciare", suggerimenti uno per volta,
  banner di installazione dopo il primo prodotto, toast "{nome} ora è nella lista".
- Revisione di Aglio: nomi casuali per le foto e cancellazione della precedente; al logout
  via anche invito in sospeso e lista aperta salvata.
- Anteprima dei link con immagine segnaposto; più testi in `src/i18n/it.ts`; glossario:
  "Nuovo invito".
- Verificato a 375px: limite di 2 liste, captcha con chiave di prova (token passato
  all'accesso), primo prodotto e suggerimento, toast di nuova persona via realtime, foto
  sostituita (la vecchia sparisce dal bucket), link scaduto, link di recupero valido,
  export JSON, eliminazione account con edge function servita in locale.

### 2026-10-10 - Profili, liste multiple, onboarding, M6 e M8 (#3, #4, #5, #6)

- Profilo unico: nome, colore e foto su `profiles` (`update_my_profile`, foto come
  `avatar_path` nel bucket). Senza foto l'avatar è la mascotte sul colore scelto
  (`public/mascot-avatar.webp`); nel selettore le anteprime della mascotte sui 9 colori e
  "Carica una foto" / "Torna alla mascotte". Via `src/lib/avatars.ts`, `avatar-a.png`,
  `avatar-b.png`.
- Liste multiple: query `['lists', userId]` con persone e profili, lista aperta salvata
  sul dispositivo (`currentList.ts`), selettore dal titolo della schermata principale,
  Impostazioni con rinomina, persone, invito (Web Share con il messaggio di Zenzero, copia
  link, codice, scadenza, "Nuovo invito"), lascia ed elimina con conferma e avviso per
  l'ultima persona. Realtime per lista più `profiles`. Le schermate si rimontano cambiando
  lista.
- Onboarding: registrazione con il nome, "Controlla la posta", "Come ti chiami?", "La tua
  prima lista", invito; link `/invito/<token>` conservato in `localStorage` durante
  registrazione e accesso, poi "Ti invitano in {lista}".
- Supermercati generici per le liste nuove (#6). Testi allineati alla tabella di Zenzero.
  Errori delle quote (0020) tradotti.
- Audit: M6 (logout svuota cache TanStack su IndexedDB, coda offline e cache
  `supabase-rest`), M8 (font da `@fontsource`, niente Google).
- Verifiche nel browser a 375px: utente da zero (Carla), lista "con altre persone" e
  invito, invito via link tra due utenti (Bruno), Bruno con 2 liste che passa dall'una
  all'altra (analitiche comprese, scelta ricordata dopo il ricaricamento), uscita non
  ultima e uscita dell'ultima persona (lista eliminata, ritorno a "La tua prima lista"),
  codice sbagliato, foto caricata e tolta, logout con IndexedDB svuotato.
