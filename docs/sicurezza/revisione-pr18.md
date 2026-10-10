# Revisione della PR #18 (frontend di profili, liste e onboarding)

Autore: Aglio (QA, sicurezza e privacy). Data: 2026-10-10.

Questo file riporta solo il verdetto e i punti verificati. I punti ancora aperti sono stati
segnalati al PM a parte e saranno descritti qui solo dopo la correzione in produzione.

## Verdetto

**Si può pubblicare** (verifica finale del 2026-10-10), dopo la PR #16 e con le registrazioni
chiuse finché informativa e termini non sono pubblicati e collegati dalla registrazione.

## Cosa è stato verificato

Lettura del codice del branch `fragola/profili-liste` (sessione, cache locali, inviti, profilo,
upload della foto, service worker, `index.html`).

| Punto                         | Esito                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logout e dati sul dispositivo | Al logout e all'evento `SIGNED_OUT` (anche da un'altra scheda o a sessione scaduta) si svuotano cache di TanStack Query in memoria e su IndexedDB, coda offline e cache `supabase-rest` del service worker |
| Font                          | Serviti dall'app con `@fontsource`; nessuna richiesta a Google                                                                                                                                             |
| Foto profilo                  | Nel profilo solo il percorso nel bucket; l'URL lo costruisce il client con `getPublicUrl`; immagine ridimensionata e ricodificata nel browser                                                              |
| Link di invito                | Il token viene tolto subito dalla barra degli indirizzi (`history.replaceState`) e l'ingresso nella lista chiede sempre una conferma esplicita dopo l'anteprima                                            |
| `localStorage`                | Nessun dato personale: tema, contatori dell'invito all'installazione, lista aperta, invito in sospeso, più la sessione di Supabase                                                                         |
| Debug                         | `window.__frigolo` e `window.__frigoloQuery` solo con `import.meta.env.DEV`; nessun `dangerouslySetInnerHTML`                                                                                              |
| Registrazione                 | Nome passato nei metadati (`display_name`, massimo 40 caratteri), `emailRedirectTo` sull'origine dell'app, flusso PKCE                                                                                     |

Non provato da Aglio: lo svuotamento della cache del service worker su una build di produzione
(in sviluppo il service worker è spento). Da controllare nella checklist di rilascio, punto 6.

## Verifica finale (2026-10-10)

- Foto: nome con uuid casuale, la foto precedente viene cancellata.
- Logout: oltre alle cache si tolgono invito in sospeso e lista aperta salvata.
- `/auth/confirm`: legge solo `token_hash` e `type` (da un elenco chiuso), pulisce subito
  l'indirizzo, porta sempre a `/` (nessun parametro di destinazione) e non mostra nella pagina
  nessun valore preso dall'URL.
- Turnstile: script caricato solo nelle schermate di accesso; se il widget non si carica il modulo
  parte senza token e decide il server (con il captcha attivo nel pannello la richiesta senza
  token viene rifiutata da Supabase Auth).
- Avvio senza rete: con una sessione salvata l'app si apre sulla cache del dispositivo; appena il
  server risponde una sessione revocata o scaduta porta al logout e alla pulizia dei dati locali.
- Checklist di rilascio: lint, typecheck, 70 test, build, `pnpm audit --prod` puliti; nessun
  segreto né dato reale nel diff; niente Google Fonts né codice di debug nella build; avatar
  `lele` e `pipi` rimossi.
