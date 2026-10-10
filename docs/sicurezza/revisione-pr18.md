# Revisione della PR #18 (frontend di profili, liste e onboarding)

Autore: Aglio (QA, sicurezza e privacy). Data: 2026-10-10.

Questo file riporta solo il verdetto e i punti verificati. I punti ancora aperti sono stati
segnalati al PM a parte e saranno descritti qui solo dopo la correzione in produzione.

## Verdetto

**Approvata con correzioni.** Dipende dalla PR #16, che va unita e rilasciata prima. Le
correzioni richieste sono state comunicate al PM; serve un ultimo passaggio di Aglio prima
dell'unione.

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
