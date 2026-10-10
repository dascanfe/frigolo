/**
 * Testi dell'interfaccia per profili, liste, inviti e onboarding.
 *
 * Seguono il tono di voce e il glossario di Zenzero (docs/comunicazione/).
 * Stanno qui, e non sparsi nei componenti, così si cambiano in un punto solo e
 * sono la base per l'inglese: le chiavi seguono lo schema `area.elemento`.
 */

/** Nome della mascotte (deciso da Daniele) */
export const MASCOT_NAME = 'Frigolo'

/** Email di contatto e supporto */
export const SUPPORT_EMAIL = 'frigolo@dascanfe.com'

/** Link delle donazioni (docs/DECISIONI.md) */
export const DONATION_URL = 'https://paypal.me/DanieleScanferlato'

/** Indirizzo dell'app senza protocollo, per il messaggio d'invito */
export function appHost(): string {
  return window.location.host
}

export const it = {
  login: {
    tagline: 'La lista della spesa sempre in tasca. Per conto tuo o in compagnia.',
    signin: 'Accedi',
    signup: 'Registrati',
    nameLabel: 'Il tuo nome',
    namePlaceholder: 'Es. Marta',
    nameHint: 'Va bene anche un soprannome.',
    passwordHint: 'Ti servirà per entrare da altri telefoni.',
    submitSignin: 'Entra',
    submitSignup: "Crea l'account",
    forgot: 'Password dimenticata?',
    forgotNoEmail: 'Scrivi prima la tua email, poi tocca "Password dimenticata?".',
    forgotSent: (email: string) =>
      `Se ${email} ha un account, ti arriva un'email con il link per scegliere una nuova password. Aprila da questo telefono.`,
    captchaFailed:
      'Non sono riuscito a verificare che sei una persona. Ricarica la pagina e riprova.',
    captchaWaiting: 'Controllo che sei una persona...',
    pendingInvite: "Ti hanno invitato in una lista: crea l'account o accedi e poi ci entri.",
  },
  checkEmail: {
    title: 'Controlla la posta',
    body: (email: string) =>
      `Ti ho mandato un link a ${email}. Aprilo da questo telefono e sei dentro.`,
    spam: 'Non la trovi? Guarda nella cartella spam o promozioni.',
    resend: 'Mandala di nuovo',
    resent: "Fatto, ti ho mandato un'altra email.",
    wrongEmail: 'Ho sbagliato email',
  },
  profile: {
    hello: 'Ciao!',
    title: 'Come ti chiami?',
    subtitle: 'Nome e foto li vede solo chi fa la spesa con te.',
    sheetTitle: 'Il tuo profilo',
    nameLabel: 'Il tuo nome',
    namePlaceholder: 'Es. Marta',
    nameHint: 'Va bene anche un soprannome.',
    nameEmpty: "Scrivi un nome, anche solo l'iniziale.",
    photoAdd: 'Carica una foto',
    photoChange: 'Cambia foto',
    photoRemove: 'Torna alla mascotte',
    photoHint: 'Facoltativa: senza foto ci sono io, Frigolo, sul tuo colore.',
    photoLoading: 'Carico la foto...',
    photoBad: "Questa foto non riesco a usarla. Provane un'altra (JPG o PNG).",
    photoFailed: 'Non sono riuscito a caricare la foto. Riprova o vai avanti senza.',
    colorLabel: 'Il tuo colore',
    colorHint: 'Serve a capire al volo chi ha messo cosa in lista.',
    next: 'Avanti',
    save: 'Salva',
    saving: 'Salvo...',
    saved: 'Profilo aggiornato',
    saveFailed: 'Non sono riuscito a salvare il profilo. Riprova tra poco.',
  },
  firstList: {
    title: 'La tua prima lista',
    subtitle: 'Puoi usarla per conto tuo o con chi vuoi. Altre liste le crei quando servono.',
    solo: 'Per conto mio',
    soloHint: 'Una lista solo tua. Puoi invitare qualcuno anche dopo.',
    shared: 'Con altre persone',
    sharedHint: 'Dopo averla creata ti do un link da mandare.',
    code: 'Ho un codice',
    codeHint: 'Qualcuno ti ha già invitato in una lista.',
    nameSubtitle: 'Come la chiami?',
  },
  lists: {
    nameLabel: 'Nome della lista',
    nameDefault: 'Casa',
    nameExamples: ['Casa', 'Ufficio', 'Coinquilini', 'Mamma e papà', 'Weekend al mare'],
    nameHint: 'Puoi cambiarlo quando vuoi.',
    nameEmpty: 'Dai un nome alla lista, anche solo "Casa".',
    create: 'Crea la lista',
    creating: 'Creo la lista...',
    createFailed: 'Non sono riuscito a creare la lista. Riprova tra poco.',
    created: (name: string) => `Lista "${name}" creata`,
    switch: 'Cambia lista',
    yourLists: 'Le tue liste',
    newList: 'Nuova lista',
    current: 'Aperta ora',
    people: 'Persone',
    peopleCount: (n: number) => (n === 1 ? 'Solo tu' : `${n} persone`),
    you: 'Sei tu',
    alone: 'Solo tu, per ora. Invita qualcuno quando vuoi.',
    rename: 'Rinomina',
    renamed: 'Nome cambiato',
    leave: 'Lascia la lista',
    leaveConfirm: (name: string) =>
      `Vuoi lasciare la lista "${name}"? Potrai rientrare solo con un nuovo invito.`,
    leaveLastConfirm: (name: string) =>
      `Sei l'unica persona nella lista "${name}": se la lasci, la lista sparisce con tutti i prodotti e le spese.`,
    left: (name: string) => `Hai lasciato la lista "${name}"`,
    leftDeleted: (name: string) => `Lista "${name}" eliminata`,
    delete: 'Elimina la lista',
    deleteConfirm: (name: string) =>
      `Vuoi eliminare la lista "${name}"? Spariscono anche i prodotti creati e le spese. Non si può annullare.`,
    deleted: 'Lista eliminata',
    actionFailed: 'Non ci sono riuscito. Controlla la rete e riprova.',
    limit: "Hai già 2 liste, il massimo. Per crearne o raggiungerne un'altra, lasciane una.",
    limitHint:
      "Puoi avere al massimo 2 liste. Per crearne una nuova o entrare in un'altra, lasciane una dalle Impostazioni.",
    switched: (name: string) => `Ora sei nella lista "${name}"`,
  },
  invite: {
    title: 'Invita chi fa la spesa con te',
    subtitle: (list: string) =>
      `Chi entra in "${list}" vede la stessa lista e la aggiorna dal suo telefono.`,
    sectionTitle: 'Invita qualcuno',
    share: "Manda l'invito",
    copyLink: 'Copia il link',
    linkCopied: 'Link copiato',
    messageCopied: 'Messaggio copiato: incollalo dove vuoi',
    orCode: 'Oppure dài questo codice:',
    codeHint: 'Chi lo riceve apre Frigolo e tocca "Ho un codice".',
    newCode: 'Nuovo invito',
    newCodeConfirm: 'Il codice e il link di prima smettono di funzionare. Vuoi crearne di nuovi?',
    newCodeButton: 'Crea un nuovo invito',
    newCodeDone: 'Nuovo invito pronto',
    validUntil: (date: string) => `Codice e link valgono fino al ${date}.`,
    expired: 'Questo invito è scaduto. Tocca "Nuovo invito" e mandalo di nuovo.',
    later: 'Lo faccio dopo',
    done: 'Fatto',
    message: (list: string, link: string, app: string, code: string) =>
      `Ciao! Per la spesa uso Frigolo: entra nella lista "${list}" così la teniamo aggiornata insieme.\n${link}\nSe il link non si apre, vai su ${app} e usa il codice ${code}.`,
    shareTitle: (list: string) => `Lista "${list}" su Frigolo`,
  },
  join: {
    title: 'Entra in una lista',
    subtitle: 'Scrivi il codice che ti hanno mandato.',
    codeLabel: "Codice d'invito",
    codePlaceholder: 'ABCD2345',
    codeHint: '8 tra lettere e numeri. Lo trova chi ti invita, nelle Impostazioni della lista.',
    submit: 'Entra nella lista',
    joining: 'Entro nella lista...',
    noCode: 'Non ho un codice',
    badCode: 'Questo codice non funziona. Controlla le lettere o chiedine uno nuovo.',
    badLink: "Questo invito non vale più. Chiedi a chi te l'ha mandato un link nuovo.",
    already: 'Sei già in questa lista. Ti ci porto.',
    tooMany: 'Troppi tentativi. Aspetta qualche minuto e riprova.',
    full: 'Questa lista è piena: ci sono già 5 persone, il massimo.',
    fullInvite:
      'Questa lista ha già 5 persone, il massimo. Se qualcuno la lascia, puoi invitare qualcun altro.',
    limitInvite:
      'Hai già 2 liste, il massimo. Per entrare in questa lasciane prima una dalle Impostazioni.',
    joined: (list: string) => `Sei nella lista "${list}"`,
    memberJoined: (name: string, list: string) => `${name} ora è nella lista "${list}" 🎉`,
    inviteTitle: (list: string) => `Ti invitano in "${list}"`,
    inviteSubtitle: (count: number) =>
      count === 1
        ? "C'è già una persona. Entrando vedi la sua lista e la aggiorni anche tu."
        : `Ci sono già ${count} persone. Entrando vedi la loro lista e la aggiorni anche tu.`,
    decline: 'No, grazie',
    checking: "Guardo l'invito...",
  },
  nav: {
    label: 'Navigazione principale',
    list: 'Lista',
    catalog: 'Catalogo',
    analytics: 'Analitiche',
    settings: 'Impostazioni',
  },
  list: {
    loading: 'Carico la lista...',
    nothingToBuy: 'Niente da comprare',
    toBuy: 'Da comprare',
    allTaken: 'Tutto preso: completa la spesa quando vuoi.',
    nothingElseAt: (store: string) => `Niente altro da comprare da ${store}.`,
    cart: 'Nel carrello',
    cartHint:
      'Se nessuno tocca "Spesa finita", il carrello si salva da solo stanotte. Fino ad allora un tocco rimette il prodotto in lista.',
    results: 'Risultati',
    resultsLabel: 'Risultati della ricerca',
    noResults: 'Nessun prodotto',
    noResultsHint: 'Prova con un altro nome.',
    create: (name: string) => `Crea "${name}"`,
    recent: 'Gli ultimi acquisti',
    recentHint: 'Le cose comprate di recente: un tocco per rimetterle in lista.',
    suggested: 'Suggeriti per te',
    suggestedHint:
      'In base a ogni quanto si ricompra una cosa e a cosa è di stagione. Tieni premuto per il motivo.',
    all: 'Tutti',
    filterByStore: 'Filtra per supermercato',
  },
  trip: {
    title: 'Spesa finita 🥳',
    done: (count: string) => `Spesa finita: ${count}`,
    confirm: (count: string) => `Conferma ${count}`,
    saving: 'Salvo...',
    intro: 'I prodotti nel carrello finiscono nello storico degli acquisti.',
    remaining: (count: string) => ` ${count} in lista per la prossima volta.`,
    where: 'Dove hai fatto la spesa?',
    stores: 'Supermercati',
    otherStore: 'Oppure scrivi il negozio (facoltativo)',
    otherStorePlaceholder: 'Es. il mercato del sabato',
    failed: 'Non sono riuscito a chiudere la spesa. Riprova tra poco.',
  },
  offline: {
    pendingOne: 'Offline: 1 modifica in attesa di rete',
    pendingMany: (n: number) => `Offline: ${n} modifiche in attesa di rete`,
    idle: 'Offline: le modifiche partono appena torna la rete',
    syncing: (n: number) =>
      n === 1 ? 'Sincronizzo 1 modifica...' : `Sincronizzo ${n} modifiche...`,
  },
  app: {
    section: 'App',
    version: 'Versione',
    offlineUse: 'Uso offline',
    offlineDev: 'Non attivo in sviluppo',
    offlineUpdate: 'Aggiornamento disponibile',
    offlineReady: 'Pronto',
    offlineNone: 'Non disponibile',
    updateFound: 'Nuova versione trovata: tocca "Aggiorna adesso"',
    upToDate: "Sei già all'ultima versione",
    updateCheckFailed: 'Controllo non riuscito, riprova con la rete attiva',
    updating: 'Aggiorno...',
    updateNow: 'Aggiorna adesso',
    checking: 'Controllo...',
    checkUpdates: 'Controlla aggiornamenti',
    updateHint:
      "L'app controlla da sola ogni ora e quando torna in primo piano; qui puoi forzare il controllo.",
  },
  account: {
    section: 'Account',
    email: 'Email',
    changePassword: 'Cambia password',
  },
  customItems: {
    title: 'I prodotti di questa lista',
    loading: 'Carico...',
    empty: 'Nessun prodotto creato in questa lista. Si aggiungono dalla ricerca o dal catalogo.',
    archived: 'archiviato',
  },
  theme: {
    section: 'Tema',
  },
  tips: {
    added: 'Fatto, è in lista. Tieni premuto un prodotto per cambiare quantità o supermercato.',
    create: 'Non c\'è? Scrivilo nella ricerca e tocca "Crea": lo aggiungo al catalogo.',
    cart: 'Al supermercato tocca i prodotti man mano che li prendi: finiscono nel carrello.',
    finish: 'Hai finito? Tocca "Spesa finita" e tengo il conto di cosa hai comprato.',
    firstTrip: 'Prima spesa fatta 🥳 Nelle Analitiche vedi cosa compri di più.',
    ok: 'Ok',
  },
  install: {
    title: 'Tienila sulla schermata Home',
    ios: 'Tocca Condividi e poi "Aggiungi alla schermata Home".',
    android: "Si apre come un'app, anche senza rete.",
    button: 'Installa',
    dismiss: 'Non mostrare più',
  },
  emptyList: {
    title: 'Cosa manca?',
    subtitle: 'Tocca un prodotto per metterlo in lista. Toccalo di nuovo per toglierlo.',
    starters: 'Per cominciare',
    starterNames: ['Latte fresco', 'Pane', 'Uova', 'Banane', 'Caffè macinato', 'Carta igienica'],
    openCatalog: 'Apri il catalogo',
  },
  donation: {
    label: 'Offrimi un caffè 💚',
    text: 'Frigolo è gratis e lo resta. Se ti è utile, puoi offrire un caffè a chi la sviluppa.',
  },
  support: {
    text: "Un dubbio, un problema o un'idea? Scrivi a",
  },
  errors: {
    network: 'Nessuna connessione. Controlla la rete e riprova.',
    loadLists: 'Non riesco a caricare le liste',
  },
  common: {
    wait: 'Un attimo...',
    cancel: 'Annulla',
    close: 'Chiudi',
    retry: 'Riprova',
    signOut: 'Esci',
    save: 'Salva',
  },
} as const
