// Landing di Frigolo: comparsa allo scroll, telefono che cambia schermata,
// animazione dei due telefoni, schede iPhone / Android. Niente librerie.
;(function () {
  'use strict'
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }
  var hasIO = 'IntersectionObserver' in window

  /* ---------- comparsa degli elementi ---------- */
  var reveals = $$('.reveal')
  if (hasIO) {
    var revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          entry.target.classList.add('in')
          revealObs.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    reveals.forEach(function (el) {
      revealObs.observe(el)
    })
  } else {
    reveals.forEach(function (el) {
      el.classList.add('in')
    })
  }

  /* ---------- funzioni: la schermata segue il testo ---------- */
  var feats = $$('.feat')
  var screens = $$('.screens img')
  if (hasIO && feats.length && screens.length) {
    var setActive = function (index) {
      feats.forEach(function (f, i) {
        f.classList.toggle('is-active', i === index)
      })
      screens.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index)
      })
    }
    setActive(0)
    var featObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(Number(entry.target.getAttribute('data-screen')))
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    feats.forEach(function (f) {
      featObs.observe(f)
    })
  }

  /* ---------- due telefoni: l'animazione gira solo se si vedono ---------- */
  var duo = document.getElementById('duo')
  if (duo) {
    if (hasIO) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            duo.classList.toggle('in', entry.isIntersecting)
          })
        },
        { threshold: 0.35 },
      ).observe(duo)
    } else {
      duo.classList.add('in')
    }
  }

  /* ---------- installazione: schede ARIA ---------- */
  var tabs = $$('.tab')
  if (!tabs.length) return

  function select(tab, focus) {
    tabs.forEach(function (other) {
      var selected = other === tab
      other.setAttribute('aria-selected', String(selected))
      other.tabIndex = selected ? 0 : -1
      document.getElementById(other.getAttribute('aria-controls')).hidden = !selected
    })
    if (focus) tab.focus()
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      select(tab, false)
    })
    tab.addEventListener('keydown', function (event) {
      var next = null
      if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length]
      if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length]
      if (event.key === 'Home') next = tabs[0]
      if (event.key === 'End') next = tabs[tabs.length - 1]
      if (next) {
        event.preventDefault()
        select(next, true)
      }
    })
  })

  // Android prima di tutto il resto: anche gli iPad "desktop" dicono Macintosh
  var ua = navigator.userAgent || ''
  if (/android/i.test(ua)) select(document.getElementById('tab-android'), false)
})()
