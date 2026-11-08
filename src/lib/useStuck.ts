import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * True quando un elemento `position: sticky` si è attaccato al suo `top`
 * (cioè sta davvero sopra al contenuto che scorre). Serve a lasciare spazio
 * alla freccia indietro fissa solo da quel momento.
 */
export function useStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const update = () => {
      const el = ref.current
      if (!el) return
      const top = Number.parseFloat(getComputedStyle(el).top) || 0
      setStuck(el.getBoundingClientRect().top <= top + 1 && window.scrollY > 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])
  return stuck
}
