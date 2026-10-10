# Glossario dell'interfaccia

La forma scelta per ogni termine che compare nell'app, nelle email e sulla landing.
Serve a tenere i testi coerenti e a Fragola per le chiavi di traduzione (i18n).
Il perché delle scelte è in [tono.md](tono.md).

Regola generale: se un termine non è qui, si usa la parola più semplice che userebbe una
persona al supermercato, e poi lo si aggiunge a questa pagina.

## Concetti

| Concetto (nel codice)            | Termine scelto                                  | Da evitare                                         | Note                                                                                 |
| -------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `household`                      | **lista**                                       | casa, household, gruppo, famiglia, spazio          | "Casa" va bene solo come nome di una lista. Plurale: "le tue liste"                  |
| nome di una lista                | **nome della lista**                            | titolo, etichetta                                  | Esempi: Casa, Ufficio, Coinquilini, Mamma e papà, Weekend al mare                    |
| lista attiva                     | **la lista** / il suo nome                      | lista corrente, lista selezionata                  | Nel selettore: "Cambia lista"                                                        |
| `household_members`              | **persone** della lista                         | membri, utenti, partner, partecipanti              | Titolo di sezione: "Persone". Frase: "Le persone di questa lista"                    |
| chi usa l'app                    | **tu**                                          | utente, cliente                                    | Nelle pagine legali si può usare "utente" se serve precisione                        |
| `profiles`                       | **profilo**                                     | account (per nome e foto)                          | Il profilo è nome, foto e colore; l'account è email e password                       |
| `display_name`                   | **il tuo nome**                                 | nickname, nome visualizzato, username              | Oggi in Impostazioni c'è "Nome visualizzato": diventa "Il tuo nome"                  |
| `avatar_url`                     | **foto**                                        | avatar, immagine profilo                           | Senza foto si vede l'**iniziale**                                                    |
| `color`                          | **il tuo colore**                               | colore membro, tag                                 |                                                                                      |
| `join_code`                      | **codice d'invito**                             | codice della casa, join code, PIN                  | 8 caratteri, lettere maiuscole e numeri                                              |
| link di invito                   | **link d'invito**                               | URL, link di join                                  |                                                                                      |
| `items`                          | **prodotto**                                    | articolo, item, elemento, voce                     | Anche nei conteggi: "3 prodotti"                                                     |
| prodotto creato da chi usa l'app | **i prodotti di questa lista**                  | prodotti custom, personalizzati, i vostri prodotti | Sono condivisi con le persone della lista. Oggi in Impostazioni: "I vostri prodotti" |
| `categories`                     | **categoria**                                   | reparto, sezione                                   | Il nome delle singole categorie resta com'è                                          |
| catalogo                         | **catalogo**                                    | database prodotti, inventario                      |                                                                                      |
| `list_entries` da comprare       | **da comprare**                                 | todo, pendenti                                     | Titolo di sezione: "Da comprare"                                                     |
| `list_entries` presi             | **nel carrello**                                | completati, spuntati, presi                        | Titolo di sezione: "Nel carrello"                                                    |
| `trips`                          | **spesa** (plurale: **spese**)                  | viaggio, trip, sessione, acquisto                  | "La spesa del 12 ottobre"                                                            |
| chiusura del giro                | **Spesa finita**                                | Completa spesa, Concludi, Checkout                 | Toast dopo la conferma: "Spesa finita: 12 prodotti"                                  |
| `stores`                         | **supermercato**                                | negozio, store, punto vendita                      | Il campo libero può dire "o il negozio" per chi va al mercato                        |
| "ovunque" (nessun supermercato)  | **Ovunque**                                     | Tutti, Nessuno                                     |                                                                                      |
| `unit`                           | **unità**                                       | UdM                                                | "pz", "kg", "g", "l" restano abbreviati                                              |
| `quantity`                       | **quantità**                                    | qty, numero                                        |                                                                                      |
| `note`                           | **nota**                                        | commento, dettagli                                 | Esempio nel campo: "Es. quello senza lattosio"                                       |
| suggerimenti                     | **suggeriti per te**                            | consigliati, raccomandazioni, AI                   |                                                                                      |
| analitiche                       | **analitiche**                                  | statistiche, report, dashboard                     | Voce del menu: "Analitiche"                                                          |
| storico acquisti                 | **le spese**                                    | cronologia, log                                    |                                                                                      |
| tema grafico                     | **tema**                                        | skin, aspetto                                      |                                                                                      |
| PWA installata                   | **installa** / **aggiungi alla schermata Home** | scarica, download                                  | Su iPhone si usa il nome del menu di Safari: "Aggiungi alla schermata Home"          |
| modalità offline                 | **senza rete**                                  | offline (nei testi lunghi)                         | Nel banner corto "Offline" è accettato                                               |
| donazione                        | **Offrimi un caffè 💚**                         | dona, supporta, abbonati, premium                  | Sempre con il cuore verde                                                            |

## Azioni (bottoni e voci di menu)

Bottoni all'imperativo, alla seconda persona singolare, senza punto finale.

| Azione                         | Testo del bottone     | Da evitare                         |
| ------------------------------ | --------------------- | ---------------------------------- |
| Registrazione                  | Crea l'account        | Sign up, Iscriviti ora             |
| Accesso (scheda)               | Accedi                | Login, Log in                      |
| Accesso (bottone del modulo)   | Entra                 | Invia, Conferma                    |
| Uscita dall'account            | Esci                  | Logout, Disconnetti                |
| Andare avanti in un flusso     | Avanti                | Continua, Next, Procedi            |
| Saltare un passaggio           | Lo faccio dopo        | Salta, Skip, Non ora               |
| Creare una lista               | Crea la lista         | Nuova household, Aggiungi lista    |
| Entrare con un codice (scheda) | Ho un codice          | Unisciti, Join                     |
| Entrare in una lista           | Entra nella lista     | Unisciti al gruppo                 |
| Cambiare lista                 | Cambia lista          | Switch, Seleziona workspace        |
| Rinominare                     | Rinomina              | Modifica nome                      |
| Lasciare una lista             | Lascia la lista       | Abbandona, Esci dal gruppo         |
| Eliminare una lista            | Elimina la lista      | Cancella, Rimuovi                  |
| Invitare                       | Invita qualcuno       | Invita il partner, Aggiungi membro |
| Condividere l'invito           | Manda l'invito        | Share, Condividi link di join      |
| Copiare                        | Copia (poi: Copiato)  | Copia negli appunti                |
| Rinnovare codice e link        | Nuovo invito          | Rigenera, Nuovo codice             |
| Mettere in lista               | Aggiungi alla lista   | Inserisci, Add                     |
| Creare un prodotto             | Crea il prodotto      | Nuovo item                         |
| Salvare                        | Salva                 | Conferma modifiche, OK             |
| Annullare                      | Annulla               | Indietro (se annulla davvero)      |
| Chiudere un foglio             | Chiudi                | X (senza etichetta accessibile)    |
| Riprovare                      | Riprova               | Retry, Ricarica                    |
| Archiviare un prodotto         | Archivia / Ripristina | Nascondi, Disattiva                |
| Chiudere la spesa              | Spesa finita          | Completa spesa, Checkout           |
| Confermare la spesa            | Conferma 12 prodotti  | OK, Fatto                          |
| Cambiare password              | Cambia password       | Reset password                     |
| Password dimenticata           | Password dimenticata? | Recupera credenziali               |
| Rimandare l'email              | Mandala di nuovo      | Reinvia, Resend                    |
| Scaricare i propri dati        | Scarica i tuoi dati   | Export, Esporta GDPR               |
| Cancellare l'account           | Elimina l'account     | Cancella utente, Disattiva         |
| Installare l'app               | Installa              | Scarica, Download                  |
| Aggiornare l'app               | Aggiorna adesso       | Update                             |
| Donare                         | Offrimi un caffè 💚   | Dona ora, Supporta                 |

## Messaggi di attesa

| Situazione        | Testo                      |
| ----------------- | -------------------------- |
| Attesa generica   | Un attimo...               |
| Salvataggio       | Salvo...                   |
| Caricamento lista | Carico la lista...         |
| Caricamento foto  | Carico la foto...          |
| Invio email       | Mando l'email...           |
| Ingresso in lista | Entro nella lista...       |
| Sincronizzazione  | Sincronizzo 2 modifiche... |

## Parole in inglese ammesse

Solo quelle che un italiano usa già al supermercato o al telefono: **email**, **password**,
**account**, **link**, **app**, **Home** (nel nome del menu di iPhone), **WhatsApp**.
Tutto il resto in italiano: niente "tap", "share", "settings", "login", "feedback" nei testi
dell'app.

## Chiavi i18n suggerite

Per Fragola, se serve uno schema: `area.elemento.variante`, in inglese, in minuscolo con punti.
Esempi: `onboarding.firstList.title`, `list.empty.title`, `errors.network`, `actions.save`,
`trip.finish.button`. Le traduzioni inglesi seguono lo stesso glossario: list, shopping trip,
cart, product, people, invite code.
