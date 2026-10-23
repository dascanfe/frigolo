import { useCallback, useEffect, useRef, useState } from 'react'

/** Id dell'intestazione di una categoria nella pagina del catalogo */
export const categoryAnchorId = (slug: string) => `cat-${slug}`

/**
 * Scroll-spy del catalogo: ritorna la categoria visibile in cima (null =
 * prima di tutte) e `goTo` per andarci dal tocco su una chip.
 *
 * Usa IntersectionObserver: ogni intestazione di categoria, quando supera la
 * linea sotto la barra delle chip, fa ricalcolare l'attiva (l'ultima sopra la
 * linea). Un sentinella in fondo attiva l'ultima categoria a fine pagina,
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
  const slugKey = slugs.join('|')

  /** Sotto la barra appiccicosa: la categoria "corrente" è quella che ha superato questa linea */
  const lineOffset = useCallback(() => {
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
      const line = lineOffset()
      let current: string | null = null
      for (const slug of order) {
        const el = document.getElementById(categoryAnchorId(slug))
        if (el && el.getBoundingClientRect().top <= line) current = slug
        else break
      }
      setActive(current)
    }

    const bar = stickyRef.current
    const topMargin = Math.round(bar ? bar.getBoundingClientRect().bottom : 72)
    const headings = new IntersectionObserver(recompute, {
      rootMargin: `-${topMargin}px 0px 0px 0px`,
      threshold: [0, 1],
    })
    for (const slug of order) {
      const el = document.getElementById(categoryAnchorId(slug))
      if (el) headings.observe(el)
    }
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
      headings.disconnect()
      end.disconnect()
    }
  }, [slugKey, stickyRef, endRef, lineOffset])

  const goTo = useCallback(
    (slug: string | null) => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      /** Dove deve stare lo scroll perché l'intestazione sia sotto la barra */
      const targetTop = () => {
        const el = slug ? document.getElementById(categoryAnchorId(slug)) : null
        if (!el) return 0
        return Math.max(0, el.getBoundingClientRect().top + window.scrollY - lineOffset() + 4)
      }
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
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('scrollend', release)
        lockedRef.current = null
      }
      const onScroll = () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(release, 140)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('scrollend', release, { once: true })
      // se la pagina è già nel punto giusto non arriva nessuno scroll
      timer = window.setTimeout(release, 400)
    },
    [lineOffset],
  )

  return { active, goTo }
}
