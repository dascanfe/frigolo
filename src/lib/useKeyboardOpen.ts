import { useEffect, useState } from 'react'

/** Campi in cui si scrive: quando uno ha il focus, la tastiera è (o sta per essere) aperta */
function isTextField(element: Element | null): boolean {
  if (!element) return false
  if (element instanceof HTMLTextAreaElement) return true
  if (element instanceof HTMLElement && element.isContentEditable) return true
  if (!(element instanceof HTMLInputElement)) return false
  return ![
    'button',
    'checkbox',
    'radio',
    'range',
    'file',
    'submit',
    'reset',
    'image',
    'color',
  ].includes(element.type)
}

/** Soglia sotto la quale la differenza di altezza non è la tastiera (barra degli indirizzi che si ritira) */
const KEYBOARD_MIN_SHRINK_PX = 120

/**
 * True quando la tastiera del telefono è aperta: un campo di testo ha il
 * focus, oppure il viewport visivo è molto più basso di quello della finestra.
 * Serve a nascondere elementi fissi in basso, che con la tastiera si
 * spostano (su iOS la tastiera sposta il viewport visivo, non il layout).
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function update() {
      const viewport = window.visualViewport
      const shrunk = viewport
        ? window.innerHeight - viewport.height > KEYBOARD_MIN_SHRINK_PX
        : false
      setOpen(isTextField(document.activeElement) || shrunk)
    }
    // il focus cambia prima che document.activeElement sia aggiornato in tutti i browser
    const onFocusChange = () => window.setTimeout(update, 0)
    document.addEventListener('focusin', onFocusChange)
    document.addEventListener('focusout', onFocusChange)
    window.visualViewport?.addEventListener('resize', update)
    update()
    return () => {
      document.removeEventListener('focusin', onFocusChange)
      document.removeEventListener('focusout', onFocusChange)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return open
}
