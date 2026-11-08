import { useCallback, useEffect, useRef, useState } from 'react'

/** Id dell'intestazione di una categoria nella pagina del catalogo */
export const categoryAnchorId = (slug: string) => `cat-${slug}`

/**
 * Scroll-spy del catalogo: ritorna la categoria visibile in cima (null =
 * prima di tutte) e `goTo` per andarci dal tocco su una chip.
 *
 * A ogni evento di scorrimento si cerca l'ultima intestazione di categoria che
 * ha superato la linea appena sotto la barra delle chip (misurata in quel
 * momento, perché la barra cambia posizione quando si attacca in alto). Una
 * sentinella in fondo attiva l'ultima categoria a fine pagina,
 * anche se è troppo corta per superare la linea. Durante lo scorrimento
 * animato dopo un tocco l'evidenziazione resta sulla chip toccata, senza
 * rimbalzare sulle categorie attraversate.
 */
export function useCategoryScrollSpy(
  slugs: readonly string[],
  stickyRef: React.RefObject<HTMLElement | null>,
  endRef: React.RefObject<HTMLElement | null>,
) {
  const [active, setActive] = useState<string | null>(null)
  const lockedRef = useRef<string | null>(null)
  const atEndRef = useRef(false)
  /** Interrompe lo scorrimento in corso (listener e timer del tocco su una chip) */
  const cancelGoToRef = useRef<(() => void) | null>(null)
  const slugKey = slugs.join('|')

  /** Sotto la barra appiccicosa: la categoria "corrente" è quella che ha superato questa linea */
  const barBottom = useCallback(() => {
    const bar = stickyRef.current
    return bar ? bar.getBoundingClientRect().bottom : 72
  }, [stickyRef])

  useEffect(() => {
    const order = slugKey ? slugKey.split('|') : []
    const recompute = () => {
      if (lockedRef.current) return
      if (atEndRef.current && order.length > 0) {
        setActive(order[order.length - 1] ?? null)
        return
      }
      // appena l'intestazione entra nella parte alta dello schermo, sotto la barra
      const line = barBottom() + 56
      let current: string | null = null
      for (const slug of order) {
        const el = document.getElementById(categoryAnchorId(slug))
        if (el && el.getBoundingClientRect().top <= line) current = slug
        else break
      }
      setActive(current)
    }

    // il calcolo è leggero (una quindicina di intestazioni): si fa a ogni scroll,
    // così la chip cambia esattamente quando la sezione arriva in cima
    const onScroll = () => recompute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const end = new IntersectionObserver(
      (entries) => {
        atEndRef.current = entries.some((entry) => entry.isIntersecting)
        recompute()
      },
      { threshold: 0 },
    )
    if (endRef.current) end.observe(endRef.current)
    recompute()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      end.disconnect()
    }
  }, [slugKey, endRef, barBottom])

  // uscendo dalla pagina nessun listener o timer deve restare in giro: a scorrimento
  // finito correggerebbe lo scroll di un'altra schermata
  useEffect(() => () => cancelGoToRef.current?.(), [])

  const goTo = useCallback(
    (slug: string | null) => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      /** Dove deve stare lo scroll perché l'intestazione sia sotto la barra */
      const targetTop = () => {
        const el = slug ? document.getElementById(categoryAnchorId(slug)) : null
        if (!el) return 0
        return Math.max(0, el.getBoundingClientRect().top + window.scrollY - barBottom() + 4)
      }
      cancelGoToRef.current?.()
      setActive(slug)
      lockedRef.current = slug ?? '__top'
      window.scrollTo({ top: targetTop(), behavior: reduce ? 'auto' : 'smooth' })

      // a fine scorrimento (scrollend dove c'è, altrimenti quando smette di muoversi)
      // si corregge un'eventuale deriva (la pagina sopra può cambiare altezza
      // mentre scorre) e si sblocca la ricerca della categoria attiva
      let timer = 0
      let corrected = false
      const release = () => {
        window.clearTimeout(timer)
        const drift = targetTop() - window.scrollY
        if (!corrected && Math.abs(drift) > 4) {
          corrected = true
          window.scrollTo({ top: targetTop(), behavior: 'auto' })
          timer = window.setTimeout(release, 150)
          return
        }
        cancel()
      }
      const cancel = () => {
        window.clearTimeout(timer)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('scrollend', release)
        lockedRef.current = null
        cancelGoToRef.current = null
      }
      cancelGoToRef.current = cancel
      const onScroll = () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(release, 140)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('scrollend', release, { once: true })
      // se la pagina è già nel punto giusto non arriva nessuno scroll
      timer = window.setTimeout(release, 400)
    },
    [barBottom],
  )

  return { active, goTo }
}
