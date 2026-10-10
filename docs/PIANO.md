# Piano: Frigolo per tutti

Obiettivo: chiunque può scaricare Frigolo sul telefono, gratis, da un link.
Si procede per fasi; a fine fase il PM riassume, fa il commit e aspetta l'ok di Daniele.

## Fase 0 - Fondamenta (PM)

- [x] Cartella `Frigolo published`, repo pubblico `dascanfe/frigolo` con storia nuova, licenza AGPL-3.0
- [x] Squadra definita in `.claude/agents/`, quaderni in `docs/team/`
- [x] README pubblico, `FUNDING.yml` (link PayPal.me), file per la community
- [x] Etichette, milestone e issue della Fase 1 su GitHub
- [ ] Vercel collegato al nuovo repo, secret del keep-alive, vecchio repo archiviato
- [x] `node_modules` fuori da iCloud

## Fase 1 - Pronta per il pubblico

- Basilio: Supabase in locale con Docker; SMTP (Resend) per le email; conferma email; captcha
  (Cloudflare Turnstile); rate limit; cancellazione account ed export dati; registrazioni aperte;
  dominio `frigolo.dascanfe.com` su Vercel con redirect dal vecchio; `site_url` e redirect di auth.
- Basilio + Fragola: **liste multiple** (creare, rinominare, lasciare, eliminare liste; passare da
  una all'altra; invitare con codice o link); **profilo utente** con nome e foto scelti da ciascuno
  (unici per utente, non per lista); uso da soli senza dover invitare nessuno.
- Fragola: onboarding per nuovi utenti; supermercati non più legati al Veneto; via gli avatar
  `lele` e `pipi` e ogni riferimento a nomi reali; schermate legali; base per i18n.
- Aglio: audit RLS e auth, advisor, header di sicurezza, privacy policy e termini, checklist di rilascio.
- Zenzero: tono di voce, testi dell'onboarding e delle email di sistema.
- Uscita: un estraneo si registra, conferma l'email, sceglie nome e foto, crea una o più liste,
  invita qualcuno e usa l'app, senza poter vedere nulla delle liste altrui. I 4 utenti attuali
  ritrovano tutto (migrazione dei dati esistenti).

## Fase 2 - Landing e analitiche

- Fragola: landing in `dascanfe.com/sub/frigolo` con pulsante "Offrimi un caffè 💚", istruzioni
  di installazione per iPhone e Android, pagine privacy e termini.
- Pepe: tracciamento senza cookie su landing e app, metriche d'uso aggregate, cruscotto protetto.
- Basilio: pubblicazione via FTP con credenziali salvate da Daniele.
- Aglio: revisione privacy del tracciamento.

## Fase 3 - Brand e contenuti

- Salvia: posizionamento, concorrenti, pubblico, piano di lancio con obiettivi.
- Zenzero: piano editoriale, annunci di lancio.
- Paprika: kit visivo, screenshot, immagine Open Graph, **video promozionale**, primo pacchetto di post.

## Fase 4 - Lancio

- Account social collegati da Daniele, post programmati dopo approvazione.
- Pubblicazione su community e directory scelte da Salvia.
- Pepe: monitoraggio quotidiano la prima settimana.

## Fase 5 - Dopo il lancio

- Report settimanale di Pepe, feedback raccolti da Zenzero, roadmap aggiornata da Salvia.
- Versione inglese. Eventuale Play Store tramite TWA (25 $ una tantum).
