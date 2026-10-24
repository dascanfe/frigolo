/* ============================================================
   Cruscotto di Frigolo

   Rifatto sul cruscotto delle statistiche di dascanfe.com: stessa
   impostazione, stessi grafici, stesso tempo reale, con i caratteri
   e i colori di Frigolo. Due sezioni:

   - Landing: le stesse tre tabelle del sito (visite, pagine,
     eventi) nel progetto delle statistiche, filtrate sulle pagine
     sotto /sub/frigolo (colonna pagine.sito). Le leggono solo le
     regole gia' in vigore: solo l'account di Daniele.
   - App: gli aggregati d'uso dell'app. Li calcola ogni ora il
     database di Frigolo e li manda a questo progetto (tabella
     frigolo_app_snapshot, stesse regole delle visite): cosi' basta
     un solo accesso, quello delle statistiche.
   ============================================================ */
(function () {
  'use strict';

  var opzioniClient = { auth: { persistSession: true, autoRefreshToken: true } };
  var sb    = supabase.createClient(window.CONFIG.analitiche.url, window.CONFIG.analitiche.anon, opzioniClient);

  /* I link che portano all'app: il pulsante Apri Frigolo e quelli
     dentro le istruzioni di installazione. */
  var VERSO_APP = /^https?:\/\/(frigolo\.dascanfe\.com|frigolo-app\.vercel\.app)(\/|$)/i;
  function versoApp(e) {
    return VERSO_APP.test(e.destinazione || '') || /^frigolo:(apri-app|installa-)/.test(e.nome || '');
  }

  var stato = {
    giorni: 0,          // 0 = oggi
    tutto: false,
    visite: [],
    pagine: [],
    eventi: [],
    download: null,
    prima: null,
    ora: null,
    sistema: null,
    percorsoScelto: null,
    canale: null,
    ricarica: null,
    sezione: 'landing',
    finto: false,
    app: null,
    appPrima: null
  };

  try {
    var sezioneSalvata = localStorage.getItem('frigolo-stat.sezione');
    if (sezioneSalvata === 'app' || sezioneSalvata === 'landing') stato.sezione = sezioneSalvata;
  } catch (e) {}

  /* ---------- aiuti ---------- */

  var $ = function (id) { return document.getElementById(id); };

  function testo(el, t) { el.textContent = t; }

  function numero(n) {
    return n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n);
  }

  function durata(ms) {
    if (!ms || ms < 1000) return '0 s';
    var s = Math.round(ms / 1000);
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60);
    var r = s % 60;
    return r ? m + 'm ' + r + 's' : m + ' min';
  }

  function mediana(v) {
    if (!v.length) return 0;
    var a = v.slice().sort(function (x, y) { return x - y; });
    var i = Math.floor(a.length / 2);
    return a.length % 2 ? a[i] : Math.round((a[i - 1] + a[i]) / 2);
  }

  function ora(iso) {
    var d = new Date(iso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function quantoFa(iso) {
    var s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 10) return 'adesso';
    if (s < 60) return s + ' s fa';
    var m = Math.floor(s / 60);
    if (m < 60) return m + ' min fa';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' h fa';
    return Math.floor(h / 24) + ' g fa';
  }

  function conta(righe, chiave) {
    var m = {};
    for (var i = 0; i < righe.length; i++) {
      var k = typeof chiave === 'function' ? chiave(righe[i]) : righe[i][chiave];
      if (k === null || k === undefined || k === '') continue;
      m[k] = (m[k] || 0) + 1;
    }
    return Object.keys(m)
      .map(function (k) { return { nome: k, valore: m[k] }; })
      .sort(function (a, b) { return b.valore - a.valore; });
  }

  /* La finestra del periodo scelto, e quella immediatamente prima,
     della stessa lunghezza: e' quella che rende leggibile un numero.
     "90 visite" non dice niente; "90 visite, il 18 per cento in piu'
     dei trenta giorni prima" dice qualcosa. */
  function finestra() {
    if (stato.tutto) {
      return { da: new Date(2020, 0, 1), a: new Date(Date.now() + 86400000) };
    }
    var a = new Date();
    var da = new Date();
    if (stato.giorni === 0) { da.setHours(0, 0, 0, 0); }
    else { da.setDate(da.getDate() - stato.giorni); da.setHours(0, 0, 0, 0); }
    return { da: da, a: a };
  }

  function finestraPrima() {
    if (stato.tutto) return null;
    var f = stato.giorni === 0 ? 1 : stato.giorni;
    var a = new Date(); a.setHours(0, 0, 0, 0);
    if (stato.giorni !== 0) { a.setDate(a.getDate() - stato.giorni); }
    var da = new Date(a);
    da.setDate(da.getDate() - f);
    return { da: da, a: a };
  }

  function daInizio() { return finestra().da.toISOString(); }

  /* ---------- suggerimento al passaggio ---------- */

  var tip = $('tip');

  function mostraTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add('visibile');
    var r = tip.getBoundingClientRect();
    var sx = Math.min(Math.max(8, x + 14), window.innerWidth - r.width - 8);
    var sy = y - r.height - 12;
    if (sy < 8) sy = y + 18;
    tip.style.left = sx + 'px';
    tip.style.top = sy + 'px';
  }
  function nascondiTip() { tip.classList.remove('visibile'); }

  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) mostraTip(el.getAttribute('data-tip'), e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) mostraTip(el.getAttribute('data-tip'), e.clientX, e.clientY);
    else nascondiTip();
  });
  document.addEventListener('mouseleave', nascondiTip);
  window.addEventListener('scroll', nascondiTip, { passive: true });

  /* ---------- spiegazioni dei riquadri ----------

     Ogni "i" e' un bottone: apre due righe, cosa misura il riquadro e
     perche' ci interessa. Si chiude con Esc, toccando fuori o di nuovo
     la stessa "i". */
  var SPIEGAZIONI = {
    "Visitatori": {
      "cosa": "Quante persone diverse hanno aperto la landing, stimate senza cookie.",
      "perche": "Dice quanta gente arriva a conoscere Frigolo: se resta basso, servono piu' post e link in giro."
    },
    "Visite": {
      "cosa": "Quante volte la landing e' stata aperta, contando come una sola le aperture ravvicinate della stessa persona.",
      "perche": "Se le visite sono molte piu' dei visitatori, qualcuno torna a guardarla: e' un buon segno di interesse."
    },
    "Pagine viste": {
      "cosa": "Quante pagine sono state aperte in tutto: landing, privacy e termini.",
      "perche": "Se cresce senza che crescano le visite, la gente cerca informazioni: vale la pena rendere la landing piu' chiara."
    },
    "Tempo per pagina": {
      "cosa": "Per quanto tempo, a meta' delle aperture, la pagina resta davvero davanti agli occhi.",
      "perche": "Pochi secondi vogliono dire che il messaggio non aggancia: si lavora sul titolo e sulla prima schermata."
    },
    "Scorrimento": {
      "cosa": "Fin dove scorrono la pagina, a meta' delle aperture.",
      "perche": "Se si fermano presto, le cose importanti (Apri Frigolo, istruzioni) vanno portate piu' in alto."
    },
    "Rimbalzo": {
      "cosa": "Quota di visite che se ne vanno subito, senza leggere e senza cliccare niente.",
      "perche": "Piu' e' basso meglio e': se sale, chi arriva non trova quello che si aspettava dal link che ha seguito."
    },
    "Apri Frigolo": {
      "cosa": "Visite in cui si e' toccato almeno un link che porta all'app.",
      "perche": "E' il risultato che conta: se e' basso rispetto alle visite, il pulsante va reso piu' visibile o convincente."
    },
    "Paesi": {
      "cosa": "Da quali paesi arrivano le visite, ricavati sul server senza salvare l'indirizzo.",
      "perche": "Se cresce l'estero, e' il momento di pensare alla versione inglese."
    },
    "Regioni": {
      "cosa": "Da quali regioni italiane arrivano le visite.",
      "perche": "Mostra dove il passaparola funziona e dove Frigolo e' ancora sconosciuto."
    },
    "Citta'": {
      "cosa": "Da quali citta' arrivano le visite, approssimate.",
      "perche": "Utile per capire se un post locale o un gruppo di una citta' ha portato gente."
    },
    "Adesso sulla landing": {
      "cosa": "Chi sta guardando la landing in questo momento, ultimi cinque minuti.",
      "perche": "Serve a vedere subito l'effetto di un post appena pubblicato."
    },
    "Visite per giorno": {
      "cosa": "Quante visite ogni giorno (o ogni ora, se il periodo e' oggi) e quante vanno all'app.",
      "perche": "I picchi raccontano quali post o link hanno funzionato: conviene rifare quello che li ha causati."
    },
    "A che ora arrivano": {
      "cosa": "In che ora del giorno arrivano le visite.",
      "perche": "Dice quando pubblicare i post per farli vedere a piu' persone."
    },
    "Nuove e di ritorno": {
      "cosa": "Visite di chi passa per la prima volta e di chi era gia' passato nella stessa giornata.",
      "perche": "Molti ritorni nella stessa giornata vogliono dire che si ragiona prima di provare: forse manca una risposta chiara."
    },
    "Pagine": {
      "cosa": "Le pagine piu' aperte, con il tempo di lettura.",
      "perche": "Se privacy e termini sono molto letti, la gente vuole fidarsi: vale la pena dirlo meglio sulla landing."
    },
    "Tempo per sezione": {
      "cosa": "Quanto tempo si passa su ogni sezione della pagina scelta.",
      "perche": "Le sezioni saltate si possono accorciare, quelle lette a lungo meritano piu' spazio."
    },
    "Fin dove leggono": {
      "cosa": "Quante aperture arrivano almeno a ogni punto della pagina.",
      "perche": "Il punto in cui la curva crolla e' dove si perdono le persone: li' va messo qualcosa di piu' interessante."
    },
    "Da dove entrano": {
      "cosa": "La prima pagina aperta in ogni visita.",
      "perche": "Quasi sempre e' la landing; se e' un'altra, qualcuno condivide quel link e va curata anche quella pagina."
    },
    "Da dove escono": {
      "cosa": "L'ultima pagina aperta in ogni visita.",
      "perche": "Uscire dopo Apri Frigolo va benissimo; uscire da privacy o termini puo' voler dire un dubbio non risolto."
    },
    "Indirizzi non trovati": {
      "cosa": "Indirizzi cercati che sul sito non esistono.",
      "perche": "Se un indirizzo torna spesso, qualcuno lo ha scritto sbagliato da qualche parte: si aggiunge un reindirizzamento."
    },
    "Da dove arrivano": {
      "cosa": "Il canale da cui arrivano le visite: social, motori di ricerca, link diretti, campagne.",
      "perche": "Dice dove investire il tempo: si insiste sui canali che portano gente e si lasciano quelli muti."
    },
    "Lingua guardata": {
      "cosa": "La lingua delle pagine aperte.",
      "perche": "Quando comparira' la versione inglese, dira' quanto viene usata."
    },
    "Con cosa guardano": {
      "cosa": "Dispositivo, sistema, browser, larghezza dello schermo.",
      "perche": "Se quasi tutti arrivano da iPhone, le istruzioni per iPhone devono essere perfette."
    },
    "Rete di provenienza": {
      "cosa": "Da quale rete internet arrivano le visite.",
      "perche": "Serve a riconoscere i programmi automatici e tenerli fuori dai numeri."
    },
    "Ultimi gesti": {
      "cosa": "Gli ultimi clic che contano e i link verso altri siti.",
      "perche": "Fa vedere cosa fanno davvero le persone sulla landing, uno sguardo veloce senza nomi."
    },
    "Registrazioni": {
      "cosa": "Quanti account sono stati creati nel periodo.",
      "perche": "E' la crescita di Frigolo: se rallenta, serve far girare di piu' la landing e gli inviti."
    },
    "Profili completati": {
      "cosa": "Quanti hanno scelto un nome nel periodo, sulle registrazioni.",
      "perche": "Se resta basso, il primo passo dopo l'iscrizione e' troppo faticoso e va semplificato."
    },
    "Persone attive": {
      "cosa": "Quante persone hanno fatto almeno una cosa nell'app nel periodo.",
      "perche": "Conta piu' delle iscrizioni: dice quanta gente usa davvero Frigolo."
    },
    "Liste condivise": {
      "cosa": "Liste con almeno due persone, sul totale delle liste.",
      "perche": "Frigolo nasce per fare la spesa in compagnia: se la quota e' bassa, invitare qualcuno va reso piu' facile."
    },
    "Prodotti aggiunti": {
      "cosa": "Quanti prodotti sono stati messi in lista nel periodo.",
      "perche": "E' il gesto principale dell'app: se cala mentre le persone restano, qualcosa nell'aggiunta da' fastidio."
    },
    "Spese completate": {
      "cosa": "Quante spese sono state chiuse, a mano o dal salvataggio notturno.",
      "perche": "Molte spese automatiche vogliono dire che il pulsante Spesa finita si dimentica o non si trova."
    },
    "Inviti usati": {
      "cosa": "Quante persone sono entrate nella lista di qualcun altro.",
      "perche": "Ogni invito usato porta una persona nuova senza pubblicita': e' la crescita migliore."
    },
    "Inviti sbagliati": {
      "cosa": "Tentativi di entrare con un codice sbagliato o scaduto.",
      "perche": "Pochi sono errori di battitura; un picco improvviso puo' essere qualcuno che prova codici a caso."
    },
    "Persone attive (andamento)": {
      "cosa": "Persone attive ogni giorno e nei sette giorni fino a quel giorno.",
      "perche": "Se la linea dei sette giorni sale, Frigolo sta entrando nelle abitudini."
    },
    "Registrazioni e prodotti": {
      "cosa": "Prodotti aggiunti e registrazioni, giorno per giorno.",
      "perche": "Se le registrazioni salgono e i prodotti no, chi arriva non comincia davvero a usare l'app."
    },
    "Inviti sbagliati per giorno": {
      "cosa": "Tentativi falliti di usare un invito, giorno per giorno.",
      "perche": "Serve ad accorgersi subito di un abuso: sopra i 30 in un giorno conviene guardare."
    },
    "Iscrizioni": {
      "cosa": "Account creati per settimana, per mese e per anno, anche quelli poi chiusi.",
      "perche": "E' la storia della crescita: si vede l'effetto del lancio e dei post nel tempo."
    },
    "Percorso di iscrizione": {
      "cosa": "Quante persone superano ogni passo, dalla visita alla landing al primo prodotto.",
      "perche": "Il passo con la caduta piu' grande e' quello da migliorare per primo."
    },
    "Quanto la usano": {
      "cosa": "Quanti giorni l'ha usata ogni persona attiva nel periodo, in gruppi.",
      "perche": "Molti in un giorno solo vogliono dire curiosi che non tornano; molti oltre i 15 sono fedelissimi."
    },
    "Sessioni": {
      "cosa": "Quante volte si apre l'app e quanto resta aperta, in media e a meta' delle sessioni.",
      "perche": "Una lista della spesa si usa in fretta: sessioni brevi e frequenti sono un buon segno."
    },
    "Versioni in uso": {
      "cosa": "Su quale versione dell'app girano le sessioni.",
      "perche": "Se una versione vecchia resta a lungo, l'aggiornamento non arriva: va spinto meglio."
    },
    "Temi scelti": {
      "cosa": "Quale tema di colori e' in uso nelle sessioni.",
      "perche": "Dice se i temi piacciono e quali conviene curare o aggiungere."
    },
    "Funzioni": {
      "cosa": "Quanto si usano alcune funzioni: Spesa finita, liste in compagnia, inviti, uso senza rete.",
      "perche": "Le funzioni poco usate o non si trovano o non servono: si decide se migliorarle o toglierle."
    },
    "Errori dell'app": {
      "cosa": "Errori capitati sui telefoni delle persone, con il messaggio ripulito.",
      "perche": "Piu' e' basso meglio e': un errore che si ripete spesso va corretto per primo."
    },
    "Ci tornano in settimana": {
      "cosa": "Media del periodo di quante persone attive in una settimana usano l'app ogni giorno.",
      "perche": "Piu' e' alto, piu' Frigolo e' un'abitudine quotidiana; se cala, si usa solo il giorno della spesa."
    },
    "Tempi del primo uso": {
      "cosa": "Quanto passa, a meta' delle persone, dall'iscrizione al primo prodotto, alla prima spesa chiusa e alla seconda persona in lista.",
      "perche": "Tempi lunghi vogliono dire un inizio faticoso: lo si accorcia con aiuti nell'app."
    },
    "Ritorno per settimana di iscrizione": {
      "cosa": "Per chi si e' iscritto in una certa settimana, quanti tornano nelle quattro settimane dopo.",
      "perche": "Se le settimane recenti trattengono di piu', le ultime modifiche funzionano."
    },
    "Prodotti piu' aggiunti": {
      "cosa": "I prodotti del catalogo messi in lista piu' spesso nel periodo. Mai quelli creati dalle persone.",
      "perche": "Questi prodotti devono essere i piu' facili da trovare, con l'icona giusta."
    },
    "Prodotti piu' aggiunti da sempre": {
      "cosa": "Gli stessi prodotti, contati da quando esiste Frigolo.",
      "perche": "Aiuta a ordinare il catalogo e i suggerimenti."
    },
    "Categorie": {
      "cosa": "Quota dei prodotti aggiunti per categoria, e quanti prodotti nuovi vengono creati.",
      "perche": "Se si creano molti prodotti, al catalogo manca qualcosa: vale la pena arricchirlo."
    },
    "Quando si fa la spesa": {
      "cosa": "In che giorno della settimana e a che ora si chiudono le spese, con quanti prodotti e quanto spesso.",
      "perche": "Dice quando l'app deve essere al massimo e quando conviene mandare un promemoria."
    },
    "Supermercati": {
      "cosa": "I supermercati scelti nelle spese chiuse, fra quelli proposti; gli altri insieme.",
      "perche": "Se un supermercato domina, l'ordine dei reparti per quello deve essere perfetto."
    },
    "Persone per lista": {
      "cosa": "Quante liste hanno 1, 2, 3 o piu' persone, come si entra (link o codice) e quanto passa dall'invito.",
      "perche": "Se si entra quasi sempre con il link, il codice si puo' nascondere; tempi lunghi vogliono dire inviti dimenticati."
    },
    "Foto profilo": {
      "cosa": "Quanti profili hanno una foto e quanti tengono la mascotte; quante ricerche non trovano niente.",
      "perche": "Molte ricerche a vuoto vogliono dire prodotti che mancano nel catalogo."
    },
    "Installazione": {
      "cosa": "Quante volte si vede l'invito a installare, quante si tocca e come finisce.",
      "perche": "Installata, Frigolo si apre prima e funziona offline: se pochi accettano, l'invito va riscritto."
    },
    "Aggiornamenti": {
      "cosa": "Quota delle sessioni sull'ultima versione, giorno per giorno, e uso della barra Aggiorna.",
      "perche": "Se la quota sale piano, la barra non convince e la gente resta indietro con le correzioni."
    },
    "Orari d'uso": {
      "cosa": "In che giorno e a che ora si apre l'app.",
      "perche": "Dice quando le persone hanno Frigolo in mano: e' il momento giusto per novita' e messaggi."
    },
    "Tornano?": {
      "cosa": "Fra chi si e' iscritto nel periodo, quanti tornano il giorno dopo, nella seconda settimana e nel secondo mese.",
      "perche": "E' la misura piu' onesta: se pochi tornano, la prima esperienza non convince."
    },
    "Spazio usato": {
      "cosa": "Quanto spazio occupano il database e le foto, sul limite del piano gratuito.",
      "perche": "Oltre l'80% bisogna fare pulizia o passare a un piano a pagamento."
    }
  };

  var spiega = $('spiega');
  var spiegaDa = null;

  function chiudiSpiega(rimettiFuoco) {
    if (!spiega || spiega.hidden) return;
    spiega.hidden = true;
    if (spiegaDa) {
      spiegaDa.setAttribute('aria-expanded', 'false');
      if (rimettiFuoco) spiegaDa.focus();
      spiegaDa = null;
    }
  }

  function apriSpiega(b) {
    var x = SPIEGAZIONI[b.getAttribute('data-spiega')];
    if (!x || !spiega) return;
    if (spiegaDa) spiegaDa.setAttribute('aria-expanded', 'false');
    var titolo = b.parentNode.querySelector('.t');
    $('spiega-titolo').textContent = titolo ? titolo.textContent : '';
    $('spiega-cosa').innerHTML = '<b>Cosa misura.</b> ' + fuga(x.cosa);
    $('spiega-perche').innerHTML = '<b>Perche\' ci interessa.</b> ' + fuga(x.perche);
    spiega.hidden = false;
    var r = b.getBoundingClientRect(), w = spiega.offsetWidth, h = spiega.offsetHeight;
    var left = Math.min(Math.max(8, r.left - 12), window.innerWidth - w - 8);
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    spiega.style.left = left + 'px';
    spiega.style.top = top + 'px';
    spiegaDa = b;
    b.setAttribute('aria-expanded', 'true');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button.info') : null;
    if (b) {
      if (spiegaDa === b) chiudiSpiega(false); else apriSpiega(b);
      return;
    }
    if (spiega && !spiega.hidden && !spiega.contains(e.target)) chiudiSpiega(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') chiudiSpiega(true);
  });
  window.addEventListener('scroll', function () { chiudiSpiega(false); }, { passive: true });
  window.addEventListener('resize', function () { chiudiSpiega(false); });

  /* ---------- disegno delle barre ---------- */

  function barre(contenitore, voci, opzioni) {
    opzioni = opzioni || {};
    var el = $(contenitore);
    el.innerHTML = '';

    if (!voci.length) {
      el.innerHTML = '<div class="vuoto">Ancora niente in questo periodo.</div>';
      return;
    }

    var max = opzioni.max || voci[0].valore || 1;
    voci.slice(0, opzioni.quante || 8).forEach(function (v) {
      var riga = document.createElement('div');
      riga.className = 'barra' + (opzioni.click ? ' cliccabile' : '') +
                       (opzioni.scelto === v.nome ? ' scelta' : '');
      if (v.tip) riga.setAttribute('data-tip', v.tip);

      var etichetta = opzioni.etichetta ? opzioni.etichetta(v) : v.nome;
      var cifra = opzioni.cifra ? opzioni.cifra(v) : numero(v.valore);

      riga.innerHTML =
        '<span class="testo"></span>' +
        '<span class="cifra">' + cifra + '</span>' +
        '<span class="pista"><i style="width:' + Math.max(1.5, (v.valore / max) * 100) + '%"></i></span>';
      riga.querySelector('.testo').textContent = etichetta;

      if (opzioni.click) {
        riga.tabIndex = 0;
        riga.addEventListener('click', function () { opzioni.click(v); });
        riga.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opzioni.click(v); }
        });
      }
      el.appendChild(riga);
    });
  }

  function tabella(contenitore, intestazioni, righe) {
    var el = $(contenitore);
    if (!righe.length) { el.innerHTML = '<div class="vuoto">Niente da mostrare.</div>'; return; }
    var h = '<table><thead><tr>' +
      intestazioni.map(function (t) { return '<th>' + t + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    righe.forEach(function (r) {
      h += '<tr>' + r.map(function (c, i) {
        return '<td' + (i ? ' class="v"' : '') + '>' + c + '</td>';
      }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  function fuga(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- la sessione ---------- */

  /* Il punto piu' insidioso di tutto il cruscotto.

     Quando il gettone d'accesso scade e non si riesce a rinnovarlo (il
     telefono era in tasca, il portatile chiuso, la rete non ancora
     pronta all'avvio), la libreria di Supabase non protesta: torna a
     usare la chiave pubblica come se niente fosse. E le regole di
     accesso del database non rispondono "non puoi", rispondono
     "niente": arriva un 200 con zero righe.

     Il risultato e' il peggiore possibile: un cruscotto che sembra
     funzionare e racconta che non e' passato nessuno. Per questo prima
     di ogni lettura si controlla che la sessione ci sia davvero, e se
     non c'e' si torna alla schermata d'accesso invece di disegnare il
     vuoto. */
  var SCADUTA = 'sessione-scaduta';
  var MUTO    = 'server-muto';

  /* Attenzione a `getSession`: se il gettone e' scaduto prova a
     rinnovarlo, e se la rete non risponde ci riprova a oltranza senza
     mai chiudere la promessa. Provato: dopo dodici secondi era ancora
     li'. Sull'iPhone che si sveglia, con la rete non ancora pronta,
     vuol dire restare appesi.

     Quindi le si da' un tempo massimo, oltre il quale si risponde
     "non lo so". Non lo so non e' "sessione scaduta": si tengono i
     numeri che c'erano e si dice che non si e' potuto aggiornare. */
  function sessioneViva() {
    var scadenza = new Promise(function (ok) {
      setTimeout(function () { ok(MUTO); }, 8000);
    });
    var domanda = sb.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s || !s.access_token) return null;
      // gia' scaduto e non rinnovato: vale come se non ci fosse
      if (s.expires_at && s.expires_at * 1000 <= Date.now()) return null;
      return s;
    }, function () { return null; });
    return Promise.race([domanda, scadenza]);
  }

  /* La riga di servizio in alto: la usa anche il collegamento dal vivo,
     quindi ognuno cancella solo il proprio messaggio. */
  function nota(testo) {
    var el = $('stato-nota');
    if (el) el.textContent = testo || '';
  }

  /* Si torna alla schermata d'accesso: si ferma tutto quello che gira
     in sottofondo, altrimenti continuerebbe a interrogare il database
     a vuoto. */
  function fuoriSessione(motivo) {
    chiudiSezione('landing', motivo || 'La sessione e\' scaduta. Rientra per continuare.');
    if (orologio) { clearInterval(orologio); orologio = null; }
    if (stato.canale) { sb.removeChannel(stato.canale); stato.canale = null; }
  }

  /* ---------- lettura dei dati ---------- */

  function carica() {
    if (stato.finto) { finteLanding(); disegna(); disegnaConfronti(); return Promise.resolve(); }
    return sessioneViva().then(function (viva) {
      if (viva === MUTO) throw new Error(MUTO);
      if (!viva) throw new Error(SCADUTA);
      apriSezione('landing');
      return leggi();
    });
  }

  function leggi() {
    var da = daInizio();

    /* Solo la landing: le pagine con sito = 'frigolo', le visite che
       ne hanno almeno una e i gesti fatti su quelle pagine. Il filtro
       sulle tabelle collegate lo fa il database (!inner). */
    return Promise.all([
      sb.from('visite').select('*, pagine!inner(sito)').eq('pagine.sito', 'frigolo')
        .gte('iniziata', da).order('iniziata', { ascending: false }).limit(5000),
      sb.from('pagine').select('*').eq('sito', 'frigolo')
        .gte('aperta', da).order('aperta', { ascending: false }).limit(10000),
      sb.from('eventi').select('*, pagine!inner(sito)').eq('pagine.sito', 'frigolo')
        .gte('quando', da).order('quando', { ascending: false }).limit(2000),
      /* Lo stato del battito notturno, per accorgersi se il progetto
         si e' addormentato. */
      sb.from('stato_sistema').select('*').limit(1)
    ]).then(function (r) {
      /* L'ultima richiesta, quella del battito, puo' fallire senza
         conseguenze. Le prime tre no. */
      var errore = r.slice(0, 3).find(function (x) { return x.error; });
      if (errore) throw errore.error;

      nota('');
      stato.visite = r[0].data || [];
      stato.pagine = r[1].data || [];
      stato.eventi = r[2].data || [];
      stato.download = null;
      stato.sistema = (r[3] && r[3].data && r[3].data[0]) ? r[3].data[0] : null;

      disegna();
      caricaPrima();
    });
  }

  /* Il periodo precedente si chiede dopo aver gia' disegnato: i numeri
     principali compaiono subito, il confronto si aggiunge un attimo
     dopo. Meglio che aspettare per avere tutto insieme. */
  function caricaPrima() {
    var f = finestraPrima();
    if (!f) { stato.prima = null; disegnaConfronti(); return; }

    var da = f.da.toISOString(), a = f.a.toISOString();

    Promise.all([
      sb.from('visite').select('id,impronta,bot, pagine!inner(sito)').eq('pagine.sito', 'frigolo')
        .gte('iniziata', da).lt('iniziata', a).limit(5000),
      sb.from('pagine').select('*').eq('sito', 'frigolo').gte('aperta', da).lt('aperta', a).limit(10000),
      sb.from('eventi').select('visita_id,nome,destinazione, pagine!inner(sito)').eq('pagine.sito', 'frigolo')
        .gte('quando', da).lt('quando', a).limit(5000)
    ]).then(function (r) {
      if (r.some(function (x) { return x.error; })) { stato.prima = null; disegnaConfronti(); return; }

      var visite = (r[0].data || []).filter(function (v) { return !v.bot; });
      var buone = {};
      visite.forEach(function (v) { buone[v.id] = 1; });
      // stesso criterio del periodo in corso, altrimenti il confronto
      // metterebbe a paragone due misure diverse
      var pagine = (r[1].data || []).filter(function (p) {
        return buone[p.visita_id] && (p.stato || 200) === 200;
      });

      var impronte = {};
      visite.forEach(function (v) { impronte[v.impronta] = 1; });

      var perVisita = {};
      pagine.forEach(function (p) { (perVisita[p.visita_id] || (perVisita[p.visita_id] = [])).push(p); });
      var conPagine = Object.keys(perVisita);
      var rimbalzi = conPagine.filter(function (id) {
        var g = perVisita[id];
        return g.length === 1 && g[0].ms_attivi < 10000;
      });

      stato.prima = {
        visitatori: Object.keys(impronte).length,
        visite: visite.length,
        pagine: pagine.length,
        tempo: mediana(pagine.map(function (p) { return p.ms_attivi; }).filter(function (n) { return n > 0; })),
        scroll: mediana(pagine.map(function (p) { return p.scroll_max; }).filter(function (n) { return n > 0; })),
        rimbalzo: conPagine.length ? Math.round((rimbalzi.length / conPagine.length) * 100) : null,
        download: (function () {
          var v = {};
          (r[2].data || []).forEach(function (e) { if (buone[e.visita_id] && versoApp(e)) v[e.visita_id] = 1; });
          return Object.keys(v).length;
        })()
      };
      disegnaConfronti();
    }).catch(function () { stato.prima = null; disegnaConfronti(); });
  }

  /* Il confronto: il colore dice se il movimento e' buono, non se il
     numero sale. Sul rimbalzo salire e' una brutta notizia. */
  function confronto(id, ora, prima, opzioni) {
    opzioni = opzioni || {};
    var el = $(id);
    if (!el) return;

    if (prima === null || prima === undefined || stato.prima === null) {
      el.textContent = '';
      el.className = 'delta';
      return;
    }

    if (prima === 0) {
      el.className = 'delta';
      el.textContent = ora > 0 ? 'prima non c\'era niente' : 'come prima: zero';
      return;
    }

    var scarto = Math.round(((ora - prima) / prima) * 100);
    if (scarto === 0) {
      el.className = 'delta';
      el.textContent = 'uguale al periodo prima';
      return;
    }

    var sale = scarto > 0;
    var bene = opzioni.saleEBene === false ? !sale : sale;
    el.className = 'delta ' + (bene ? 'bene' : 'male');
    el.innerHTML = '<span class="freccia">' + (sale ? '\u25b2' : '\u25bc') + '</span>' +
                   Math.abs(scarto) + '% ' + (opzioni.etichetta || 'sul periodo prima');
  }

  function disegnaConfronti() {
    var p = stato.prima;
    var o = stato.ora || {};
    if (!p) {
      ['d-visitatori','d-visite','d-pagine','d-tempo','d-scroll','d-rimbalzo','d-download']
        .forEach(function (id) { var el = $(id); if (el) { el.textContent = ''; el.className = 'delta'; } });
      return;
    }
    confronto('d-visitatori', o.visitatori, p.visitatori);
    confronto('d-visite',     o.visite,     p.visite);
    confronto('d-pagine',     o.pagine,     p.pagine);
    confronto('d-tempo',      o.tempo,      p.tempo);
    confronto('d-scroll',     o.scroll,     p.scroll);
    confronto('d-rimbalzo',   o.rimbalzo,   p.rimbalzo, { saleEBene: false });
    confronto('d-download',   o.download,   p.download);
  }

  /* ---------- calcolo e disegno ---------- */

  function disegna() {
    var robot = stato.visite.filter(function (v) { return v.bot; });
    var visite = stato.visite.filter(function (v) { return !v.bot; });

    var buone = {};
    visite.forEach(function (v) { buone[v.id] = v; });

    /* La pagina d'errore porta il tracciante come tutte le altre,
       altrimenti non si saprebbe quali vecchi indirizzi la gente cerca
       ancora. Ma le sue aperture non sono pagine del sito: se restano
       in mezzo, i conteggi si gonfiano con pagine che non esistono. */
    var pagine = stato.pagine.filter(function (p) {
      return buone[p.visita_id] && (p.stato || 200) === 200;
    });

    /* --- numeri chiave --- */

    var impronte = {};
    visite.forEach(function (v) { impronte[v.impronta] = 1; });

    var tempi   = pagine.map(function (p) { return p.ms_attivi; }).filter(function (n) { return n > 0; });
    var scrolli = pagine.map(function (p) { return p.scroll_max; }).filter(function (n) { return n > 0; });

    testo($('k-visitatori'), numero(Object.keys(impronte).length));
    testo($('k-visite'), numero(visite.length));
    testo($('k-pagine'), numero(pagine.length));
    testo($('k-pagine-nota'), visite.length
      ? (pagine.length / visite.length).toFixed(1) + ' pagine per visita'
      : '-');
    testo($('k-tempo'), durata(mediana(tempi)));
    testo($('k-scroll'), scrolli.length ? mediana(scrolli) + '%' : '-');

    /* Rimbalzo: una visita in cui si e' aperta una pagina sola, senza
       fermarcisi almeno dieci secondi. Chi apre una pagina e la legge
       due minuti non e' un rimbalzo, anche se non ne apre altre. */
    var perVisita = {};
    pagine.forEach(function (p) {
      (perVisita[p.visita_id] || (perVisita[p.visita_id] = [])).push(p);
    });
    var conPagine = Object.keys(perVisita);
    var rimbalzi = conPagine.filter(function (id) {
      var g = perVisita[id];
      return g.length === 1 && g[0].ms_attivi < 10000;
    });
    testo($('k-rimbalzo'), conPagine.length
      ? Math.round((rimbalzi.length / conPagine.length) * 100) + '%'
      : '-');
    testo($('k-rimbalzo-nota'), conPagine.length
      ? rimbalzi.length + ' visite su ' + conPagine.length
      : 'entrano e se ne vanno subito');

    /* Apri Frigolo: le visite con almeno un clic verso l'app. E' il
       posto che nel cruscotto del sito ha il curriculum scaricato. */
    var clicApp = stato.eventi.filter(function (e) { return buone[e.visita_id] && versoApp(e); });
    var visiteApp = {};
    clicApp.forEach(function (e) { visiteApp[e.visita_id] = 1; });
    stato.visiteApp = visiteApp;
    var quanti = Object.keys(visiteApp).length;
    testo($('k-download'), numero(quanti));

    stato.ora = {
      visitatori: Object.keys(impronte).length,
      visite: visite.length,
      pagine: pagine.length,
      tempo: mediana(tempi),
      scroll: scrolli.length ? mediana(scrolli) : 0,
      rimbalzo: conPagine.length ? Math.round((rimbalzi.length / conPagine.length) * 100) : null,
      download: quanti
    };
    disegnaConfronti();
    testo($('k-download-nota'), visite.length
      ? Math.round((quanti / visite.length) * 100) + '% delle visite, ' + clicApp.length + ' clic'
      : 'aprono l\'app');

    /* --- adesso sul sito --- */

    disegnaVivo(visite, pagine);

    /* --- visite per giorno --- */

    disegnaAndamento(visite);
    disegnaOrari(visite);
    disegnaRitorno(visite);
    disegnaEntrataUscita(perVisita);

    /* --- pagine --- */

    var perPercorso = {};
    pagine.forEach(function (p) {
      var g = perPercorso[p.percorso] || (perPercorso[p.percorso] = {
        nome: p.percorso, valore: 0, visitatori: {}, tempi: [], scrolli: [], titolo: p.titolo
      });
      g.valore++;
      g.visitatori[p.visita_id] = 1;
      if (p.ms_attivi > 0) g.tempi.push(p.ms_attivi);
      if (p.scroll_max > 0) g.scrolli.push(p.scroll_max);
    });

    var elencoPagine = Object.keys(perPercorso).map(function (k) {
      var g = perPercorso[k];
      g.nVisitatori = Object.keys(g.visitatori).length;
      g.tempoMediano = mediana(g.tempi);
      g.scrollMediano = mediana(g.scrolli);
      g.tip = '<b>' + fuga(g.nome) + '</b><div class="riga">' + g.valore + ' aperture · ' +
              g.nVisitatori + ' visitatori</div><div class="riga">' + durata(g.tempoMediano) +
              ' · scroll ' + g.scrollMediano + '%</div>';
      return g;
    }).sort(function (a, b) { return b.valore - a.valore; });

    if (!stato.percorsoScelto && elencoPagine.length) stato.percorsoScelto = elencoPagine[0].nome;

    barre('pagine', elencoPagine, {
      quante: 10,
      scelto: stato.percorsoScelto,
      cifra: function (v) { return v.valore + ' · ' + durata(v.tempoMediano); },
      click: function (v) { stato.percorsoScelto = v.nome; disegna(); }
    });

    tabella('pagine-tabella',
      ['Pagina', 'Aperture', 'Visitatori', 'Tempo', 'Scroll'],
      elencoPagine.map(function (g) {
        return [fuga(g.nome), g.valore, g.nVisitatori, durata(g.tempoMediano), g.scrollMediano + '%'];
      }));

    /* --- sezioni e curva di lettura della pagina scelta --- */

    disegnaSezioni(pagine);
    disegnaCurva(pagine);

    /* --- indirizzi che non esistono --- */

    disegnaMancanti();

    /* --- provenienza --- */

    barre('canali', conta(visite, 'canale'), { quante: 6 });
    barre('referenti', conta(visite, 'referente_host'), { quante: 6 });

    /* --- regioni e lingua --- */

    var regioni = conta(visite, function (v) {
      if (v.regione) return v.regione;
      return v.paese ? v.paese + ' (regione ignota)' : null;
    });
    var conRegione = regioni.reduce(function (a, r) { return a + r.valore; }, 0);
    testo($('conta-regioni'), conRegione + ' visite su ' + visite.length + ' localizzate');
    barre('regioni', regioni, { quante: 8 });

    var lingue = conta(pagine, function (p) {
      var l = (p.lingua || '').slice(0, 2).toLowerCase();
      if (l === 'it') return 'Italiano';
      if (l === 'en') return 'Inglese';
      return l ? l.toUpperCase() : null;
    });
    testo($('conta-lingue'), pagine.length + ' pagine viste');
    barre('lingue', lingue, { quante: 4 });

    var citta = conta(visite, 'citta');
    var conCitta = citta.reduce(function (a, r) { return a + r.valore; }, 0);
    testo($('conta-citta'), conCitta + ' su ' + visite.length + ' con la citta\'');
    barre('citta', citta, { quante: 8 });

    /* --- paesi --- */

    var paesi = conta(visite, 'paese');
    var conPaese = paesi.reduce(function (a, r) { return a + r.valore; }, 0);
    testo($('conta-paesi'), conPaese + ' su ' + visite.length + ' localizzate');
    barre('paesi', paesi, { quante: 8 });

    /* --- tecnologia --- */

    barre('dispositivi', conta(visite, 'dispositivo'), { quante: 3 });
    barre('sistemi', conta(visite, function (v) {
      if (!v.sistema) return null;
      return v.sistema + (v.browser ? ' · ' + v.browser : '');
    }), { quante: 6 });
    var reti = conta(visite, 'rete');
    if (reti.length) {
      var el = $('reti');
      if (el) barre('reti', reti, { quante: 5 });
    }

    barre('schermi', conta(visite, function (v) {
      var w = v.area_w || v.schermo_w;
      if (!w) return null;
      if (w < 480) return 'fino a 480';
      if (w < 768) return '480 - 768';
      if (w < 1100) return '768 - 1100';
      if (w < 1500) return '1100 - 1500';
      return 'oltre 1500';
    }), { quante: 5 });

    /* --- gesti --- */

    var gesti = stato.eventi.filter(function (e) { return buone[e.visita_id]; });
    testo($('conta-gesti'), gesti.length
      ? gesti.length + ' in questo periodo' + (gesti.length > 50 ? ', mostro i 50 piu\' recenti' : '')
      : '');
    tabella('gesti', ['Quando', 'Tipo', 'Cosa', 'Verso'],
      gesti.slice(0, 50).map(function (e) {
        return [
          ora(e.quando),
          '<span class="tipo ' + fuga(e.tipo) + '">' + fuga(e.tipo) + '</span>',
          fuga(e.nome || '-'),
          fuga(e.destinazione || '-')
        ];
      }));

    /* --- piede --- */

    testo($('piede-periodo'), stato.tutto ? 'periodo: tutto lo storico'
      : (stato.giorni === 0 ? 'periodo: oggi' : 'periodo: ultimi ' + stato.giorni + ' giorni'));
    testo($('piede-robot'), robot.length + ' visite di robot escluse dai numeri');
    testo($('piede-agg'), 'aggiornato alle ' + ora(new Date().toISOString()));

    var b = $('piede-battito');
    if (b) {
      if (!stato.sistema) {
        b.textContent = '';
      } else {
        var giorni = Math.floor((Date.now() - new Date(stato.sistema.battito).getTime()) / 86400000);
        b.textContent = giorni <= 1
          ? 'battito regolare'
          : 'ultimo battito ' + giorni + ' giorni fa, da controllare';

        /* Anche i database geografici invecchiano. Se passano piu' di
           45 giorni vuol dire che l'aggiornamento automatico si e'
           inceppato, e conviene saperlo prima che le citta' comincino
           a sbagliare. */
        var g = $('piede-geo');
        if (g) {
          if (!stato.sistema.geo_aggiornato) {
            g.textContent = 'database geografici: mai aggiornati da qui';
          } else {
            var gg = Math.floor((Date.now() - new Date(stato.sistema.geo_aggiornato).getTime()) / 86400000);
            g.textContent = gg <= 45
              ? 'database geografici aggiornati ' + (gg === 0 ? 'oggi' : gg + ' giorni fa')
              : 'database geografici fermi da ' + gg + ' giorni, da controllare';
          }
        }
      }
    }
  }

  function disegnaVivo(visite, pagine) {
    var limite = Date.now() - 5 * 60 * 1000;
    var attivi = visite.filter(function (v) {
      return new Date(v.vista_ultima).getTime() > limite;
    });

    /* L'indicazione in alto dice quante persone ci sono, non
       "dal vivo" a vuoto: se non c'e' nessuno lo dice. */
    var box = $('stato-vivo');
    if (box) box.classList.toggle('attivo', attivi.length > 0);
    testo($('stato-testo'), attivi.length
      ? (attivi.length === 1 ? '1 persona sulla landing' : attivi.length + ' persone sulla landing')
      : 'nessuno sulla landing');

    testo($('conta-vivo'), attivi.length
      ? attivi.length + (attivi.length === 1 ? ' persona' : ' persone') + ', ultimi 5 minuti'
      : 'ultimi 5 minuti');

    var ultimaPagina = {};
    pagine.forEach(function (p) {
      var a = ultimaPagina[p.visita_id];
      if (!a || new Date(p.aperta) > new Date(a.aperta)) ultimaPagina[p.visita_id] = p;
    });

    var el = $('vivo-lista');
    if (!attivi.length) {
      el.innerHTML = '<div class="vuoto">Nessuno sulla landing in questo momento. ' +
                     'Quando entra qualcuno compare qui da solo.</div>';
      return;
    }

    el.innerHTML = '';
    attivi.slice(0, 12).forEach(function (v) {
      var p = ultimaPagina[v.id];

      var luogo = [v.citta, v.regione].filter(Boolean).join(', ') || v.paese || 'luogo ignoto';
      var sezione = p && p.sezione_ora ? p.sezione_ora : null;

      var riga = document.createElement('div');
      riga.className = 'vivo-riga';
      riga.setAttribute('data-tip',
        '<b>' + fuga(luogo) + '</b>' +
        '<div class="riga">' + fuga(v.dispositivo || '?') + ' - ' + fuga(v.sistema || '?') +
        ' - ' + fuga(v.browser || '?') + '</div>' +
        '<div class="riga">arrivo: ' + fuga(v.canale || '?') +
        (v.referente_host ? ' da ' + fuga(v.referente_host) : '') + '</div>' +
        (p ? '<div class="riga">' + durata(p.ms_attivi) + ' su questa pagina</div>' : ''));

      var segno = document.createElement('span');
      segno.className = 'segno';

      var dove = document.createElement('span');
      dove.className = 'dove';
      dove.textContent = p ? p.percorso : '-';

      var quando = document.createElement('span');
      quando.className = 'quando';
      quando.textContent = quantoFa(v.vista_ultima);

      var sotto = document.createElement('span');
      sotto.className = 'sotto';
      if (sezione) {
        var b = document.createElement('b');
        b.textContent = sezione;
        sotto.appendChild(b);
        sotto.appendChild(document.createTextNode('  -  ' + luogo));
      } else {
        sotto.textContent = luogo;
      }

      riga.appendChild(segno);
      riga.appendChild(dove);
      riga.appendChild(quando);
      riga.appendChild(sotto);
      el.appendChild(riga);
    });
  }

  /* Nuove e di ritorno.

     Attenzione a cosa si puo' dire davvero: l'impronta del visitatore
     cambia ogni notte, apposta, perche' cosi' non e' un pedinamento.
     Quindi "gia' visto prima" vuol dire "gia' passato oggi", non
     "tornato dopo una settimana". */
  function disegnaRitorno(visite) {
    var giorni = stato.tutto ? 30 : (stato.giorni || 1);
    if (giorni < 1) giorni = 1;
    if (giorni > 60) giorni = 60;

    var caselle = [];
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    for (var i = giorni - 1; i >= 0; i--) {
      var d = new Date(oggi);
      d.setDate(d.getDate() - i);
      caselle.push({ data: d, nuove: 0, ritorno: 0 });
    }

    // in ordine di tempo: la prima volta che vedo un'impronta e' una visita nuova
    var viste = {};
    var ordinate = visite.slice().sort(function (a, b) {
      return new Date(a.iniziata) - new Date(b.iniziata);
    });

    var totNuove = 0, totRitorno = 0;
    ordinate.forEach(function (v) {
      var diRitorno = viste[v.impronta] === true;
      viste[v.impronta] = true;
      if (diRitorno) totRitorno++; else totNuove++;

      var d = new Date(v.iniziata); d.setHours(0, 0, 0, 0);
      for (var i = 0; i < caselle.length; i++) {
        if (caselle[i].data.getTime() === d.getTime()) {
          if (diRitorno) caselle[i].ritorno++; else caselle[i].nuove++;
          break;
        }
      }
    });

    var max = Math.max.apply(null, caselle.map(function (c) { return c.nuove + c.ritorno; }).concat([1]));
    testo($('conta-ritorno'), totNuove + ' nuove, ' + totRitorno + ' di ritorno');

    var el = $('ritorno');
    el.innerHTML = '';
    caselle.forEach(function (c) {
      var tot = c.nuove + c.ritorno;
      var col = document.createElement('div');
      col.className = 'colonna' + (tot === 0 ? ' vuota' : '');
      col.setAttribute('data-tip',
        '<b>' + tot + (tot === 1 ? ' visita' : ' visite') + '</b>' +
        '<div class="riga">' + c.nuove + ' alla prima volta</div>' +
        '<div class="riga">' + c.ritorno + ' gia\' passate</div>' +
        '<div class="riga">' + c.data.toLocaleDateString('it-IT',
          { weekday: 'long', day: 'numeric', month: 'long' }) + '</div>');

      if (tot === 0) {
        col.innerHTML = '<i style="height:2px"></i>';
      } else {
        var altezza = Math.max(6, Math.round((tot / max) * 100));
        var pila = document.createElement('div');
        pila.className = 'pila';
        pila.style.height = altezza + '%';
        if (c.ritorno) {
          var r = document.createElement('i');
          r.className = 'ritorno';
          r.style.flex = c.ritorno;
          pila.appendChild(r);
        }
        if (c.nuove) {
          var n = document.createElement('i');
          n.className = 'nuove';
          n.style.flex = c.nuove;
          pila.appendChild(n);
        }
        col.appendChild(pila);
      }
      el.appendChild(col);
    });

    asseGiorni('ritorno-asse', caselle);

    testo($('ritorno-nota'),
      'Un visitatore viene riconosciuto da un\'impronta che cambia ogni notte, ' +
      'apposta, per non essere un pedinamento. Percio\' "gia\' passate" vuol dire ' +
      'nella stessa giornata: chi torna dopo una settimana risulta di nuovo nuovo.');
  }

  /* A che ora del giorno arrivano. Ventiquattro colonne, con l'ora
     del fuso di chi guarda il cruscotto. */
  function disegnaOrari(visite) {
    var caselle = [];
    for (var h = 0; h < 24; h++) caselle.push({ h: h, n: 0 });

    visite.forEach(function (v) {
      caselle[new Date(v.iniziata).getHours()].n++;
    });

    var max = Math.max.apply(null, caselle.map(function (c) { return c.n; }).concat([1]));
    var picco = caselle.reduce(function (a, c) { return c.n > a.n ? c : a; }, caselle[0]);
    testo($('conta-orari'), picco.n
      ? 'picco alle ' + String(picco.h).padStart(2, '0') + ':00'
      : '');

    var el = $('orari');
    el.innerHTML = '';
    caselle.forEach(function (c) {
      var col = document.createElement('div');
      col.className = 'colonna' + (c.n === 0 ? ' vuota' : '');
      col.setAttribute('data-tip',
        '<b>' + c.n + (c.n === 1 ? ' visita' : ' visite') + '</b>' +
        '<div class="riga">fra le ' + String(c.h).padStart(2, '0') + ':00 e le ' +
        String((c.h + 1) % 24).padStart(2, '0') + ':00</div>');
      col.innerHTML = '<i style="height:' +
        (c.n === 0 ? '2px' : Math.max(4, Math.round((c.n / max) * 100)) + '%') + '"></i>';
      el.appendChild(col);
    });

    var asse = $('orari-asse');
    asse.innerHTML = '';
    caselle.forEach(function (c) {
      var x = document.createElement('span');
      x.textContent = (c.h % 6 === 0) ? String(c.h) : '';
      asse.appendChild(x);
    });
  }

  /* Fin dove leggono: per ogni decimo di pagina, quante aperture ci
     sono arrivate almeno fino li'. Parte da 100 e scende; il punto
     in cui crolla e' dove si perdono le persone. */
  function disegnaCurva(pagine) {
    var scelto = stato.percorsoScelto;
    var titolo = $('titolo-curva');

    var mie = scelto
      ? pagine.filter(function (p) { return p.percorso === scelto; })
      : pagine;

    var validi = mie.map(function (p) { return p.scroll_max; })
                    .filter(function (n) { return n > 0; });

    if (titolo) {
      // Solo il testo: l'icona delle info sta nello stesso h2 e va lasciata stare.
      titolo.querySelector('.t').textContent =
        scelto ? 'Fin dove leggono ' + scelto : 'Fin dove leggono';
    }
    testo($('conta-curva'), validi.length
      ? validi.length + (validi.length === 1 ? ' apertura' : ' aperture')
      : 'nessun dato');

    var el = $('curva');
    var asse = $('curva-asse');
    el.innerHTML = '';
    asse.innerHTML = '';

    if (!validi.length) {
      el.innerHTML = '<div class="vuoto">Ancora nessuna apertura di questa pagina.</div>';
      return;
    }

    for (var soglia = 10; soglia <= 100; soglia += 10) {
      var quanti = validi.filter(function (n) { return n >= soglia; }).length;
      var quota = Math.round((quanti / validi.length) * 100);

      var col = document.createElement('div');
      col.className = 'colonna' + (quota === 0 ? ' vuota' : '');
      col.setAttribute('data-tip',
        '<b>' + quota + '% delle aperture</b>' +
        '<div class="riga">arriva almeno al ' + soglia + '% della pagina</div>' +
        '<div class="riga">' + quanti + ' su ' + validi.length + '</div>');
      col.innerHTML = '<i style="height:' + (quota === 0 ? '2px' : Math.max(4, quota) + '%') + '"></i>';
      el.appendChild(col);

      var x = document.createElement('span');
      x.textContent = soglia + '%';
      asse.appendChild(x);
    }
  }

  /* Prima e ultima pagina di ogni visita: la porta d'ingresso e il
     punto in cui il percorso finisce. */
  function disegnaEntrataUscita(perVisita) {
    var entrate = {}, uscite = {}, quante = 0;

    Object.keys(perVisita).forEach(function (id) {
      var g = perVisita[id].slice().sort(function (a, b) {
        return new Date(a.aperta) - new Date(b.aperta);
      });
      if (!g.length) return;
      quante++;
      var e = g[0].percorso, u = g[g.length - 1].percorso;
      entrate[e] = (entrate[e] || 0) + 1;
      uscite[u]  = (uscite[u]  || 0) + 1;
    });

    var inLista = function (m) {
      return Object.keys(m).map(function (k) {
        return {
          nome: k,
          valore: m[k],
          tip: '<b>' + fuga(k) + '</b><div class="riga">' + m[k] + ' visite su ' + quante +
               ' (' + Math.round((m[k] / quante) * 100) + '%)</div>'
        };
      }).sort(function (a, b) { return b.valore - a.valore; });
    };

    testo($('conta-entrata'), quante + (quante === 1 ? ' visita' : ' visite'));
    testo($('conta-uscita'), quante + (quante === 1 ? ' visita' : ' visite'));
    barre('entrata', inLista(entrate), { quante: 8 });
    barre('uscita',  inLista(uscite),  { quante: 8 });
  }

  function asseGiorni(contenitore, caselle) {
    var asse = $(contenitore);
    asse.innerHTML = '';
    var passo = caselle.length > 14 ? Math.ceil(caselle.length / 7) : (caselle.length > 7 ? 2 : 1);
    caselle.forEach(function (c, i) {
      var s = document.createElement('span');
      s.textContent = (i % passo === 0 || i === caselle.length - 1) ? String(c.data.getDate()) : '';
      asse.appendChild(s);
    });
  }

  /* L'andamento e' un'area con la linea morbida (come nei grafici
     di Frigolo), non a colonne: un punto per giorno, o per ora quando
     il periodo e' oggi. La linea tratteggiata sono le visite che
     aprono l'app. */
  function disegnaAndamento(visite) {
    var app = stato.visiteApp || {};
    var punti = [];
    var oraAdesso = new Date();

    if (!stato.tutto && stato.giorni === 0) {
      for (var h = 0; h <= oraAdesso.getHours(); h++) {
        punti.push({ giorno: iso(oraAdesso), ora: h, visite: 0, apri_app: 0 });
      }
      visite.forEach(function (v) {
        var d = new Date(v.iniziata);
        var p = punti[d.getHours()];
        if (p) { p.visite++; if (app[v.id]) p.apri_app++; }
      });
      testo($('titolo-andamento'), 'Visite per ora');
    } else {
      var giorni = stato.tutto ? 30 : stato.giorni;
      if (giorni > 60) giorni = 60;
      var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
      var indice = {};
      for (var i = giorni - 1; i >= 0; i--) {
        var d = new Date(oggi);
        d.setDate(d.getDate() - i);
        indice[iso(d)] = punti.length;
        punti.push({ giorno: iso(d), visite: 0, apri_app: 0 });
      }
      visite.forEach(function (v) {
        var k = indice[iso(new Date(v.iniziata))];
        if (k !== undefined) { punti[k].visite++; if (app[v.id]) punti[k].apri_app++; }
      });
      testo($('titolo-andamento'), 'Visite per giorno');
    }

    var max = Math.max.apply(null, punti.map(function (p) { return p.visite; }).concat([0]));
    testo($('conta-andamento'), 'massimo ' + max);
    area('andamento', punti, [
      { chiave: 'visite', nome: 'Visite' },
      { chiave: 'apri_app', nome: 'Aprono Frigolo', classe: 'seconda' }
    ]);
  }

  /* Gli indirizzi cercati che sul sito non esistono.

     Qui dentro i robot NON si tolgono, ed e' voluto: quasi tutti gli
     indirizzi morti li cercano loro, e togliendoli il pannello
     resterebbe sempre vuoto. Quello che serve sapere e' se un vecchio
     indirizzo torna spesso, e se qualche volta lo cerca una persona:
     in quel caso vale un reindirizzamento. La riga sopra l'elenco dice
     quanti sono di robot. */
  function disegnaMancanti() {
    var riquadro = $('riquadro-mancanti');
    if (!riquadro) return;

    var diRobot = {};
    stato.visite.forEach(function (v) { if (v.bot) diRobot[v.id] = 1; });

    var morte = stato.pagine.filter(function (p) { return (p.stato || 200) !== 200; });
    if (!morte.length) { riquadro.hidden = true; return; }
    riquadro.hidden = false;

    var quanteRobot = morte.filter(function (p) { return diRobot[p.visita_id]; }).length;
    var persone = morte.length - quanteRobot;

    testo($('conta-mancanti'), morte.length + ' aperture, ' +
      (quanteRobot ? quanteRobot + ' di robot' : 'nessuna di robot') +
      (persone ? ', ' + persone + ' no' : ''));

    var per = {};
    morte.forEach(function (p) {
      var g = per[p.percorso] || (per[p.percorso] = { nome: p.percorso, valore: 0, robot: 0 });
      g.valore++;
      if (diRobot[p.visita_id]) g.robot++;
    });

    var elenco = Object.keys(per).map(function (k) {
      var g = per[k];
      g.tip = '<b>' + fuga(g.nome) + '</b><div class="riga">' + g.valore + ' aperture' +
              (g.robot ? ', ' + g.robot + ' di robot' : '') + '</div>' +
              (g.valore > g.robot
                ? '<div class="riga">Cercato anche da persone: vale un reindirizzamento.</div>'
                : '');
      return g;
    }).sort(function (a, b) { return b.valore - a.valore; });

    barre('mancanti', elenco, {
      quante: 10,
      cifra: function (v) {
        return v.valore + (v.robot === v.valore ? ' · solo robot' : '');
      }
    });
  }

  function disegnaSezioni(pagine) {
    var scelto = stato.percorsoScelto;
    var titolo = $('titolo-sezioni');
    titolo.querySelector('.t').textContent = scelto ? 'Sezioni di ' + scelto : 'Tempo per sezione';

    if (!scelto) { barre('sezioni', []); testo($('conta-sezioni'), ''); return; }

    var mie = pagine.filter(function (p) { return p.percorso === scelto; });
    var somma = {}, quante = {};

    mie.forEach(function (p) {
      var s = p.sezioni || {};
      Object.keys(s).forEach(function (k) {
        somma[k] = (somma[k] || 0) + s[k];
        quante[k] = (quante[k] || 0) + 1;
      });
    });

    var voci = Object.keys(somma).map(function (k) {
      var medio = Math.round(somma[k] / quante[k]);
      return {
        nome: k,
        valore: medio,
        letture: quante[k],
        tip: '<b>' + fuga(k) + '</b><div class="riga">' + durata(medio) + ' in media</div>' +
             '<div class="riga">letta in ' + quante[k] + ' aperture su ' + mie.length + '</div>'
      };
    }).sort(function (a, b) { return b.valore - a.valore; });

    testo($('conta-sezioni'), mie.length + (mie.length === 1 ? ' apertura' : ' aperture'));
    barre('sezioni', voci, {
      quante: 12,
      cifra: function (v) { return durata(v.valore); }
    });
  }

  /* ---------- tempo reale ---------- */

  function ascolta() {
    // riaprendo il canale al risveglio, il vecchio va chiuso prima
    if (stato.canale) { sb.removeChannel(stato.canale); stato.canale = null; }
    var canale = sb.channel('statistiche')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visite' }, arrivo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagine' }, arrivo)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventi' }, arrivo)
      .subscribe(function (s) {
        /* Il collegamento si nota solo quando manca: se tutto va,
           la riga in alto e' libera di dire quante persone ci sono. */
        var riga = $('stato-nota');
        if (!riga) return;
        var mio = 'aggiornamento dal vivo scollegato';
        if (s === 'SUBSCRIBED') {
          if (riga.textContent === mio) riga.textContent = '';
        } else if (s === 'CLOSED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
          riga.textContent = mio;
        }
      });
    stato.canale = canale;
    return canale;
  }

  /* Un messaggio in tempo reale non porta tutto quello che serve ai
     conteggi, quindi lo usiamo come sveglia: ricarichiamo, ma non piu'
     di una volta ogni due secondi, cosi' una raffica di battiti non
     diventa una raffica di interrogazioni. */
  function arrivo() {
    if (stato.ricarica) return;
    stato.ricarica = setTimeout(function () {
      stato.ricarica = null;
      carica().catch(function (e) { console.warn('ricarica fallita', e); });
    }, 2000);
  }

  /* ---------- accesso ---------- */

  $('modulo-accesso').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('btn-entra');
    var err = $('errore-accesso');
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Un attimo...';

    var email = $('email').value.trim();
    var password = $('password').value;
    entra(sb, email, password).then(function (ok) {
      btn.disabled = false;
      btn.textContent = 'Entra';
      $('password').value = '';
      if (!ok) { err.textContent = 'Email o password non corrette.'; return; }
      stato.email = email;
      avvia();
    });
  });

  function entra(client, email, password) {
    return client.auth.signInWithPassword({ email: email, password: password })
      .then(function (r) { return !r.error; }, function () { return false; });
  }

  /* La sezione chiusa (sessione scaduta) chiede di nuovo la password. */
  [['landing', function () { return sb; }], ['app', function () { return sb; }]].forEach(function (x) {
    $('accesso-' + x[0]).addEventListener('submit', function (e) {
      e.preventDefault();
      var campo = $('password-' + x[0]);
      var email = stato.email || $('email').value.trim();
      if (!email) { scrivi('errore-' + x[0], 'Esci e rientra con email e password.'); return; }
      entra(x[1](), email, campo.value).then(function (ok) {
        campo.value = '';
        if (!ok) { scrivi('errore-' + x[0], 'Password non corretta.'); return; }
        caricaSezione();
      });
    });
  });

  $('sezioni-scelta').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) mostraSezione(b.getAttribute('data-sezione'));
  });

  function mostraSezione(chi) {
    stato.sezione = chi;
    try { localStorage.setItem('frigolo-stat.sezione', chi); } catch (e) {}
    [].forEach.call(document.querySelectorAll('#sezioni-scelta button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-sezione') === chi));
    });
    $('sezione-landing').hidden = chi !== 'landing';
    $('sezione-app').hidden = chi !== 'app';
    // chi c'e' adesso riguarda solo la landing
    var vivo = $('stato-vivo');
    if (vivo) vivo.style.visibility = chi === 'landing' ? '' : 'hidden';
    return caricaSezione();
  }

  function caricaSezione() {
    if (stato.sezione === 'app') return caricaApp();
    return carica().then(function () {
      if (stato.finto) return;
      var c = stato.canale;
      if (!c || c.state !== 'joined') ascolta();
    }).catch(mostraGuasto);
  }

  $('btn-esci').addEventListener('click', function () {
    Promise.all([sb.auth.signOut()])
      .then(function () { location.reload(); }, function () { location.reload(); });
  });

  $('periodi').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    [].forEach.call(this.querySelectorAll('button'), function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    stato.giorni = parseInt(b.getAttribute('data-giorni'), 10) || 0;
    stato.tutto = b.hasAttribute('data-tutto');
    stato.percorsoScelto = null;
    caricaSezione();
  });

  function mostraGuasto(e) {
    if (e && e.message === SCADUTA) { fuoriSessione(); return; }
    if (e && e.message === MUTO) {
      nota('non riesco ad aggiornare, controlla la rete');
      return;
    }
    console.error(e);
    var el = $('vivo-lista');
    if (el) el.innerHTML = '<div class="vuoto">Non riesco a leggere i dati: ' + fuga(e.message || e) + '</div>';
  }

  /* ---------- tema ---------- */

  /* I due interruttori sono lo stesso comando in due posti: in barra
     su schermo largo, in fondo alla pagina su schermo stretto. */
  function interruttori() {
    return [$('btn-tema'), $('btn-tema-2')].filter(Boolean);
  }

  /* Chiaro di serie. La scelta resta in questo browser e non
     tocca il database, quindi ogni dispositivo puo' avere il suo. */
  function applicaTema(t) {
    var scuro = t === 'scuro';
    if (scuro) document.documentElement.setAttribute('data-tema', 'scuro');
    else document.documentElement.removeAttribute('data-tema');

    // I due interruttori dicono lo stesso, e lo dicono anche a chi
    // usa un lettore di schermo.
    interruttori().forEach(function (b) {
      b.setAttribute('aria-checked', scuro ? 'true' : 'false');
      b.setAttribute('aria-label', scuro ? 'Tema scuro' : 'Tema chiaro');
      b.title = scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro';
    });

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', scuro ? '#1a0f13' : '#f8eef0');

    try { localStorage.setItem('frigolo-stat.tema', scuro ? 'scuro' : 'chiaro'); } catch (e) {}
  }

  function temaSalvato() {
    try {
      var v = localStorage.getItem('frigolo-stat.tema');
      return v === 'chiaro' ? 'chiaro' : 'scuro';   // di serie: scuro
    } catch (e) { return 'scuro'; }
  }

  applicaTema(temaSalvato());

  function cambiaTema() {
    applicaTema(document.documentElement.getAttribute('data-tema') === 'scuro' ? 'chiaro' : 'scuro');
    scattoIcone();
  }

  /* Lo scatto dell'icona lo fa il foglio di stile: qui si toglie e si
     rimette la classe, leggendo una misura in mezzo per costringere il
     browser a far ripartire l'animazione anche a click ravvicinati.
     Solo al click, mai all'apertura della pagina. */
  function scattoIcone() {
    interruttori().forEach(function (b) {
      b.classList.remove('scatta');
      void b.offsetWidth;
      b.classList.add('scatta');
    });
  }

  interruttori().forEach(function (b) { b.addEventListener('click', cambiaTema); });

  /* ---------- avvio ---------- */

  var orologio = null;

  function avvia() {
    document.body.classList.add('dentro');
    var err = $('errore-accesso');
    if (err) err.textContent = '';
    mostraSezione(stato.sezione);
    // i "quanto fa" invecchiano da soli
    if (!orologio) orologio = setInterval(function () {
      var v = stato.visite.filter(function (x) { return !x.bot; });
      disegnaVivo(v, stato.pagine);
    }, 20000);
  }


  /* ============================================================
     SEZIONE APP: uso di Frigolo, dal progetto di Frigolo.
     Solo aggregati, dalla funzione metrics_app (risponde solo agli
     account in metrics.admins). Stessi riquadri, stessi confronti e
     stesse barre della sezione delle visite; gli andamenti sono
     aree con la linea morbida.
     ============================================================ */

  function scrivi(id, t) { var el = $(id); if (el) el.textContent = t; }
  function numeroA(n) {
    if (n === null || n === undefined || isNaN(n)) return '-';
    n = Number(n);
    return n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n);
  }
  function quota(a, b) { return b ? Math.round((a / b) * 100) + '%' : '-'; }
  function byte(n) {
    if (!n && n !== 0) return '-';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(1).replace('.0', '') + ' GB';
    return (n / 1024 / 1024).toFixed(n < 100 * 1024 * 1024 ? 1 : 0) + ' MB';
  }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dataLunga(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* Il periodo: gli ultimi N giorni compreso oggi, e gli N giorni
  /* ---------- barre ---------- */

  function barreA(id, voci, o) {
    o = o || {};
    var el = $(id);
    if (!el) return;
    el.innerHTML = '';
    if (!voci || !voci.length) { el.innerHTML = '<div class="vuoto">Ancora niente in questo periodo.</div>'; return; }
    var max = o.max || Math.max.apply(null, voci.map(function (v) { return v.valore; }).concat([1]));
    voci.slice(0, o.quante || 8).forEach(function (v) {
      var riga = document.createElement('div');
      riga.className = 'barra';
      if (v.tip) riga.setAttribute('data-tip', v.tip);
      riga.innerHTML = '<span class="testo"></span><span class="cifra"></span>' +
        '<span class="pista"><i style="width:' + Math.max(1.5, (v.valore / max) * 100) + '%"></i></span>';
      riga.querySelector('.testo').textContent = v.etichetta || v.nome;
      riga.querySelector('.cifra').textContent = v.cifra || numeroA(v.valore);
      el.appendChild(riga);
    });
  }

  /* ---------- andamento: area con linea morbida ----------

     La curva passa per tutti i punti senza mai superarli (spline
     monotona di Fritsch e Carlson): una curva qualsiasi, fra un giorno
     a zero e uno a dieci, scenderebbe sotto lo zero o salirebbe oltre
     il massimo, e racconterebbe giorni che non ci sono stati. */

  function curva(xs, ys) {
    var n = xs.length;
    if (n === 1) return 'M' + xs[0] + ',' + ys[0];
    var d = [], m = [];
    for (var i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m.push(d[0]);
    for (i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
    m.push(d[n - 2]);
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
      if (h > 9) { var t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    var p = 'M' + xs[0] + ',' + ys[0];
    for (i = 0; i < n - 1; i++) {
      var dx = (xs[i + 1] - xs[i]) / 3;
      p += 'C' + (xs[i] + dx) + ',' + (ys[i] + m[i] * dx) + ' ' +
           (xs[i + 1] - dx) + ',' + (ys[i + 1] - m[i + 1] * dx) + ' ' + xs[i + 1] + ',' + ys[i + 1];
    }
    return p;
  }

  var gradienti = 0;

  /* serie: [{ chiave, nome, classe ('' | 'seconda' | 'avviso'), scalaPropria }]
     La prima e' l'area, le altre sono linee. */
  function area(id, giorni, serie) {
    var el = $(id);
    if (!el) return;
    var W = 1000, H = 100, n = giorni.length;
    var xs = giorni.map(function (_, i) { return n === 1 ? W / 2 : (i / (n - 1)) * W; });
    var maxComune = Math.max.apply(null, [1].concat.apply([], serie.filter(function (s) { return !s.scalaPropria; })
      .map(function (s) { return giorni.map(function (g) { return +g[s.chiave] || 0; }); })));

    var g = 'g' + (++gradienti);
    var svg = '<svg viewBox="0 -4 ' + W + ' ' + (H + 4) + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="currentColor" stop-opacity=".32"/>' +
      '<stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
      '<line class="griglia-y" x1="0" x2="' + W + '" y1="0" y2="0"/>' +
      '<line class="griglia-y" x1="0" x2="' + W + '" y1="50" y2="50"/>';

    serie.forEach(function (s, k) {
      var max = s.scalaPropria
        ? Math.max.apply(null, [1].concat(giorni.map(function (d) { return +d[s.chiave] || 0; })))
        : maxComune;
      var ys = giorni.map(function (d) { return H - ((+d[s.chiave] || 0) / max) * (H - 2); });
      var p = curva(xs, ys);
      if (k === 0 && n > 1) {
        svg += '<path d="' + p + 'L' + W + ',' + H + 'L0,' + H + 'Z" fill="url(#' + g + ')" stroke="none"/>';
      }
      svg += '<path class="linea ' + (s.classe || '') + '" d="' + p + '"/>';
    });
    svg += '<line class="base" x1="0" x2="' + W + '" y1="' + H + '" y2="' + H + '"/></svg>';

    var bersagli = giorni.map(function (d) {
      // il suggerimento sta in un attributo fra virgolette doppie: dentro
      // solo apici singoli
      var righe = serie.map(function (s) {
        return "<div class='riga'>" + fuga(s.nome) + ': ' + numeroA(d[s.chiave] || 0) + '</div>';
      }).join('');
      var titolo = d.titolo || (d.ora !== undefined ? 'dalle ' + String(d.ora).padStart(2, '0') + ':00' : dataLunga(d.giorno));
      return '<span data-tip="<b>' + fuga(titolo) + '</b>' + righe + '"></span>';
    }).join('');

    // il colore della sfumatura e' quello della prima serie
    el.style.color = serie[0].classe === 'avviso' ? 'var(--warn)' : 'var(--acc)';
    el.innerHTML = svg + '<div class="bersagli">' + bersagli + '</div>' +
      '<span class="tetto">' + numeroA(maxComune) + '</span>';

    var asse = $(id + '-asse');
    if (asse) {
      asse.innerHTML = '';
      var passo = n > 14 ? Math.ceil(n / 7) : (n > 7 ? 2 : 1);
      giorni.forEach(function (d, i) {
        var sp = document.createElement('span');
        var gg = String(d.giorno).split('-');
        sp.textContent = (i % passo === 0 || i === n - 1)
          ? (d.asse !== undefined ? d.asse : (d.ora !== undefined ? String(d.ora) : String(+gg[2]) + (n > 60 ? '/' + (+gg[1]) : '')))
          : '';
        asse.appendChild(sp);
      });
    }
  }

  /* ---------- confronto con il periodo prima ---------- */

  function confrontoA(id, ora, prima, o) {
    o = o || {};
    var el = $(id);
    if (!el) return;
    el.className = 'delta';
    if (prima === null || prima === undefined || ora === null || ora === undefined) { el.textContent = ''; return; }
    if (prima === 0) { el.textContent = ora > 0 ? 'prima non c\'era niente' : 'come prima: zero'; return; }
    var scarto = Math.round(((ora - prima) / prima) * 100);
    if (scarto === 0) { el.textContent = 'uguale al periodo prima'; return; }
    var sale = scarto > 0;
    var bene = o.saleEBene === false ? !sale : sale;
    el.className = 'delta ' + (bene ? 'bene' : 'male');
    el.innerHTML = '<span class="freccia">' + (sale ? '▲' : '▼') + '</span>' + Math.abs(scarto) + '% sul periodo prima';
  }

  /* ---------- APP ---------- */

  function spese(t) { return t ? (t.spese_a_mano || 0) + (t.spese_automatiche || 0) : null; }

  function disegnaApp() {
    var d = stato.app, p = stato.appPrima;
    if (!d) return;
    var t = d.periodo_tot || {}, o = d.oggi || {}, q = p ? p.periodo_tot : null;

    scrivi('a-registrazioni', numeroA(t.registrazioni));
    scrivi('a-utenti', numeroA(o.utenti) + ' iscritti oggi in tutto');
    confrontoA('da-registrazioni', t.registrazioni, q && q.registrazioni);

    scrivi('a-profili', numeroA(t.profili_completati));
    scrivi('a-profili-nota', t.registrazioni ? quota(t.profili_completati, t.registrazioni) + ' delle registrazioni' : 'nessuna registrazione nel periodo');
    confrontoA('da-profili', t.profili_completati, q && q.profili_completati);

    scrivi('a-attivi', numeroA(t.persone_attive));
    scrivi('a-attivi-nota', 'oggi ' + numeroA(o.attivi_oggi) + ', in 7 giorni ' + numeroA(o.attivi_7g) + ', in 30 ' + numeroA(o.attivi_30g));
    confrontoA('da-attivi', t.persone_attive, q && q.persone_attive);

    scrivi('a-condivise', numeroA(o.liste_condivise));
    scrivi('a-condivise-nota', 'su ' + numeroA(o.liste) + ' liste, ' + (o.persone_per_lista || 0) + ' persone per lista');

    scrivi('a-prodotti', numeroA(t.prodotti_aggiunti));
    scrivi('a-prodotti-nota', t.persone_attive ? Math.round(t.prodotti_aggiunti / t.persone_attive) + ' per persona attiva' : '-');
    confrontoA('da-prodotti', t.prodotti_aggiunti, q && q.prodotti_aggiunti);

    scrivi('a-spese', numeroA(spese(t)));
    scrivi('a-spese-nota', (t.spese_a_mano || 0) + ' a mano, ' + (t.spese_automatiche || 0) + ' automatiche');
    confrontoA('da-spese', spese(t), spese(q));

    scrivi('a-inviti', numeroA(t.inviti_usati));
    scrivi('a-inviti-nota', numeroA(t.liste_create) + ' liste create, ' + numeroA(t.liste_eliminate) + ' eliminate');
    confrontoA('da-inviti', t.inviti_usati, q && q.inviti_usati);

    var falliti = t.inviti_falliti || 0;
    var piccoFalliti = Math.max.apply(null, (d.giorni || []).map(function (g) { return g.inviti_falliti; }).concat([0]));
    scrivi('a-falliti', numeroA(falliti));
    $('a-falliti').classList.toggle('avviso', piccoFalliti >= 30);
    scrivi('a-falliti-nota', piccoFalliti >= 30 ? 'picco di ' + piccoFalliti + ' in un giorno, da guardare' : 'nella norma');
    confrontoA('da-falliti', falliti, q && q.inviti_falliti, { saleEBene: false });

    area('a-andamento-attivi', d.giorni || [], [
      { chiave: 'attivi', nome: 'Attivi nel giorno' },
      { chiave: 'attivi_7g', nome: 'Attivi in 7 giorni', classe: 'seconda' }
    ]);
    scrivi('conta-a-attivi', 'oggi ' + numeroA(o.attivi_oggi));
    area('a-andamento-prodotti', d.giorni || [], [
      { chiave: 'prodotti', nome: 'Prodotti aggiunti' },
      { chiave: 'registrazioni', nome: 'Registrazioni', classe: 'seconda', scalaPropria: true }
    ]);
    scrivi('conta-a-prodotti', numeroA(t.prodotti_aggiunti) + ' prodotti');
    area('a-andamento-falliti', d.giorni || [], [
      { chiave: 'inviti_falliti', nome: 'Inviti sbagliati', classe: 'avviso' }
    ]);
    scrivi('conta-a-falliti', 'massimo ' + piccoFalliti + ' al giorno');

    var r = d.retention || {};
    barreA('a-retention', [
      ['r1', 'Il giorno dopo'], ['r7', 'Seconda settimana'], ['r30', 'Secondo mese']
    ].map(function (x) {
      var v = r[x[0]] || { base: 0, tornati: 0 };
      return {
        nome: x[1],
        valore: v.base ? Math.round((v.tornati / v.base) * 100) : 0,
        cifra: v.base ? quota(v.tornati, v.base) + ' · ' + v.tornati + ' su ' + v.base : 'ancora presto',
        tip: '<b>' + x[1] + '</b><div class="riga">' + (v.base
          ? v.tornati + ' persone su ' + v.base + ' registrate abbastanza tempo fa'
          : 'nessuno registrato nel periodo da abbastanza tempo') + '</div>'
      };
    }), { max: 100 });

    var sp = d.spazio || {};
    metro('a-db', sp.db_byte, sp.db_limite);
    metro('a-storage', sp.storage_byte, sp.storage_limite);

    disegnaAppV3(d);
    disegnaAppV4(d);

    scrivi('piede-app-dati', d.dati_dal ? 'contatori attivi dal ' + new Date(d.dati_dal).toLocaleDateString('it-IT') + ' (prima: ricostruiti dai dati presenti)' : '');
  }


  /* ---------- v3: iscrizioni, percorso, uso, sessioni, errori ---------- */

  var NOMI_MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  var NOMI = {
    standalone: 'App installata', browser: 'Browser', ios: 'iPhone e iPad', android: 'Android',
    desktop: 'Computer', altro: 'Altro', autunno: 'Autunno', basilico: 'Basilico', mare: 'Mare',
    prugna: 'Prugna', lampone: 'Lampone', liquirizia: 'Liquirizia'
  };
  function nome(k) { return NOMI[k] || k; }
  function voci(a) { return (a || []).map(function (v) { return { nome: nome(v.nome), valore: +v.valore }; }); }
  function durataA(s) {
    if (s === null || s === undefined) return '-';
    s = Math.round(s);
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60), r = s % 60;
    return r ? m + 'm ' + r + 's' : m + ' min';
  }
  function dataBreve(iso) {
    var p = String(iso).split('-');
    return (+p[2]) + ' ' + NOMI_MESI[+p[1] - 1];
  }

  function disegnaAppV3(d) {
    var isc = stato.iscrizioni;
    if (isc) {
      scrivi('conta-iscrizioni', numeroA(isc.totale) + ' in tutto');
      area('a-iscr-settimane', (isc.settimane || []).map(function (w) {
        return { giorno: w.da, n: w.n, titolo: 'settimana dal ' + dataBreve(w.da), asse: dataBreve(w.da) };
      }), [{ chiave: 'n', nome: 'Iscrizioni' }]);
      area('a-iscr-mesi', (isc.mesi || []).map(function (m) {
        var p = String(m.da).split('-');
        return { giorno: m.da, n: m.n, titolo: NOMI_MESI[+p[1] - 1] + ' ' + p[0], asse: NOMI_MESI[+p[1] - 1] };
      }), [{ chiave: 'n', nome: 'Iscrizioni' }]);
      barreA('a-iscr-anni', (isc.anni || []).map(function (a) { return { nome: String(a.anno), valore: a.n }; }));
    }

    var pc = d.percorso;
    if (pc) {
      var l = stato.landingPercorso;
      var passi = [
        ['Visite alla landing', l ? l.visite : null],
        ['Vanno all\'app', l ? l.visite_verso_app : null],
        ['Si registrano', pc.registrati],
        ['Confermano l\'email', pc.confermati],
        ['Completano il profilo', pc.profilo],
        ['Creano o entrano in una lista', pc.lista],
        ['Aggiungono un prodotto', pc.prodotto]
      ].filter(function (x) { return x[1] !== null && x[1] !== undefined; });
      var max = Math.max.apply(null, passi.map(function (x) { return x[1]; }).concat([1]));
      barreA('a-percorso', passi.map(function (x, i) {
        var prima = i ? passi[i - 1][1] : null;
        return {
          nome: x[0], valore: x[1],
          cifra: numeroA(x[1]) + (prima ? ' · ' + quota(x[1], prima) : ''),
          tip: '<b>' + fuga(x[0]) + '</b><div class="riga">' + x[1] + (prima ? ' su ' + prima + ' del passo prima' : '') + '</div>'
        };
      }), { max: max, quante: 7 });
    }

    var u = d.uso;
    if (u) {
      scrivi('conta-uso', u.persone ? 'mediana ' + (Math.round(u.mediana * 10) / 10) + ' giorni' : '');
      barreA('a-uso', [['1 giorno', u.g1], ['2-5 giorni', u.g2_5], ['6-15 giorni', u.g6_15], ['16 giorni e piu\'', u.g16]]
        .map(function (x) { return { nome: x[0], valore: x[1] || 0, cifra: numeroA(x[1] || 0) + ' · ' + quota(x[1] || 0, u.persone) }; }),
        { max: Math.max(1, u.persone) });
    }

    var se = d.sessioni;
    if (se) {
      scrivi('conta-sessioni', se.n ? numeroA(se.n) + ' sessioni, media ' + durataA(se.media_s) + ', mediana ' + durataA(se.mediana_s) : 'ancora nessuna sessione');
      area('a-sessioni', (se.giorni || []).length ? se.giorni : [{ giorno: iso(new Date()), n: 0, media_s: 0 }], [
        { chiave: 'n', nome: 'Sessioni' },
        { chiave: 'media_s', nome: 'Durata media (s)', classe: 'seconda', scalaPropria: true }
      ]);
      barreA('a-modalita', voci(se.modalita), { quante: 3 });
      barreA('a-dispositivi', voci(se.dispositivi), { quante: 4 });
      barreA('a-versioni', voci(se.versioni), { quante: 8 });
      barreA('a-temi', voci(se.temi), { quante: 7 });
    }

    var t = d.periodo_tot || {}, o = d.oggi || {};
    barreA('a-funzioni', [
      { nome: 'Spesa finita a mano', valore: t.spese_a_mano || 0 },
      { nome: 'Liste con 2 o piu\' persone', valore: o.liste_condivise || 0 },
      { nome: 'Inviti usati', valore: t.inviti_usati || 0 },
      { nome: 'Codici di invito rinnovati', valore: (d.funzioni || {}).inviti_rinnovati || 0 },
      { nome: 'Sessioni anche offline', valore: se ? se.offline || 0 : 0 }
    ], { quante: 5 });

    var er = d.errori;
    if (er) {
      scrivi('conta-errori', numeroA(er.n) + ' nel periodo');
      area('a-errori', (er.giorni || []).length ? er.giorni : [{ giorno: iso(new Date()), n: 0 }],
        [{ chiave: 'n', nome: 'Errori', classe: 'avviso' }]);
      tabella('a-errori-tabella', ['Messaggio', 'Tipo', 'Pagina', 'Volte'],
        (er.frequenti || []).map(function (x) {
          return [fuga(x.messaggio), fuga(x.tipo), fuga(x.pagina), x.n];
        }));
    }
  }


  /* ---------- v4: abitudine, coorti, primo uso, prodotti, spesa, liste,
     installazione, aggiornamenti, orari ---------- */

  var GIORNI_SETT = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

  // mappa di calore 7 giorni x 24 ore, con l'accento del tema
  function calore(id, matrice, unita) {
    var el = $(id);
    if (!el) return;
    var max = 0;
    (matrice || []).forEach(function (r) { (r || []).forEach(function (v) { if (v > max) max = v; }); });
    var h = '<span></span>';
    for (var o = 0; o < 24; o++) h += '<span class="lo">' + (o % 3 === 0 ? o : '') + '</span>';
    for (var g = 0; g < 7; g++) {
      h += '<span class="lg">' + GIORNI_SETT[g] + '</span>';
      for (var o2 = 0; o2 < 24; o2++) {
        var v = matrice && matrice[g] ? +matrice[g][o2] || 0 : 0;
        var a = max ? (0.12 + 0.88 * v / max).toFixed(2) : 0;
        h += '<span class="c' + (v ? '' : ' zero') + '" style="--a:' + a + '" data-tip="<b>' +
             GIORNI_SETT[g] + ' alle ' + String(o2).padStart(2, '0') + ':00</b><div class=\'riga\'>' +
             v + ' ' + unita + '</div>"></span>';
      }
    }
    el.innerHTML = h;
  }

  function ore(x) {
    if (x === null || x === undefined) return '-';
    x = +x;
    if (x < 1) return Math.round(x * 60) + ' min';
    if (x < 48) return (Math.round(x * 10) / 10) + ' ore';
    return (Math.round(x / 24 * 10) / 10) + ' giorni';
  }

  function disegnaAppV4(d) {
    // abitudine: persone attive al giorno su persone attive nella settimana
    var gg = (d.giorni || []).filter(function (g) { return g.attivi_7g > 0; });
    var rapporti = gg.map(function (g) { return { giorno: g.giorno, quota: Math.round(g.attivi / g.attivi_7g * 100) }; });
    var media = rapporti.length ? Math.round(rapporti.reduce(function (a, r) { return a + r.quota; }, 0) / rapporti.length) : null;
    scrivi('a-abitudine', media === null ? '-' : media + '%');
    scrivi('conta-abitudine', 'attivi al giorno su attivi nella settimana');
    area('a-abitudine-andamento', rapporti.length ? rapporti : [{ giorno: iso(new Date()), quota: 0 }],
      [{ chiave: 'quota', nome: 'Quota (%)' }]);

    var pu = d.primo_uso;
    if (pu) {
      scrivi('conta-primo-uso', numeroA(pu.iscritti) + ' iscritti nel periodo');
      var tempi = [['Al primo prodotto', pu.ore_prodotto, pu.n_prodotto],
                   ['Alla prima spesa chiusa', pu.ore_spesa, pu.n_spesa],
                   ['Alla seconda persona in lista', pu.ore_seconda, pu.n_seconda]];
      var maxOre = Math.max.apply(null, tempi.map(function (x) { return +x[1] || 0; }).concat([1]));
      barreA('a-primo-uso', tempi.map(function (x) {
        return { nome: x[0], valore: +x[1] || 0, cifra: x[1] === null || x[1] === undefined ? 'nessuno ancora' : ore(x[1]) + ' · ' + x[2] + ' persone',
                 tip: '<b>' + x[0] + '</b><div class="riga">mediana dall\'iscrizione, su ' + (x[2] || 0) + ' persone</div>' };
      }), { max: maxOre, quante: 3 });
    }

    var gl = stato.globali;
    if (gl) {
      var righe = (gl.coorti || []).map(function (c) {
        var celle = [1, 2, 3, 4].map(function (k) {
          var x = (c.settimane || []).filter(function (y) { return y.k === k; })[0];
          if (!x || !x.base) return '<td class="vuota">-</td>';
          var q = Math.round(x.attivi / x.base * 100);
          return '<td class="cella" style="--a:' + (0.08 + 0.8 * q / 100).toFixed(2) + '" title="' + x.attivi + ' su ' + x.base + '">' + q + '%</td>';
        }).join('');
        return '<tr><td>dal ' + dataBreve(c.settimana) + '</td><td class="v">' + c.iscritti + '</td>' + celle + '</tr>';
      }).join('');
      $('a-coorti').innerHTML = righe
        ? '<table class="coorti"><thead><tr><th>Iscritti nella settimana</th><th>Quanti</th><th>Settimana 1</th><th>Settimana 2</th><th>Settimana 3</th><th>Settimana 4</th></tr></thead><tbody>' + righe + '</tbody></table>'
        : '<div class="vuoto">Ancora nessuna settimana da mostrare.</div>';
      barreA('a-prodotti-sempre', (gl.prodotti_top_sempre || []).map(function (x) { return { nome: x.nome, valore: x.valore }; }), { quante: 20 });
    }

    barreA('a-prodotti-top', (d.prodotti_top || []).map(function (x) { return { nome: x.nome, valore: x.valore }; }), { quante: 20 });
    var totCat = (d.categorie || []).reduce(function (a, x) { return a + x.valore; }, 0);
    barreA('a-categorie', (d.categorie || []).map(function (x) {
      return { nome: x.nome, valore: x.valore, cifra: quota(x.valore, totCat) };
    }), { quante: 14 });
    scrivi('conta-personalizzati', numeroA(d.personalizzati_creati || 0) + ' prodotti nuovi creati');
    scrivi('conta-prodotti-top', numeroA(totCat) + ' aggiunte');

    var sp = d.spesa;
    if (sp) {
      calore('a-calore-spesa', sp.calore, 'spese chiuse');
      scrivi('conta-spesa', numeroA(sp.n) + ' spese, ' + (sp.prodotti_medi || 0) + ' prodotti in media, ' +
        (sp.a_settimana_per_lista || 0) + ' a settimana per lista');
      barreA('a-supermercati', voci(sp.supermercati), { quante: 10 });
    }

    var li = d.liste;
    if (li) {
      var totListe = (li.p1 || 0) + (li.p2 || 0) + (li.p3 || 0) + (li.p4_5 || 0);
      barreA('a-persone-lista', [['1 persona', li.p1], ['2 persone', li.p2], ['3 persone', li.p3], ['4 o 5 persone', li.p4_5]]
        .map(function (x) { return { nome: x[0], valore: x[1] || 0, cifra: numeroA(x[1] || 0) + ' · ' + quota(x[1] || 0, totListe) }; }),
        { max: Math.max(1, totListe) });
      barreA('a-ingressi', [{ nome: 'Con il link', valore: li.ingressi_link || 0 }, { nome: 'Con il codice', valore: li.ingressi_codice || 0 }]);
      scrivi('conta-ingressi', li.ore_invito_ingresso !== null && li.ore_invito_ingresso !== undefined
        ? 'dall\'invito all\'ingresso: ' + ore(li.ore_invito_ingresso) : '');
    }

    var fo = d.foto;
    if (fo) {
      barreA('a-foto', [{ nome: 'Con una foto', valore: fo.con_foto, cifra: numeroA(fo.con_foto) + ' · ' + quota(fo.con_foto, fo.profili) },
                        { nome: 'Con la mascotte', valore: fo.profili - fo.con_foto, cifra: numeroA(fo.profili - fo.con_foto) + ' · ' + quota(fo.profili - fo.con_foto, fo.profili) }],
        { max: Math.max(1, fo.profili) });
    }

    var ev = d.eventi || {};
    scrivi('a-ricerche', numeroA(ev.ricerca_vuota || 0));
    var schede = ev.install_scheda || 0;
    barreA('a-installazione', [
      ['Invito a installare mostrato', ev.install_scheda],
      ['Toccato Installa (Android)', ev.install_android_tocco],
      ['Installazione accettata', ev.install_prompt_accettato],
      ['Installazione rifiutata', ev.install_prompt_rifiutato],
      ['Guida iPhone aperta', ev.install_guida_ios]
    ].map(function (x) { return { nome: x[0], valore: x[1] || 0, cifra: numeroA(x[1] || 0) + (schede && x[0] !== 'Invito a installare mostrato' ? ' · ' + quota(x[1] || 0, schede) : '') }; }),
      { max: Math.max(1, schede), quante: 5 });

    var ve = d.versioni;
    if (ve) {
      var quote = (ve.giorni || []).map(function (g) { return { giorno: g.giorno, quota: g.n ? Math.round(g.ultima / g.n * 100) : 0 }; });
      area('a-ultima-versione', quote.length ? quote : [{ giorno: iso(new Date()), quota: 0 }],
        [{ chiave: 'quota', nome: 'Sessioni sull\'ultima versione (%)' }]);
      scrivi('conta-aggiornamenti', ve.ultima ? 'ultima versione: ' + ve.ultima : '');
    }
    barreA('a-aggiornamenti', [
      { nome: 'Barra "versione nuova" mostrata', valore: ev.aggiorna_barra || 0 },
      { nome: 'Toccato "Aggiorna ora"', valore: ev.aggiorna_tocco || 0,
        cifra: numeroA(ev.aggiorna_tocco || 0) + (ev.aggiorna_barra ? ' · ' + quota(ev.aggiorna_tocco || 0, ev.aggiorna_barra) : '') }
    ], { max: Math.max(1, ev.aggiorna_barra || 0) });

    calore('a-calore-orari', d.orari, 'sessioni iniziate');
    var totOrari = (d.orari || []).reduce(function (a, r) { return a + (r || []).reduce(function (b, v) { return b + v; }, 0); }, 0);
    scrivi('conta-orari-app', numeroA(totOrari) + ' sessioni con l\'ora');
  }

  function finteV4() {
    var d = stato.app, rnd = casuale(404);
    var mat = function (picchi) {
      var m = [];
      for (var g = 0; g < 7; g++) {
        var r = [];
        for (var o = 0; o < 24; o++) {
          var base = picchi(g, o);
          r.push(Math.max(0, Math.round(base + (base ? rnd() * 3 : 0))));
        }
        m.push(r);
      }
      return m;
    };
    d.spesa = {
      n: 214, prodotti_medi: 11.4, a_settimana_per_lista: 1.6,
      calore: mat(function (g, o) { return (o >= 9 && o <= 20) ? (g >= 4 ? 8 : 3) + (o === 18 || o === 11 ? 5 : 0) : 0; }),
      supermercati: [{ nome: 'Lidl', valore: 58 }, { nome: 'Conad', valore: 41 }, { nome: 'Coop', valore: 33 },
                     { nome: 'Eurospin', valore: 27 }, { nome: 'altri', valore: 22 }, { nome: 'non indicato', valore: 33 }]
    };
    d.orari = mat(function (g, o) { return (o >= 7 && o <= 22) ? 4 + (o === 8 || o === 19 ? 9 : 0) + (g === 5 ? 4 : 0) : (o < 2 ? 1 : 0); });
    var nomi = ['Latte', 'Pane', 'Uova', 'Banane', 'Pasta', 'Pomodori', 'Yogurt', 'Mele', 'Insalata', 'Mozzarella',
                'Acqua', 'Caffe', 'Zucchine', 'Patate', 'Carta igienica', 'Formaggio', 'Biscotti', 'Pollo', 'Cipolle', 'Burro'];
    d.prodotti_top = nomi.map(function (n, i) { return { nome: n, valore: 90 - i * 4 }; });
    d.categorie = [{ nome: 'Frutta e verdura', valore: 420 }, { nome: 'Latticini', valore: 260 }, { nome: 'Pane e cereali', valore: 190 },
                   { nome: 'Carne e pesce', valore: 120 }, { nome: 'Casa', valore: 90 }, { nome: 'Bevande', valore: 70 }];
    d.personalizzati_creati = 37;
    d.liste = { p1: 11, p2: 6, p3: 2, p4_5: 1, ingressi_link: 14, ingressi_codice: 4, ore_invito_ingresso: 3.4 };
    d.foto = { profili: 92, con_foto: 23 };
    d.eventi = { ricerca_vuota: 48, install_scheda: 120, install_android_tocco: 31, install_prompt_accettato: 24,
                 install_prompt_rifiutato: 7, install_guida_ios: 42, aggiorna_barra: 66, aggiorna_tocco: 39 };
    d.versioni = { ultima: '2.1.0', giorni: d.giorni.map(function (g, i) {
      var n = 30 + Math.round(rnd() * 10);
      return { giorno: g.giorno, n: n, ultima: Math.round(n * Math.min(1, i / (d.giorni.length * 0.6))) };
    }) };
    d.primo_uso = { iscritti: 92, ore_prodotto: 0.3, n_prodotto: 70, ore_spesa: 52, n_spesa: 41, ore_seconda: 20, n_seconda: 22 };
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    var coorti = [];
    for (var w = 7; w >= 0; w--) {
      var lun = new Date(oggi); lun.setDate(lun.getDate() - ((lun.getDay() + 6) % 7) - 7 * w);
      var sett = [];
      for (var k = 1; k <= 4; k++) {
        var base = w - k >= 0 ? 10 + w : 0;
        sett.push({ k: k, base: base, attivi: Math.round(base * (0.6 - k * 0.08 + rnd() * 0.1)) });
      }
      coorti.push({ settimana: iso(lun), iscritti: 10 + w, settimane: sett });
    }
    stato.globali = { coorti: coorti, prodotti_top_sempre: nomi.map(function (n, i) { return { nome: n, valore: 400 - i * 15 }; }) };
  }

  function metro(id, usato, limite) {
    var q = limite ? usato / limite : 0;
    scrivi(id, byte(usato) + ' di ' + byte(limite) + ' (' + Math.round(q * 100) + '%)');
    var m = $(id + '-metro');
    m.className = 'metro' + (q >= 0.9 ? ' pieno' : (q >= 0.8 ? ' avviso' : ''));
    m.querySelector('i').style.width = Math.max(0.5, Math.min(100, q * 100)) + '%';
  }


  function chiudiSezione(chi, motivo) {
    $('chiusa-' + chi).hidden = false;
    $('aperta-' + chi).hidden = true;
    scrivi('lucchetto-' + chi, 'chiusa');
    if (motivo) scrivi('errore-' + chi, motivo);
  }

  function apriSezione(chi) {
    $('chiusa-' + chi).hidden = true;
    $('aperta-' + chi).hidden = false;
    scrivi('lucchetto-' + chi, '');
    scrivi('errore-' + chi, '');
  }

  /* L'istantanea contiene i quattro periodi del cruscotto, ognuno con
     il periodo prima per il confronto (tranne "sempre", come nella
     sezione delle visite). */
  function chiavePeriodo() {
    return stato.tutto ? 'sempre' : (stato.giorni === 0 ? 'oggi' : String(stato.giorni));
  }

  function caricaApp() {
    if (stato.finto) {
      finteApp(); finteV3(); finteV4(); stato.appGenerato = new Date().toISOString();
      apriSezione('app'); disegnaApp(); piedeApp(); return Promise.resolve();
    }
    return sessioneViva().then(function (viva) {
      if (viva === MUTO) { nota('non riesco ad aggiornare, controlla la rete'); return; }
      if (!viva) { chiudiSezione('app'); return; }
      return sb.from('frigolo_app_snapshot').select('dati, ricevuto').limit(1).then(function (r) {
        if (r.error) { nota('errore nel leggere le metriche dell\'app: ' + (r.error.message || r.error.code)); return; }
        var riga = r.data && r.data[0];
        apriSezione('app');
        if (!riga || !riga.dati || !riga.dati.periodi) {
          nota('le metriche dell\'app non sono ancora arrivate');
          return;
        }
        var p = riga.dati.periodi[chiavePeriodo()] || {};
        stato.app = p.ora || null;
        stato.appPrima = p.prima || null;
        stato.appGenerato = riga.dati.generato || riga.ricevuto;
        stato.iscrizioni = riga.dati.iscrizioni || null;
        stato.globali = riga.dati.globali || null;
        // arrivano ogni ora: oltre tre ore di ritardo qualcosa si e' fermato
        var ritardo = (Date.now() - new Date(riga.ricevuto).getTime()) / 3600000;
        nota(ritardo > 3 ? 'metriche dell\'app ferme da ' + Math.floor(ritardo) + ' ore, da controllare' : '');
        disegnaApp(); piedeApp();
        return caricaVisitePercorso();
      });
    }).catch(function (e) { console.error(e); nota('non riesco a leggere le metriche dell\'app'); });
  }

  /* I primi due passi del percorso (visite e visite verso l'app) vengono
     dalla landing, per lo stesso periodo. */
  function caricaVisitePercorso() {
    var n = stato.tutto ? 365 : (stato.giorni || 1);
    var da = new Date(); da.setHours(0, 0, 0, 0); da.setDate(da.getDate() - n + 1);
    return sb.rpc('frigolo_landing', { p_da: da.toISOString(), p_a: new Date().toISOString() }).then(function (r) {
      stato.landingPercorso = r.error ? null : r.data;
      if (stato.app) disegnaAppV3(stato.app);
    });
  }

  function piedeApp() {
    scrivi('piede-app-periodo', stato.tutto ? 'periodo: ultimo anno'
      : (stato.giorni === 0 ? 'periodo: oggi' : 'periodo: ultimi ' + stato.giorni + ' giorni'));
    scrivi('piede-app-agg', stato.appGenerato ? 'dati dell\'app aggiornati alle ' + ora(stato.appGenerato) + ', ogni ora' : '');
  }


  function finteV3() {
    var d = stato.app, rnd = casuale(99);
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    var sett = [], mesi = [];
    for (var i = 11; i >= 0; i--) {
      var w = new Date(oggi); w.setDate(w.getDate() - ((w.getDay() + 6) % 7) - 7 * i);
      sett.push({ da: iso(w), n: Math.round(4 + (11 - i) * 3 + rnd() * 6) });
      var m = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
      mesi.push({ da: iso(m), n: i > 2 ? 0 : Math.round(20 + (2 - i) * 40 + rnd() * 10) });
    }
    stato.iscrizioni = { totale: 112, settimane: sett, mesi: mesi, anni: [{ anno: oggi.getFullYear(), n: 112 }] };
    d.uso = { persone: 61, g1: 18, g2_5: 23, g6_15: 14, g16: 6, mediana: 3 };
    d.sessioni = {
      n: 1240, media_s: 148, mediana_s: 96, offline: 37,
      modalita: [{ nome: 'standalone', valore: 830 }, { nome: 'browser', valore: 410 }],
      dispositivi: [{ nome: 'ios', valore: 700 }, { nome: 'android', valore: 420 }, { nome: 'desktop', valore: 120 }],
      versioni: [{ nome: '1.5.0', valore: 980 }, { nome: '1.4.0', valore: 260 }],
      temi: [{ nome: 'autunno', valore: 640 }, { nome: 'lampone', valore: 230 }, { nome: 'mare', valore: 200 },
             { nome: 'basilico', valore: 120 }, { nome: 'prugna', valore: 50 }],
      giorni: d.giorni.map(function (g) { return { giorno: g.giorno, n: Math.round(g.attivi * 2.8), media_s: Math.round(90 + rnd() * 120) }; })
    };
    d.errori = {
      n: 23,
      giorni: d.giorni.map(function (g, i) { return { giorno: g.giorno, n: i % 9 === 0 ? 3 : (rnd() < 0.2 ? 1 : 0) }; }),
      frequenti: [
        { tipo: 'query', messaggio: 'TypeError: Failed to fetch', pagina: '/lista', versione: '1.5.0', n: 9 },
        { tipo: 'modifica', messaggio: 'duplicate key value violates unique constraint', pagina: '/catalogo', versione: '1.5.0', n: 6 },
        { tipo: 'promessa', messaggio: 'AbortError: The operation was aborted.', pagina: '/', versione: '1.4.0', n: 4 }
      ]
    };
    d.percorso = { registrati: 92, confermati: 84, profilo: 78, lista: 70, prodotto: 61 };
    d.funzioni = { inviti_rinnovati: 6 };
    stato.landingPercorso = { visite: 726, visite_verso_app: 258 };
  }

  function casuale(seme) {
    return function () { seme = (seme * 9301 + 49297) % 233280; return seme / 233280; };
  }

  function finteApp() {
    var n = stato.tutto ? 365 : (stato.giorni || 1);
    var rnd = casuale(n * 7 + 3);
    var giorni = [];
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    for (var i = 0; i < n; i++) {
      var d = new Date(oggi); d.setDate(d.getDate() - n + 1 + i);
      giorni.push({ giorno: iso(d), onda: 1 + Math.sin(i / 3) * 0.4 + i / n });
    }
    stato.giorni_ = n;
    var wau = 0;
    giorni = giorni.map(function (g, i) {
      var a = Math.round(6 * g.onda + rnd() * 4);
      wau = Math.round(a * 2.6);
      return {
        giorno: g.giorno, attivi: a, attivi_7g: wau, registrazioni: Math.round(rnd() * 4 * g.onda),
        prodotti: Math.round(a * (4 + rnd() * 3)), spese: Math.round(a / 3), liste: Math.round(rnd() * 2),
        inviti: Math.round(rnd() * 1.4), inviti_falliti: i === Math.floor(n * 0.6) ? 34 : Math.round(rnd() * 2)
      };
    });
    var somma = function (k) { return giorni.reduce(function (a, g) { return a + g[k]; }, 0); };
    stato.app = {
      oggi: { utenti: 4 + somma('registrazioni'), profili_completi: 3 + somma('registrazioni'), liste: 20, liste_condivise: 9,
              persone_per_lista: 1.8, attivi_oggi: giorni[giorni.length - 1].attivi, attivi_7g: wau, attivi_30g: Math.round(wau * 1.7) },
      periodo_tot: { registrazioni: somma('registrazioni'), profili_completati: Math.round(somma('registrazioni') * 0.85),
                     liste_create: somma('liste'), liste_eliminate: 2, prodotti_aggiunti: somma('prodotti'),
                     spese_a_mano: Math.round(somma('spese') * 0.7), spese_automatiche: Math.round(somma('spese') * 0.3),
                     inviti_usati: somma('inviti'), inviti_falliti: somma('inviti_falliti'), account_eliminati: 1,
                     persone_attive: Math.round(wau * 1.9) },
      retention: { r1: { base: 30, tornati: 17 }, r7: { base: 22, tornati: 9 }, r30: { base: 0, tornati: 0 } },
      giorni: giorni,
      spazio: { db_byte: 31 * 1024 * 1024, db_limite: 500 * 1024 * 1024, storage_byte: 6 * 1024 * 1024, storage_limite: 1024 * 1024 * 1024 },
      dati_dal: new Date().toISOString()
    };
    stato.appPrima = { periodo_tot: { registrazioni: Math.round(somma('registrazioni') * 0.6), profili_completati: 10,
      persone_attive: Math.round(wau * 1.5), prodotti_aggiunti: Math.round(somma('prodotti') * 1.1), spese_a_mano: 5,
      spese_automatiche: 3, inviti_usati: somma('inviti'), inviti_falliti: 4 } };
  }
  /* ---------- dati finti, solo in locale ----------

     Con ?finto su localhost il cruscotto si disegna senza accesso e
     senza rete, con righe inventate che passano per gli stessi
     calcoli dei dati veri. In rete la condizione e' falsa. */
  var locale = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  stato.finto = locale && /[?&]finto\b/.test(location.search);

  function finteLanding() {
    var rnd = casuale(17 + stato.giorni);
    var pesca = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var giorni = stato.tutto ? 30 : (stato.giorni || 1);
    var adesso = Date.now();
    var visite = [], pagine = [], eventi = [];
    var luoghi = [['Italia', 'Veneto', 'Venezia'], ['Italia', 'Lombardia', 'Milano'], ['Italia', 'Lazio', 'Roma'],
                  ['Italia', 'Emilia-Romagna', 'Bologna'], ['Italia', 'Veneto', 'Padova'], ['Svizzera', 'Ticino', 'Lugano']];
    var canali = [['social', 'instagram.com'], ['social', 'instagram.com'], ['diretto', null], ['campagna', 'instagram.com'],
                  ['organico', 'google.com'], ['referral', 'reddit.com'], ['social', 'linkedin.com']];
    var tech = [['mobile', 'iOS', 'Safari', 390], ['mobile', 'iOS', 'Safari', 430], ['mobile', 'Android', 'Chrome', 412],
                ['desktop', 'macOS', 'Chrome', 1440], ['desktop', 'Windows', 'Edge', 1280]];
    var sezioni = ['inizio', 'come-funziona', 'installa', 'domande', 'caffe'];
    var n = 0;
    for (var g = giorni - 1; g >= 0; g--) {
      var quante = Math.round((giorni === 1 ? 40 : 14) * (1 + Math.sin(g / 3) * 0.4 + (giorni - g) / giorni) + rnd() * 6);
      for (var k = 0; k < quante; k++) {
        var inizio = adesso - g * 86400000 - Math.floor(rnd() * (g === 0 ? Math.min(86400000, (new Date().getHours() * 60 + new Date().getMinutes()) * 60000) : 86400000));
        if (giorni === 1 && k < 2) inizio = adesso - (k + 1) * 60000;
        var c = pesca(canali), l = pesca(luoghi), t = pesca(tech);
        var id = 'v' + (++n);
        var v = {
          id: id, impronta: 'i' + Math.floor(n * 0.85), iniziata: new Date(inizio).toISOString(),
          vista_ultima: new Date(inizio + 90000).toISOString(), canale: c[0], referente_host: c[1],
          paese: l[0], regione: l[1], citta: l[2], dispositivo: t[0], sistema: t[1], browser: t[2],
          area_w: t[3], rete: pesca(['Vodafone', 'TIM', 'Fastweb', 'Iliad', 'WindTre']), bot: rnd() < 0.06
        };
        visite.push(v);
        var lunga = rnd() > 0.35;
        var sez = {};
        sezioni.forEach(function (x, i) { if (lunga || i === 0) sez[x] = Math.round(2000 + rnd() * 30000 / (i + 1)); });
        var pid = 'p' + n;
        pagine.push({
          id: pid, visita_id: id, percorso: '/sub/frigolo', titolo: 'Frigolo', lingua: 'it',
          aperta: v.iniziata, ms_attivi: lunga ? Math.round(15000 + rnd() * 90000) : Math.round(rnd() * 9000),
          scroll_max: lunga ? Math.round(40 + rnd() * 60) : Math.round(rnd() * 25), sezioni: sez,
          sezione_ora: pesca(sezioni), stato: 200
        });
        if (rnd() < 0.08) {
          pagine.push({ id: pid + 'b', visita_id: id, percorso: pesca(['/sub/frigolo/privacy.html', '/sub/frigolo/termini.html']),
            titolo: 'Privacy', lingua: 'it', aperta: new Date(inizio + 60000).toISOString(),
            ms_attivi: Math.round(rnd() * 60000), scroll_max: Math.round(rnd() * 100), sezioni: {}, stato: 200 });
        }
        if (lunga && rnd() < 0.55) {
          var nome = pesca(['apri-app', 'apri-app', 'installa-ios', 'installa-android']);
          eventi.push({ visita_id: id, pagina_id: pid, quando: new Date(inizio + 50000).toISOString(),
            tipo: 'uscita', nome: 'frigolo:' + nome, destinazione: 'https://frigolo.dascanfe.com/' });
        }
        if (lunga && rnd() < 0.04) {
          eventi.push({ visita_id: id, pagina_id: pid, quando: new Date(inizio + 70000).toISOString(),
            tipo: 'uscita', nome: 'frigolo:caffe', destinazione: 'https://paypal.me/DanieleScanferlato' });
        }
        if (rnd() < 0.05) {
          eventi.push({ visita_id: id, pagina_id: pid, quando: new Date(inizio + 30000).toISOString(),
            tipo: 'uscita', nome: 'frigolo:github', destinazione: 'https://github.com/dascanfe/frigolo' });
        }
      }
    }
    eventi.sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });
    stato.visite = visite;
    stato.pagine = pagine;
    stato.eventi = eventi;
    stato.sistema = { battito: new Date().toISOString(), geo_aggiornato: new Date(adesso - 9 * 86400000).toISOString() };
    stato.prima = stato.tutto ? null : {
      visitatori: Math.round(visite.length * 0.7), visite: Math.round(visite.length * 0.8),
      pagine: Math.round(pagine.length * 0.78), tempo: 30000, scroll: 60, rimbalzo: 41,
      download: Math.round(eventi.length * 0.5)
    };
  }

  /* Se la libreria lascia cadere la sessione (rinnovo fallito, uscita
     da un'altra scheda), lo dice qui. Prima non lo ascoltava nessuno,
     e il cruscotto restava a schermo a leggere il vuoto. */
  sb.auth.onAuthStateChange(function (evento, sessione) {
    if (evento === 'INITIAL_SESSION') return;          // e' l'avvio, se ne occupa il blocco sotto
    if (evento === 'SIGNED_OUT' || !sessione) {
      if (document.body.classList.contains('dentro')) fuoriSessione();
    }
  });

  /* Il cruscotto salvato sulla schermata dell'iPhone non viene chiuso
     ma congelato: quando si riapre, la pagina e' ancora quella di
     giorni prima, con il gettone scaduto e il canale caduto. Stessa
     cosa sul portatile che si risveglia. Al ritorno in primo piano si
     ricontrolla la sessione, si rileggono i dati e si riapre il
     collegamento dal vivo. */
  function alRisveglio() {
    if (document.visibilityState !== 'visible') return;
    if (!document.body.classList.contains('dentro')) return;
    // caricaSezione riapre il canale solo se e' davvero caduto
    caricaSezione();
  }
  document.addEventListener('visibilitychange', alRisveglio);
  window.addEventListener('online', alRisveglio);
  window.addEventListener('pageshow', function (e) { if (e.persisted) alRisveglio(); });

  if (stato.finto) {
    testo($('prova-banner'), 'Dati finti: ?finto in locale. Nessun accesso, nessuna rete.');
    // per le prove: &chiaro o &scuro, &app per la sezione App, &giorni=7|30
    var q = location.search;
    if (/[?&]chiaro\b/.test(q)) applicaTema('chiaro');
    if (/[?&]scuro\b/.test(q)) applicaTema('scuro');
    if (/[?&]app\b/.test(q)) stato.sezione = 'app';
    var gg = /[?&]giorni=(\d+)/.exec(q);
    if (gg) {
      stato.giorni = +gg[1];
      [].forEach.call($('periodi').querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(!x.hasAttribute('data-tutto') && +x.getAttribute('data-giorni') === stato.giorni));
      });
    }
    avvia();
    return;
  }

  sessioneViva().then(function (viva) {
    if (viva && viva !== MUTO) {
      if (viva.user && viva.user.email) stato.email = viva.user.email;
      avvia();
      return;
    }
    if (viva === MUTO) {
      var err = $('errore-accesso');
      if (err) err.textContent = 'Non riesco a raggiungere il server. Controlla la rete e riprova.';
    }
    $('email').focus();
  });
})();
