# Come parla Frigolo

Guida al tono di voce per l'app, la landing, il README, le email e i social.
La scrive Zenzero, la usano tutti. Se un testo non torna con questa guida, si corregge il testo
oppure si apre una discussione per cambiare la guida: mai tutte e due le cose in silenzio.

Glossario dei termini: [glossario.md](glossario.md). Testi pronti: [testi-onboarding.md](testi-onboarding.md),
[email.md](email.md).

## In breve

Frigolo è un frigorifero simpatico che tiene la lista al posto tuo. Parla poco, dice le cose
come stanno e ogni tanto fa un sorriso. Ti dà del tu, usa parole da cucina e non da ufficio,
non ti fa mai sentire in colpa.

## Da dove partiamo

La voce c'è già, nell'app di oggi. Funziona e la teniamo:

- Frasi corte e pratiche: "Tutto preso: completa la spesa quando vuoi.", "Niente da comprare".
- L'app parla in prima persona mentre lavora: "Carico la lista...", "Salvo...",
  "Non sono riuscito a salvare il prodotto."
- Un tocco di festa solo al momento giusto: "Spesa finita 🥳".
- Gli errori dicono cosa fare: "Nessuna connessione. Controlla la rete e riprova."

Quello che cambia con l'apertura al pubblico:

- Frigolo non è più "la lista della coppia". Si usa da soli, in due, in cinque, e si possono
  avere più liste (casa, ufficio, coinquilini, genitori). Spariscono "partner", "siete in due",
  "la casa" come concetto.
- Chi la usa è uno sconosciuto: niente frasi che danno per scontato chi è o con chi vive.
- È gratis, con una donazione facoltativa. Il tono sul caffè è leggero e senza insistere.

## La mascotte

La mascotte è il frigorifero verde acqua con l'occhiolino, il pollice alzato e la busta della
spesa (`public/mascot.png`). Oggi non ha un nome.

**Proposta: la mascotte si chiama Frigolo.** L'app e il personaggio coincidono: quando l'app
dice "Non sono riuscito a salvare", è il frigorifero che parla. È il nome che la gente ricorda
già, non serve spiegarlo e l'italiano dell'app è già al maschile ("Non sono riuscito").

Alternative, se Daniele preferisce un personaggio con un nome suo:

| Nome      | Pro                                                        | Contro                                                                                    |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Brina** | Breve, dolce, legata al freddo, si ricorda                 | Femminile: tutte le frasi in prima persona vanno volte al femminile ("Non sono riuscita") |
| **Polo**  | Gioca con Frigo-lo e con il Polo Nord, suona come un amico | Può far pensare alla maglietta o alle mentine                                             |
| **Gelo**  | Corto, simpatico in un fumetto                             | Un po' freddo come parola (letteralmente), poco caldo per un tono caldo                   |

Come usarla:

- **Dove sì:** schermata di accesso, stati vuoti, fine onboarding, festa a fine spesa, email,
  social, pagina 404, errori gravi in cui serve un volto amico.
- **Dove no:** dentro i flussi veloci (lista, catalogo, carrello). Lì conta la velocità, non la
  simpatia.
- **Espressioni:** la base è quella di oggi (occhiolino e pollice). Per Paprika servono almeno tre
  varianti: contenta (fine spesa, conferme), pensierosa (stati vuoti, attese), dispiaciuta
  (errori). Mai arrabbiata, mai triste davvero.
- La mascotte non fa battute sulle persone, sul peso, sulla dieta, su quanto si spende.

## Personalità

| Frigolo è...       | ...ma non è                            |
| ------------------ | -------------------------------------- |
| Pratico            | Freddo o burocratico                   |
| Allegro            | Su di giri, pieno di esclamativi       |
| Di casa, alla mano | Sciatto o in dialetto                  |
| Discreto           | Invadente, non manda notifiche inutili |
| Ironico ogni tanto | Sarcastico con chi lo usa              |

## Principi

1. **Prima l'utile, poi il simpatico.** Un testo deve funzionare anche senza la battuta. Se
   la battuta allunga o confonde, si toglie.
2. **Corto.** Titoli fino a 4-5 parole. Sottotitoli una frase. Bottoni 1-3 parole.
3. **Verbi concreti.** Aggiungi, togli, invita, entra, salva. Non "gestisci", "effettua",
   "procedi", "visualizza".
4. **Cosa è successo e cosa fare.** Ogni errore dice il problema in parole semplici e la mossa
   successiva. Mai codici tecnici, mai "errore 500".
5. **Mai colpa a chi usa l'app.** "Il codice non funziona" e non "Hai inserito un codice
   sbagliato". Quando è colpa nostra lo diciamo: "Non sono riuscito a...".
6. **Vale per chi è da solo e per chi è in compagnia.** Ogni frase deve funzionare sia per chi
   ha una lista tutta sua sia per chi la condivide con quattro coinquilini.
7. **Neutro rispetto al genere.** Niente "Benvenuto", "Sei sicuro?", "Sei pronto". Si gira la
   frase: "Ciao!", "Vuoi davvero...?", "Tutto pronto".
8. **Una sola emoji, e non sempre.** Al massimo una per testo, solo nei momenti belli (spesa
   finita, caffè, invito accettato). Mai negli errori.

## Forme e lessico

### Tu, io, noi

- **Tu** a chi usa l'app, sempre. Anche nelle email e sui social.
- **Io** quando l'app parla di quello che sta facendo: "Carico...", "Salvo...",
  "Non riesco a caricare la lista". Chi parla è Frigolo.
- **Niente voi rivolto al gruppo.** "Di solito lo comprate ogni 5 giorni" non funziona per chi è
  da solo. Si usa una forma che vale per tutti: "Di solito ogni 5 giorni", "Preso 4 volte questo
  mese".
- **Noi** solo dove parla il progetto: README, landing, social, pagine legali ("Non vendiamo i
  tuoi dati"). Nell'app no.
- **Daniele in prima persona** solo nel caffè: "Offrimi un caffè 💚". È lui che lo beve.

### Le parole

Le scelte principali (l'elenco completo è nel [glossario](glossario.md)):

- **lista**: la lista condivisa (nel codice `household`). Ogni persona può averne più di una.
  Non si dice più "casa" per indicarla: "Casa" resta solo come nome d'esempio.
- **spesa**: il giro al supermercato, dall'inizio a "Spesa finita". Lo storico è "le spese".
- **carrello**: i prodotti già presi durante la spesa.
- **prodotto**: la cosa che si compra, nel catalogo, in lista e nel carrello. Nei conteggi si
  dice "3 prodotti", non "3 articoli" (oggi l'app usa tutte e due: si allinea su "prodotti").
- **persone della lista**: chi condivide una lista. In un titolo basta "Persone". Mai "membri",
  "utenti", "partner", "famiglia" (non tutti condividono con la famiglia).
- **invito**: il codice o il link per entrare in una lista. "Codice d'invito", "link d'invito".
- **toccare**, non "cliccare" né "tappare".
- **Spesa finita** è il nome del gesto di chiusura. Oggi convivono "Completa spesa" e "Spesa
  finita": resta solo "Spesa finita".

### Grafia

- Solo il trattino corto `-`. Per gli incisi virgola, due punti, parentesi.
- Accenti veri: è, più, perché, già, né. "E'" con l'apostrofo è sbagliato: si scrive "È".
- Puntini di sospensione: tre punti `...` (come oggi nell'app), solo per le attese.
- Maiuscola solo all'inizio: "Spesa finita", non "Spesa Finita".
- Virgolette dritte `"..."` per citare un bottone: tocca "Spesa finita".
- Niente punto alla fine di titoli e bottoni. Punto alla fine delle frasi nei sottotitoli e nei
  messaggi.
- Niente punto esclamativo negli errori. Al massimo uno nelle conferme belle.
- Numeri in cifre: "3 prodotti", "ogni 5 giorni".

## Cose da non dire mai

- "Benvenuto", "Sei sicuro?", "Caro utente", "Ti abbiamo invitato", qualunque participio o
  aggettivo al maschile o al femminile riferito a chi usa l'app (dell'altra persona sappiamo il
  nome, non il genere: "Luca ora è nella lista", non "Luca è entrato").
- "Partner", "tua moglie", "tuo marito", "la tua famiglia" dati per scontati.
- "Utente", "account owner", "admin", "household", "membro", "workspace".
- "Ops! Qualcosa è andato storto" senza dire cosa fare dopo.
- "Errore", "Operazione completata con successo", "Si prega di", "Effettua il login".
- "Gratis per sempre!" (promessa che non dipende solo da noi). Si dice "È gratis e lo resta".
- Frasi che fanno sentire in colpa sul cibo, sul peso, su quanto o cosa si compra.
- Battute sul buttare il cibo, sullo spreco, sui prezzi.
- Inviti a donare dentro i flussi (lista, spesa, errori) o dopo un problema.
- Le frasi fatte da pubblicità: "rivoluziona", "scopri", "in un mondo in cui", "non solo... ma
  anche", "la tua spesa, semplificata", tre aggettivi in fila.
- Emoji a pioggia, maiuscole per urlare, "!!!".

## Esempi

### Errori

| Giusto                                                                 | Sbagliato                          | Perché                                  |
| ---------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| Nessuna connessione. Controlla la rete e riprova.                      | Errore di rete (code: FetchError)  | Niente codici, dice cosa fare           |
| Questo codice non funziona. Controlla le lettere o chiedine uno nuovo. | Codice non valido!                 | Non dà la colpa, offre una via d'uscita |
| Non sono riuscito a salvare il prodotto. Riprova tra poco.             | Ops! Qualcosa è andato storto 😅   | Dice cosa non è andato, niente emoji    |
| Email o password sbagliate.                                            | Credenziali non valide.            | Parole di tutti i giorni                |
| Sei già in questa lista.                                               | Fai già parte di questo household. | "Household" è una parola del codice     |

### Stati vuoti

| Giusto                                                                                            | Sbagliato                                |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Lista vuota.** Tocca un prodotto del catalogo per metterlo in lista.                            | Nessun elemento presente.                |
| **Ancora nessuna spesa.** Quando tocchi "Spesa finita" qui vedi cosa compri di più e ogni quanto. | Non hai ancora effettuato nessuna spesa! |
| **Nessun prodotto.** Prova con un altro nome, oppure crealo tu.                                   | 0 risultati trovati per la tua ricerca.  |
| **Solo tu, per ora.** Invita qualcuno quando vuoi: la lista si aggiorna su tutti i telefoni.      | Non hai ancora invitato il tuo partner.  |

### Conferme

| Giusto                                                                       | Sbagliato                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------- |
| Spesa finita: 12 prodotti                                                    | Operazione completata con successo.           |
| Pane creato e aggiunto alla lista                                            | Il prodotto è stato creato correttamente.     |
| Vuoi lasciare la lista "Ufficio"? Potrai rientrare solo con un nuovo invito. | Sei sicuro di voler uscire?                   |
| Lista eliminata                                                              | La lista è stata eliminata definitivamente!!! |

Per le azioni che non si possono annullare il bottone dice l'azione ("Elimina la lista"), non
"OK" né "Sì".

### Inviti

| Giusto                                     | Sbagliato                              |
| ------------------------------------------ | -------------------------------------- |
| Invita chi fa la spesa con te              | Invita il tuo partner                  |
| Marta ti invita nella lista "Coinquilini". | Hai ricevuto un invito a un household. |
| Luca ora è nella lista "Casa" 🎉           | Nuovo membro aggiunto.                 |

Il messaggio da mandare su WhatsApp è in [testi-onboarding.md](testi-onboarding.md#messaggio-di-invito).

### Notifiche

Oggi Frigolo non manda notifiche push. Se arriveranno, la regola è: poche, utili, spegnibili.
Mai notifiche per riportare la gente nell'app.

| Giusto                                           | Sbagliato                                              |
| ------------------------------------------------ | ------------------------------------------------------ |
| Marta ha aggiunto 3 prodotti a "Casa"            | Ehi! Ci sono novità nella tua lista! Corri a vedere 👀 |
| Nuova versione pronta: riapri Frigolo per averla | Aggiornamento disponibile. Effettua l'aggiornamento.   |
| Luca ha finito la spesa: 18 prodotti             | La spesa è stata completata da un membro.              |

### Email

Oggetto corto e chiaro, anteprima che completa l'oggetto, un solo bottone. Firma: "Frigolo".

| Giusto                                      | Sbagliato                                                  |
| ------------------------------------------- | ---------------------------------------------------------- |
| Oggetto: Conferma la tua email              | Oggetto: [Frigolo] Azione richiesta: verifica account      |
| Bottone: Conferma l'email                   | Bottone: Clicca qui                                        |
| Se non hai chiesto tu, ignora questa email. | Se non sei stato tu, contatta immediatamente l'assistenza. |

Testi completi in [email.md](email.md).

### Social

Frasi da persona, non da azienda. Una cosa per post. Il tono è quello di un amico che ti mostra
un trucco, non di una pubblicità.

| Giusto                                                                                                     | Sbagliato                                                                           |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Il latte l'ha aggiunto la tua coinquilina mentre eri già al supermercato. Te ne accorgi prima della cassa. | Scopri Frigolo, l'app che rivoluziona la tua spesa! 🛒🔥✨                          |
| Frigolo mette la lista in ordine di corsia: frutta e verdura prima, surgelati alla fine.                   | Non solo una lista della spesa, ma anche un assistente intelligente, veloce, smart. |
| Gratis, senza pubblicità, il codice è pubblico. Se ti piace, il caffè lo offri tu 💚                       | Supportaci ora o Frigolo potrebbe sparire!                                          |

## Il caffè (donazioni)

- Il bottone si chiama sempre **"Offrimi un caffè 💚"** e porta a `https://paypal.me/DanieleScanferlato`.
- Frase di accompagnamento: "Frigolo è gratis e lo resta. Se ti è utile, puoi offrire un caffè a
  chi la sviluppa."
- Dove: landing, README, una riga in fondo alle Impostazioni. Non nei flussi, non negli errori,
  non nelle email di sistema, non come finestra che si apre da sola.
- Dopo una donazione non c'è niente da sbloccare: chi dona e chi no usa la stessa app.

## Controllo prima di pubblicare un testo

- [ ] Funziona per chi è da solo e per chi condivide?
- [ ] È neutro rispetto al genere?
- [ ] Usa i termini del glossario?
- [ ] Se è un errore, dice cosa fare?
- [ ] Solo trattini corti, accenti veri, al massimo una emoji?
- [ ] Letto ad alta voce, suona come una persona?
