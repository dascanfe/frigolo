# Testi dell'onboarding

Testi per chi arriva su Frigolo da zero, schermata per schermata (issue #5).
Seguono [tono.md](tono.md) e [glossario.md](glossario.md). L'ordine e il disegno delle
schermate li decide Fragola: se una schermata cambia forma, i testi si adattano, il lessico no.

Convenzioni di questo documento:

- `{nome}`, `{lista}`, `{email}`, `{codice}`, `{link}`, `{app}` sono valori che inserisce l'app
  (`{app}` è l'indirizzo dell'app senza `https://`, per esempio `frigolo.dascanfe.com`).
- **Titolo** è l'intestazione grande, **Sottotitolo** la riga sotto, **Bottone** il principale,
  **Secondario** un bottone o link meno evidente.
- Dove ci sono più proposte, la prima è quella consigliata.

Il percorso:

1. Accesso e registrazione
2. Email mandata
3. Email confermata
4. Come ti chiami (nome, foto, colore)
5. La prima lista (da solo, con altri, ho un codice)
6. Invita qualcuno
7. Entrare con un codice o con un link
8. I primi prodotti
9. Installa l'app (facoltativa, dopo la prima aggiunta)

---

## 1. Accesso e registrazione

Una sola schermata con due schede, come oggi. Mascotte in alto.

**Titolo:** Frigolo

**Sottotitolo** (proposte):

1. La lista della spesa sempre in tasca. Per conto tuo o in compagnia.
2. La lista della spesa che si aggiorna su tutti i telefoni.
3. La spesa, senza dimenticare niente.

Oggi è "La lista della spesa di casa, sempre in tasca.": con le liste multiple "di casa" non
basta più.

**Schede:** Accedi · Registrati

### Scheda "Accedi"

| Elemento          | Testo                 |
| ----------------- | --------------------- |
| Campo             | Email                 |
| Segnaposto        | nome@esempio.it       |
| Campo             | Password              |
| Bottone           | Entra                 |
| Secondario        | Password dimenticata? |
| Bottone in attesa | Un attimo...          |

### Scheda "Registrati"

| Elemento                | Testo                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| Campo                   | Email                                                                  |
| Campo                   | Password                                                               |
| Segnaposto password     | Almeno 8 caratteri                                                     |
| Aiuto sotto la password | Ti servirà per entrare da altri telefoni.                              |
| Riga legale             | Creando l'account accetti i [Termini](#) e l'[Informativa privacy](#). |
| Bottone                 | Crea l'account                                                         |

L'aiuto di oggi ("siete in due, niente reset automatici") va tolto: il recupero password c'è e
non si è per forza in due.

Il captcha (Turnstile) non ha testo nostro. Se fallisce: vedi errori.

### Recupero password (dalla scheda "Accedi")

| Situazione        | Testo                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Email non scritta | Scrivi prima la tua email, poi tocca "Password dimenticata?".                                                         |
| Richiesta partita | Se {email} ha un account, ti arriva un'email con il link per scegliere una nuova password. Aprila da questo telefono. |

### Errori

| Caso                        | Testo                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| Email o password sbagliate  | Email o password sbagliate.                                                       |
| Email già registrata        | Questa email ha già un account. Prova ad accedere.                                |
| Password corta              | La password deve avere almeno 8 caratteri.                                        |
| Email non valida            | Questa email non sembra giusta. Controlla che ci sia la @.                        |
| Email non ancora confermata | Prima conferma l'email: ti ho mandato un link. [Mandala di nuovo]                 |
| Troppe email in poco tempo  | Ti ho già mandato un'email da poco. Aspetta qualche minuto e riprova.             |
| Troppi tentativi            | Troppi tentativi. Aspetta un minuto e riprova.                                    |
| Captcha non superato        | Non sono riuscito a verificare che sei una persona. Ricarica la pagina e riprova. |
| Nessuna rete                | Nessuna connessione. Controlla la rete e riprova.                                 |
| Registrazioni chiuse        | Le registrazioni sono chiuse per un po'. Riprova più tardi.                       |
| Errore sconosciuto          | Non sono riuscito a entrare. Riprova tra poco.                                    |

"Sei una persona" va bene: "persona" è femminile per tutti.

---

## 2. Email mandata

Dopo "Crea l'account", al posto del modulo.

| Elemento     | Testo                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Mascotte     | Variante contenta, con una busta da lettere al posto di quella della spesa (per Paprika) |
| Titolo       | Controlla la posta                                                                       |
| Sottotitolo  | Ti ho mandato un link a **{email}**. Aprilo da questo telefono e sei dentro.             |
| Nota piccola | Non la trovi? Guarda nella cartella spam o promozioni.                                   |
| Secondario   | Mandala di nuovo                                                                         |
| Secondario   | Ho sbagliato email                                                                       |

| Situazione                       | Testo                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| "Mandala di nuovo" toccato       | Fatto, ti ho mandato un'altra email.                          |
| "Mandala di nuovo" troppo presto | Aspetta ancora {secondi} secondi prima di chiederne un'altra. |
| "Ho sbagliato email"             | Torna alla scheda "Registrati" con l'email già scritta.       |

---

## 3. Email confermata

Si vede aprendo il link dell'email. Se la sessione parte da sola, è un messaggio breve sopra la
schermata 4; se il link è aperto su un altro browser, è una schermata a sé.

| Caso                     | Titolo                | Sottotitolo                                                                   | Bottone          |
| ------------------------ | --------------------- | ----------------------------------------------------------------------------- | ---------------- |
| Tutto a posto            | Email confermata      | Ci siamo quasi: due cose e la tua lista è pronta.                             | Avanti           |
| Link aperto altrove      | Email confermata      | Ora apri Frigolo sul telefono che usi per la spesa ed entra con la tua email. | Accedi           |
| Link scaduto o già usato | Questo link è scaduto | Ne mando uno nuovo: scrivi la tua email e tocca "Mandala di nuovo".           | Mandala di nuovo |

---

## 4. Come ti chiami

Il profilo vale per tutte le liste (issue #2).

| Elemento          | Testo                                              |
| ----------------- | -------------------------------------------------- |
| Etichetta piccola | Ciao!                                              |
| Titolo            | Come ti chiami?                                    |
| Sottotitolo       | Nome e foto li vede solo chi fa la spesa con te.   |
| Campo             | Il tuo nome                                        |
| Segnaposto        | Es. Marta                                          |
| Aiuto             | Va bene anche un soprannome.                       |
| Foto              | Aggiungi una foto                                  |
| Foto, sotto       | Facoltativa: senza foto si vede la tua iniziale.   |
| Foto scelta       | Cambia foto · Togli la foto                        |
| Colore            | Il tuo colore                                      |
| Colore, aiuto     | Serve a capire al volo chi ha messo cosa in lista. |
| Bottone           | Avanti                                             |

Oggi c'è "Benvenuto": diventa "Ciao!" (neutro). Il nome si propone già compilato dalla parte
dell'email prima della @, come oggi, ma solo se sembra un nome (niente numeri).

| Errore                              | Testo                                                             |
| ----------------------------------- | ----------------------------------------------------------------- |
| Nome vuoto                          | Scrivi un nome, anche solo l'iniziale.                            |
| Foto troppo grande o formato strano | Questa foto non riesco a usarla. Provane un'altra (JPG o PNG).    |
| Caricamento foto non riuscito       | Non sono riuscito a caricare la foto. Riprova o vai avanti senza. |

---

## 5. La prima lista

Una schermata con tre scelte, poi il nome.

**Titolo:** La tua prima lista

**Sottotitolo:** Puoi usarla per conto tuo o con chi vuoi. Altre liste le crei quando servono.

Tre schede (o tre righe grandi da toccare):

| Scelta                | Testo sotto                                            |
| --------------------- | ------------------------------------------------------ |
| **Per conto mio**     | Una lista solo tua. Puoi invitare qualcuno anche dopo. |
| **Con altre persone** | Dopo averla creata ti do un link da mandare.           |
| **Ho un codice**      | Qualcuno ti ha già invitato in una lista.              |

"Ho un codice" porta alla schermata 7.

### Nome della lista

| Elemento                | Testo                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Campo                   | Nome della lista                                              |
| Valore proposto         | Casa                                                          |
| Esempi (chip toccabili) | Casa · Ufficio · Coinquilini · Mamma e papà · Weekend al mare |
| Aiuto                   | Puoi cambiarlo quando vuoi.                                   |
| Bottone                 | Crea la lista                                                 |
| Bottone in attesa       | Creo la lista...                                              |

| Errore            | Testo                                                  |
| ----------------- | ------------------------------------------------------ |
| Nome vuoto        | Dai un nome alla lista, anche solo "Casa".             |
| Nome troppo lungo | Massimo 60 caratteri.                                  |
| Rete              | Nessuna connessione. Controlla la rete e riprova.      |
| Altro             | Non sono riuscito a creare la lista. Riprova tra poco. |

Dopo la creazione: con "Per conto mio" si va alla schermata 8, con "Con altre persone" alla 6.

---

## 6. Invita qualcuno

Si vede dopo "Con altre persone" e, uguale, in Impostazioni della lista.

| Elemento                                             | Testo                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Titolo                                               | Invita chi fa la spesa con te                                               |
| Sottotitolo                                          | Chi entra in "{lista}" vede la stessa lista e la aggiorna dal suo telefono. |
| Bottone                                              | Manda l'invito                                                              |
| Secondario                                           | Copia il link                                                               |
| Copiato                                              | Link copiato                                                                |
| Riquadro del codice                                  | Oppure dài questo codice: **{codice}**                                      |
| Sotto il codice                                      | Chi lo riceve apre Frigolo e tocca "Ho un codice".                          |
| Nuovo codice                                         | Nuovo invito (rinnova codice e link)                                        |
| Conferma nuovo codice                                | Il codice di prima smette di funzionare. Vuoi crearne uno nuovo?            |
| Bottone conferma                                     | Crea un nuovo codice                                                        |
| Uscita                                               | Lo faccio dopo                                                              |
| In Impostazioni, quando la lista ha una sola persona | Solo tu, per ora. Invita qualcuno quando vuoi.                              |

"Manda l'invito" apre la condivisione del telefono (Web Share) con il messaggio qui sotto. Se il
telefono non la supporta, copia il messaggio e mostra "Messaggio copiato: incollalo dove vuoi".

### Messaggio di invito

Da condividere su WhatsApp o altrove. Corto, perché si legge nell'anteprima della chat.

> Ciao! Per la spesa uso Frigolo: entra nella lista "{lista}" così la teniamo aggiornata insieme.
> {link}
> Se il link non si apre, vai su {app} e usa il codice {codice}.

Variante più corta (per quando il nome della lista è lungo):

> Entra nella mia lista della spesa su Frigolo 🛒 {link}

Il link deve mostrare un'anteprima con la mascotte e il titolo "Ti invitano nella lista
{lista}" (immagine Open Graph, a cura di Fragola e Paprika). "Ti invitano" e non "Sei invitato":
è neutro.

---

## 7. Entrare in una lista

### Con il codice

| Elemento          | Testo                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| Titolo            | Entra in una lista                                                              |
| Sottotitolo       | Scrivi il codice che ti hanno mandato.                                          |
| Campo             | Codice d'invito                                                                 |
| Segnaposto        | ABCD2345                                                                        |
| Aiuto             | 8 tra lettere e numeri. Lo trova chi ti invita, nelle Impostazioni della lista. |
| Bottone           | Entra nella lista                                                               |
| Bottone in attesa | Entro nella lista...                                                            |
| Secondario        | Non ho un codice                                                                |

"Non ho un codice" torna alla schermata 5.

### Con il link

Se chi apre il link non ha l'account, prima si registra (schermate 1-4) e poi trova questa
schermata. Se ce l'ha, la vede subito.

| Elemento    | Testo                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Titolo      | Ti invitano in "{lista}"                                                   |
| Sottotitolo | Ci sono già {persone}. Entrando vedi la loro lista e la aggiorni anche tu. |
| Bottone     | Entra nella lista                                                          |
| Secondario  | No, grazie                                                                 |

`{persone}` è l'elenco dei nomi: "Marta", "Marta e Luca", "Marta, Luca e altre 2 persone".
Se il link arriva a chi non ha ancora un account, sopra la scheda "Registrati" appare:
"Crea l'account e poi entri nella lista "{lista}"."

### Errori

| Caso                            | Testo                                                                   |
| ------------------------------- | ----------------------------------------------------------------------- |
| Codice che non esiste o vecchio | Questo codice non funziona. Controlla le lettere o chiedine uno nuovo.  |
| Link vecchio                    | Questo invito non vale più. Chiedi a chi te l'ha mandato un link nuovo. |
| Sei già nella lista             | Sei già in questa lista. Ti ci porto.                                   |
| Troppi tentativi                | Troppi tentativi. Aspetta qualche minuto e riprova.                     |
| Rete                            | Nessuna connessione. Controlla la rete e riprova.                       |

### Conferma

Toast dopo l'ingresso: **Sei nella lista "{lista}"**.
Chi era già nella lista vede (toast o, in futuro, notifica): **{nome} ora è nella lista "{lista}" 🎉**.

---

## 8. I primi prodotti

La lista appena creata è vuota. Lo stato vuoto fa da guida.

| Elemento         | Testo                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Titolo           | Cosa manca?                                                              |
| Sottotitolo      | Tocca un prodotto per metterlo in lista. Toccalo di nuovo per toglierlo. |
| Riga di chip     | Per cominciare: Latte · Pane · Uova · Banane · Caffè · Carta igienica    |
| Bottone          | Apri il catalogo                                                         |
| Barra di ricerca | Cerca o aggiungi un prodotto                                             |

I chip sono prodotti del catalogo, un tocco li aggiunge. Spariscono dopo la prima spesa.

Se la lista è condivisa ed è già piena (chi entra con un invito), niente stato vuoto: la lista
si vede subito.

### Suggerimenti al primo uso

Uno per volta, solo la prima volta, con la mascotte piccola accanto. Si chiudono con "Ok".

| Quando                          | Testo                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| Dopo il primo prodotto aggiunto | Fatto, è in lista. Tieni premuto un prodotto per cambiare quantità o supermercato. |
| Primo prodotto non in catalogo  | Non c'è? Scrivilo nella ricerca e tocca "Crea": lo aggiungo al catalogo.           |
| Primo tocco in "Da comprare"    | Al supermercato tocca i prodotti man mano che li prendi: finiscono nel carrello.   |
| Primo carrello non vuoto        | Hai finito? Tocca "Spesa finita" e tengo il conto di cosa hai comprato.            |
| Prima spesa finita              | Prima spesa fatta 🥳 Nelle Analitiche vedi cosa compri di più.                     |

---

## 9. Installa l'app

Oggi c'è già il banner "Installa Frigolo". Testi rivisti, da mostrare dopo il primo prodotto
aggiunto e non prima:

| Elemento | iPhone                                                | Android                                |
| -------- | ----------------------------------------------------- | -------------------------------------- |
| Titolo   | Tienila sulla schermata Home                          | Tienila sulla schermata Home           |
| Testo    | Tocca Condividi e poi "Aggiungi alla schermata Home". | Si apre come un'app, anche senza rete. |
| Bottone  | (nessuno: su iPhone si fa dal menu di Safari)         | Installa                               |
| Chiudi   | Non mostrare più                                      | Non mostrare più                       |

---

## Da allineare nell'app di oggi

Testi esistenti che cambiano con questa guida (per Fragola, quando tocca i file):

| Dove                               | Oggi                                                                                      | Diventa                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `LoginScreen.tsx`, sottotitolo     | La lista della spesa di casa, sempre in tasca.                                            | Sottotitolo scelto al punto 1                                                                          |
| `LoginScreen.tsx`, aiuto password  | Scegline una che ricordi: siete in due, niente reset automatici.                          | Ti servirà per entrare da altri telefoni.                                                              |
| `LoginScreen.tsx`, email mandata   | Ti abbiamo mandato un'email: conferma l'indirizzo e poi accedi.                           | Schermata 2                                                                                            |
| `LoginScreen.tsx`, bottone         | Crea account                                                                              | Crea l'account                                                                                         |
| `OnboardingScreen.tsx`             | Benvenuto · Prepariamo la casa · ...del partner                                           | Schermate 4 e 5                                                                                        |
| `AuthGate.tsx`                     | Carico la casa... · Non riesco a caricare la casa                                         | Carico la lista... · Non riesco a caricare la lista                                                    |
| `SettingsScreen.tsx`               | Invita il partner · Il partner accede a Frigolo e poi inserisce questo codice.            | Schermata 6                                                                                            |
| `SettingsScreen.tsx`               | Rigenera                                                                                  | Nuovo invito                                                                                           |
| `SettingsScreen.tsx`               | I vostri prodotti                                                                         | I prodotti di questa lista                                                                             |
| `ProfileSheet.tsx`                 | Nome visualizzato                                                                         | Il tuo nome                                                                                            |
| `AnalyticsScreen.tsx`, stato vuoto | Le analitiche si costruiscono a ogni "Completa spesa": qui vedrai cosa comprate di più... | Quando tocchi "Spesa finita" qui vedi cosa compri di più, le categorie e ogni quanto ricompri le cose. |
| `AnalyticsScreen.tsx`              | Cosa avete comprato nell'ultimo mese, e quante volte                                      | Cosa è stato comprato nell'ultimo mese, e quante volte                                                 |
| `engine.ts`, suggerimenti          | Di solito lo comprate ogni 5 giorni                                                       | Di solito ogni 5 giorni                                                                                |
| `CompleteTripButton.tsx`, toast    | Spesa completata: 5 articoli                                                              | Spesa finita: 5 prodotti                                                                               |
| ovunque nei conteggi               | articolo, articoli                                                                        | prodotto, prodotti                                                                                     |
| `authErrors.ts`                    | Esiste già un account con questa email: prova ad accedere.                                | Questa email ha già un account. Prova ad accedere.                                                     |
| RPC in `supabase/migrations`       | Non fai parte di questo household · Household non trovato                                 | Non sei in questa lista · Questa lista non esiste più                                                  |
