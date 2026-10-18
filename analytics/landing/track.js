/* ============================================================
   Statistiche della landing di Frigolo (www.dascanfe.com/sub/frigolo/)

   Parla con lo stesso raccoglitore del sito (/sub/s/c.php), con lo
   stesso formato di t.js, e finisce nelle stesse tabelle: per il
   database e' una pagina del sito come le altre. Rispetto a t.js e'
   piu' piccolo e raccoglie meno:
     - niente tempo per sezione, niente testo dei link interni;
     - della pagina di provenienza solo indirizzo senza parametri;
     - dei parametri dell'indirizzo solo quelli utm_;
     - i clic registrati per nome sono solo quelli marcati con
       data-track (Apri Frigolo, caffe', istruzioni, GitHub), piu' i
       link verso altri siti.

   Non scrive niente sul dispositivo: nessun cookie, nessuna memoria
   locale, nessun identificativo persistente. L'unico identificativo
   e' quello della pagina aperta, tenuto in memoria e perso alla
   chiusura. Il visitatore unico lo stima il server con un'impronta
   che cambia ogni notte (vedi docs/metriche.md); l'indirizzo IP non
   viene salvato.

   Non conta chi chiede di non essere tracciato (Global Privacy
   Control o Do Not Track), ne' i browser pilotati da programmi.

   Come si include (in fondo al <body> della landing):

     <script src="track.js" data-chiave="__STATS_KEY__" defer></script>

   La chiave e' la stessa di /sub/s/t.js (serve al raccoglitore per
   scartare i messaggi che non arrivano dal sito). Non sta nel repo:
   la mette landing/build.mjs al posto di __STATS_KEY__ leggendola
   dalla variabile d'ambiente FRIGOLO_STATS_KEY. Senza chiave lo
   script non fa niente.

   E sugli elementi che contano (data-evento vale come sinonimo):

     <a href="https://frigolo.dascanfe.com" data-track="apri-app">Apri Frigolo</a>
     <a href="https://paypal.me/..." data-track="caffe">Offrimi un caffe' 💚</a>
     <details data-track="installa-ios">...</details>
     <button data-track="installa-android">...</button>

   Per eventi senza un elemento: window.frigoloStats.evento('nome').

   Per non essere contati, come sul resto del sito: ?no-stats
   (e ?si-stats per tornare).
   ============================================================ */
;(function () {
  'use strict'

  var script = document.currentScript
  var CHIAVE = script && script.getAttribute('data-chiave')
  var ENDPOINT = (script && script.getAttribute('data-endpoint')) || '/sub/s/c.php'
  var BATTITO = 15000
  var PRIMO_BATTITO = 5000

  // l'API resta definita anche quando non si conta, cosi' la pagina
  // puo' chiamarla senza controlli
  window.frigoloStats = { evento: function () {} }

  /* ---------- chi non viene contato ---------- */

  // stessa esclusione del resto del sito (la imposta solo chi apre ?no-stats)
  var escluso = false
  try {
    var q = location.search
    if (q.indexOf('no-stats') > -1) localStorage.setItem('umami.disabled', '1')
    else if (q.indexOf('si-stats') > -1) localStorage.removeItem('umami.disabled')
    escluso = localStorage.getItem('umami.disabled') !== null
  } catch (e) {}

  var sitoVero =
    /(^|\.)dascanfe\.com$/.test(location.hostname) ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
  var pilotato =
    navigator.webdriver === true ||
    /headless|phantom|puppeteer|playwright|bot|crawler|spider/i.test(navigator.userAgent)
  var nonTracciare =
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1'

  if (!CHIAVE || CHIAVE.indexOf('__') === 0 || !sitoVero || pilotato || escluso || nonTracciare)
    return

  /* ---------- identificativo della pagina, solo in memoria ---------- */

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    var b = new Uint8Array(16)
    crypto.getRandomValues(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    var h = []
    for (var i = 0; i < 16; i++) h.push((b[i] + 0x100).toString(16).slice(1))
    return (
      h.slice(0, 4).join('') +
      '-' +
      h.slice(4, 6).join('') +
      '-' +
      h.slice(6, 8).join('') +
      '-' +
      h.slice(8, 10).join('') +
      '-' +
      h.slice(10).join('')
    )
  }

  var PID = uuid()

  /* ---------- tempo con la scheda in primo piano e scorrimento ---------- */

  var nato = Date.now()
  var attivo = 0
  var daQuando = Date.now()
  var visibile = document.visibilityState !== 'hidden'

  function msAttivi() {
    return attivo + (visibile ? Date.now() - daQuando : 0)
  }

  var scrollMax = 0
  function misuraScroll() {
    var h = (document.documentElement.scrollHeight || 0) - window.innerHeight
    var p = h > 8 ? Math.round((window.scrollY / h) * 100) : 100
    if (p > scrollMax) scrollMax = Math.max(0, Math.min(100, p))
  }

  /* ---------- clic che contano ---------- */

  var eventi = [] // solo quelli non ancora spediti
  var clickTot = 0

  // indirizzo senza parametri ne' ancora: basta per capire dove si va
  function pulito(href) {
    try {
      var u = new URL(href, location.href)
      return (u.origin + u.pathname).slice(0, 200)
    } catch (e) {
      return ''
    }
  }

  function registra(nome, tipo, destinazione) {
    if (eventi.length > 30) return // tetto di sicurezza
    eventi.push({ t: tipo, n: nome.slice(0, 80), d: destinazione || null })
    // un clic che conta si spedisce subito: chi apre Frigolo spesso
    // lascia la pagina un attimo dopo
    setTimeout(function () {
      invia('battito', false)
    }, 0)
  }

  document.addEventListener(
    'click',
    function (e) {
      if (e.isTrusted === false) return
      clickTot++
      var el =
        e.target && e.target.closest
          ? e.target.closest('[data-track], [data-evento], a[href]')
          : null
      if (!el) return
      // le <details> si contano quando si aprono (sotto), non a ogni clic
      if (el.tagName === 'DETAILS' || el.tagName === 'SUMMARY') return

      var nome = el.getAttribute('data-track') || el.getAttribute('data-evento')
      var href = el.getAttribute('href') || ''
      var esterno = /^https?:\/\//i.test(href) && pulito(href).indexOf(location.origin) !== 0

      if (nome) {
        registra('frigolo:' + nome, esterno ? 'uscita' : 'click', href ? pulito(href) : null)
      } else if (esterno) {
        registra(
          (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim() ||
            'link',
          'uscita',
          pulito(href),
        )
      }
    },
    true,
  )

  // <details data-track="..."> aperto: istruzioni di installazione lette
  document.addEventListener(
    'toggle',
    function (e) {
      var el = e.target
      var nome = el && (el.getAttribute('data-track') || el.getAttribute('data-evento'))
      if (el && el.tagName === 'DETAILS' && el.open && nome) {
        registra('frigolo:' + nome, 'click', null)
      }
    },
    true,
  )

  window.frigoloStats.evento = function (nome) {
    if (typeof nome === 'string' && /^[a-z0-9-]{1,40}$/.test(nome))
      registra('frigolo:' + nome, 'click', null)
  }

  /* ---------- il messaggio (formato di t.js, versione 1) ---------- */

  function soloUtm() {
    var out = []
    try {
      new URLSearchParams(location.search).forEach(function (v, k) {
        if (/^utm_(source|medium|campaign)$/.test(k))
          out.push(k + '=' + encodeURIComponent(v.slice(0, 100)))
      })
    } catch (e) {}
    return out.length ? '?' + out.join('&') : ''
  }

  var primoInvio = true

  function messaggio(tipo) {
    var m = {
      v: 1,
      k: CHIAVE,
      pid: PID,
      tipo: tipo,
      p: location.pathname,
      qs: soloUtm(),
      ti: (document.title || '').slice(0, 200),
      lg: document.documentElement.lang || null,
      tz: (function () {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || null
        } catch (e) {
          return null
        }
      })(),
      ms: msAttivi(),
      tot: Date.now() - nato,
      sc: scrollMax,
      cl: clickTot,
      sez: {},
      st: 200,
      // servono al raccoglitore per riconoscere i robot (schermo assente
      // o assurdo) e per distinguere telefono e computer
      sw: screen.width || 0,
      sh: screen.height || 0,
      vw: window.innerWidth || 0,
      vh: window.innerHeight || 0,
      dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      ua: navigator.userAgentData ? { mob: !!navigator.userAgentData.mobile } : null,
    }
    if (primoInvio && document.referrer) m.rf = pulito(document.referrer)
    if (eventi.length) m.ev = eventi.slice(0)
    return m
  }

  function invia(tipo, finale) {
    misuraScroll()
    var quanti = eventi.length
    var corpo = JSON.stringify(messaggio(tipo))
    var partito = false

    if (finale && navigator.sendBeacon) {
      try {
        partito = navigator.sendBeacon(
          ENDPOINT,
          new Blob([corpo], { type: 'text/plain;charset=UTF-8' }),
        )
      } catch (e) {
        partito = false
      }
    }
    if (!partito) {
      try {
        fetch(ENDPOINT, {
          method: 'POST',
          body: corpo,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          keepalive: true,
          credentials: 'omit',
          mode: 'same-origin',
        }).catch(function () {})
        partito = true
      } catch (e) {}
    }
    if (partito) {
      primoInvio = false
      eventi.splice(0, quanti)
    }
  }

  /* ---------- battito e chiusura ---------- */

  var timer = null
  var primo = null
  var chiusa = false

  function avviaBattito() {
    if (timer || primo) return
    primo = setTimeout(function () {
      primo = null
      if (visibile) invia('battito', false)
      timer = setInterval(function () {
        if (visibile) invia('battito', false)
      }, BATTITO)
    }, PRIMO_BATTITO)
  }

  function fermaBattito() {
    if (primo) {
      clearTimeout(primo)
      primo = null
    }
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function chiudi() {
    if (chiusa) return
    chiusa = true
    if (visibile) attivo += Date.now() - daQuando
    visibile = false
    fermaBattito()
    invia('fine', true)
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      chiudi()
    } else {
      chiusa = false
      if (!visibile) {
        daQuando = Date.now()
        visibile = true
      }
      avviaBattito()
    }
  })
  window.addEventListener('pagehide', chiudi)
  window.addEventListener('scroll', misuraScroll, { passive: true })

  function parti() {
    misuraScroll()
    invia('apertura', false)
    avviaBattito()
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', parti, { once: true })
  else parti()
})()
