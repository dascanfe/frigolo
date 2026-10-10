// Landing di Frigolo: schede iPhone / Android per l'installazione.
// Mostra prima quella del telefono di chi visita; tastiera come le schede ARIA.
;(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'))
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
