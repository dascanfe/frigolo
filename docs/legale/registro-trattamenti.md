# Registro delle attività di trattamento (art. 30 GDPR)

> Versione sintetica preparata da Aglio il 2026-10-10. Da tenere aggiornata a ogni nuovo dato
> raccolto o nuovo fornitore (vedi `docs/sicurezza/rilascio.md`, sezione 5). Uso interno.

- **Titolare:** Daniele Scanferlato, persona fisica, [CITTÀ (PROVINCIA)], frigolo@dascanfe.com
- **DPO:** non nominato (non obbligatorio)
- **Ultimo aggiornamento:** 2026-10-10

## Trattamenti

### T1 - Account e autenticazione

| Voce                   | Contenuto                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Finalità               | Registrazione, accesso, recupero password, sicurezza dell'account                               |
| Base giuridica         | Contratto (art. 6.1.b); sicurezza: legittimo interesse (art. 6.1.f)                             |
| Interessati            | Utenti registrati                                                                               |
| Dati                   | Email, hash della password, date di registrazione e accesso, IP e user agent nei log di accesso |
| Destinatari            | Supabase (responsabile); Resend per le email (dominio dascanfe.com); Cloudflare Turnstile       |
| Trasferimenti extra UE | Possibili verso USA (Supabase, Resend, Cloudflare): DPF o clausole contrattuali standard        |
| Conservazione          | Fino alla cancellazione dell'account o dopo 24 mesi di inattività (avviso a 30 giorni)          |
| Misure di sicurezza    | HTTPS, password con hash (Supabase Auth), conferma email, captcha Turnstile, rate limit         |

### T2 - Profilo e liste condivise

| Voce                   | Contenuto                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Finalità               | Far funzionare liste, condivisione, storico, suggerimenti e statistiche della lista                              |
| Base giuridica         | Contratto (art. 6.1.b)                                                                                           |
| Interessati            | Utenti registrati e membri delle stesse liste                                                                    |
| Dati                   | Nome e foto scelti, colore, liste (max 2 per utente, 5 persone), prodotti, note, supermercati, storico acquisti  |
| Destinatari            | Altri membri della stessa lista; Supabase (responsabile)                                                         |
| Trasferimenti extra UE | Dati a Francoforte (UE); possibile accesso tecnico da USA (Supabase): DPF o SCC                                  |
| Conservazione          | Finché la lista ha almeno un membro; foto fino alla sostituzione o cancellazione dell'account                    |
| Misure di sicurezza    | Row Level Security su ogni tabella, funzioni con controllo di appartenenza, revisione di Aglio su ogni migration |

### T3 - Pubblicazione dell'app e log tecnici

| Voce                   | Contenuto                                                            |
| ---------------------- | -------------------------------------------------------------------- |
| Finalità               | Consegnare l'app al browser, diagnosi dei guasti, difesa dagli abusi |
| Base giuridica         | Legittimo interesse (art. 6.1.f)                                     |
| Interessati            | Chiunque visiti l'app                                                |
| Dati                   | IP, user agent, URL richiesti, data e ora                            |
| Destinatari            | Vercel (responsabile); Aruba per la landing su dascanfe.com          |
| Trasferimenti extra UE | USA (Vercel): DPF o SCC                                              |
| Conservazione          | Secondo le impostazioni dei fornitori [VERIFICARE]                   |
| Misure di sicurezza    | HTTPS con HSTS, header di sicurezza e CSP                            |

### T4 - Statistiche d'uso aggregate [PREVISTO, Fase 2]

| Voce                | Contenuto                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Finalità            | Capire quante persone usano l'app e quali funzioni, per migliorarla                            |
| Base giuridica      | Legittimo interesse (art. 6.1.f), senza cookie né identificativi persistenti                   |
| Interessati         | Visitatori della landing e utenti dell'app                                                     |
| Dati                | Eventi anonimi (pagina, data, tipo di dispositivo); nessun IP salvato [DA CONFERMARE con Pepe] |
| Destinatari         | Supabase (progetto delle analitiche di dascanfe.com, Francoforte)                              |
| Conservazione       | Dati grezzi [DA DECIDERE, proposta 13 mesi], aggregati senza limite                            |
| Misure di sicurezza | Cruscotto protetto da login; revisione privacy di Aglio prima dell'attivazione                 |

### T5 - Richieste degli utenti e segnalazioni

| Voce           | Contenuto                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Finalità       | Rispondere a richieste di supporto, esercizio dei diritti, segnalazioni di abusi o vulnerabilità |
| Base giuridica | Obbligo di legge (art. 6.1.c) per i diritti GDPR; contratto o legittimo interesse per il resto   |
| Interessati    | Chi scrive al titolare                                                                           |
| Dati           | Email, contenuto del messaggio                                                                   |
| Destinatari    | Provider di posta del titolare [INDICARE]                                                        |
| Conservazione  | Il tempo di gestire la richiesta, poi al massimo 12 mesi                                         |

### T6 - Donazioni

| Voce           | Contenuto                                                             |
| -------------- | --------------------------------------------------------------------- |
| Finalità       | Ricevere donazioni volontarie e adempiere agli obblighi di legge      |
| Base giuridica | Obbligo di legge (art. 6.1.c) ed esecuzione del rapporto (art. 6.1.b) |
| Interessati    | Donatori                                                              |
| Dati           | Nome, email, importo e data forniti da PayPal                         |
| Destinatari    | PayPal (titolare autonomo)                                            |
| Conservazione  | Fino a 10 anni per obblighi fiscali [VERIFICARE]                      |

## Fornitori (responsabili e titolari autonomi)

| Fornitore       | Ruolo             | Servizio                           | Accordo da accettare      | Stato           |
| --------------- | ----------------- | ---------------------------------- | ------------------------- | --------------- |
| Supabase Inc.   | Responsabile      | Database, Auth, Storage, Realtime  | DPA dal pannello Supabase | [DA FIRMARE]    |
| Vercel Inc.     | Responsabile      | Hosting dell'app                   | DPA di Vercel             | [DA VERIFICARE] |
| Resend          | Responsabile      | Email di servizio (dascanfe.com)   | DPA di Resend             | [DA FIRMARE]    |
| Cloudflare Inc. | Responsabile      | Turnstile (registrazione, accesso) | DPA di Cloudflare         | [DA FIRMARE]    |
| Aruba S.p.A.    | Responsabile      | Hosting di dascanfe.com            | Condizioni di Aruba       | [DA VERIFICARE] |
| PayPal (Europe) | Titolare autonomo | Donazioni                          | Nessuno                   | Attivo          |
