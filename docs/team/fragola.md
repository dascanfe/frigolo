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

- Banner "server non raggiungibile": oggi il banner offline guarda solo la rete del
  telefono; quando il telefono ha rete ma Supabase non risponde non si vede niente (l'app
  però si apre con la cache). Da fare più avanti.

## Domande aperte per Daniele

- Supermercati di partenza (Lidl, Eurospin, Conad, Coop, Carrefour, MD, Mercato): in attesa
  della sua risposta tramite il PM.

## Diario

### 2026-10-20 - Primo uso: più prodotti aggiunti e invito a condividere

Dati: su 16 iscritti solo 9 (56%) aggiungono un prodotto; 1 lista su 17 è condivisa.
Ipotesi sulla lista vuota di prima:

1. L'unico bottone era "Apri il catalogo": portava via da dove si aggiunge in un tocco.
2. "Per cominciare" era una riga di chip piccoli sotto un'icona grande, con il titolo a 12px:
   sembravano filtri, non prodotti.
3. Il sottotitolo diceva "Tocca un prodotto" ma in vista non c'era nessun prodotto, solo la ricerca.
4. Solo 6 prodotti e senza icona: poco riconoscibili, poca scelta.
5. Il primo prodotto non festeggiava nulla (comparivano il suggerimento "Tieni premuto..."
   e poi il banner di installazione) e la condivisione stava solo nelle Impostazioni.

Cambiato: 9 prodotti di partenza come tile con icona (stessa griglia della lista), "Tocca per
aggiungere" con un saltello dei primi tre (spento con prefers-reduced-motion), catalogo ridotto
a link; primo prodotto di chi parte da zero (lista vuota, nessuna spesa) con toast della
mascotte al posto del suggerimento "added"; poi una scheda in pagina, una volta sola e
chiudibile, "La spesa si fa in due?" che apre il pannello invito (`ShareNudge`, stato in
`tips/shareNudge.ts`, `localStorage` `frigolo:share-nudge`). Non compare con altre persone in
lista, con acquisti o a chi ha già prodotti. Toast con mascotte opzionale (`toast(..., true)`).

### 2026-10-11 - Landing rifatta con Bootstrap e motion design (PR #20)

- Bootstrap 5.3 compilato con Sass (`landing/src/scss/`): solo reboot, griglia, bottoni e poche
  utility, palette del kit di Paprika, font dell'app self-hosted. CSS in linea nell'HTML
  (niente richiesta bloccante), nessun JavaScript di Bootstrap, nessuna risorsa di terzi.
- Hero con telefono in prospettiva che fluttua, sezione funzioni con telefono sticky che cambia
  schermata (IntersectionObserver), due telefoni per il realtime, comparsa allo scroll,
  microinterazioni; solo transform e opacity; `prefers-reduced-motion` rispettato.
- Screenshot: `build.mjs` usa `landing/assets/screens/<codice>-*.png` o `marketing/screenshot`
  del worktree di Paprika, altrimenti segnaposto 390x844 (WebP 390/520/780 con srcset).
  Video: `landing/assets/video/*.mp4|webm` (16:9) o `marketing/video/out`; senza file resta il
  poster con "Il video arriva presto" e non esce il JSON-LD `VideoObject`.
- SEO: title, description, canonical, hreflang, Open Graph e Twitter assoluti, JSON-LD
  `SoftwareApplication`, `FAQPage` (generato dalle domande in pagina) e `VideoObject`.
- Tracciante di Pepe (`track.js`): la chiave si mette in build con `FRIGOLO_STATS_KEY`; senza
  chiave resta spento.
- Lighthouse (server con gzip, simulazione 4G lenta): mobile 98/100/100/100, desktop 100/100/100/100.
- Da fare: sostituire gli screenshot ancora segnaposto (s03, s04, s14, s17), mettere il video di
  Paprika, rigenerare con la chiave delle statistiche, caricare via FTP (lo fa il PM).
- Aggiunte due domande alle FAQ (iPhone e Android, codice aperto): da far rivedere a Zenzero.

### 2026-10-10 - Landing (Fase 2)

- Sorgenti in `landing/` (branch `fragola/landing`): `src/` (HTML, CSS, JS, `.htaccess`),
  `build.mjs` e il modello delle pagine legali. `node landing/build.mjs` prepara
  `landing/dist`; `--legal-from origin/aglio/audit-legale` rigenera privacy e termini da
  `docs/legale`; `--copy-to <cartella>` copia nel sito. Copiata in
  `_Dascanfe Website/.../sub/frigolo/` (niente FTP).
- Nessuna risorsa di terzi: font dell'app self-hosted, mascotte in webp, tema chiaro e
  scuro da `prefers-color-scheme`. Installazione con schede iPhone e Android (Android
  aperta per prima sui telefoni Android). Attributi `data-track` per Pepe e
  `track.js` commentato.
- Lighthouse 13 mobile sul server locale: prestazioni 99, accessibilità 100, best
  practices 100, SEO 100. Verificata a 375px e 1280px, in chiaro e scuro, senza
  scorrimento orizzontale.
- Da fare: schermate vere nel telefono finto e immagine Open Graph (Paprika), testi
  rivisti da Zenzero, pagine legali definitive (Aglio).

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
  "Carica una foto" / "Torna alla mascotte". Via `src/lib/avatars.ts`, `lele.png`,
  `pipi.png`.
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
