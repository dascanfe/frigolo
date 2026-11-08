import { useLayoutEffect } from 'react'

/**
 * Animazioni FLIP per le tile della lista: quando un prodotto passa da "Da
 * comprare" al carrello (o torna indietro) si vede volare nella nuova posizione
 * e le tile vicine scivolano a riempire il buco o a fargli posto.
 *
 * 1. al tocco `captureFlip` fotografa la posizione di tutte le tile con
 *    `data-flip-id` (e clona quella toccata, nel caso sparisca);
 * 2. al render successivo `useFlipPlay` misura le nuove posizioni e anima ogni
 *    tile dalla vecchia alla nuova con la Web Animations API (solo transform,
 *    quindi fluida anche sui telefoni).
 *
 * Se la tile toccata non c'è più (carrello chiuso) un suo clone vola verso
 * l'elemento `data-flip-target` indicato, rimpicciolendosi e svanendo.
 */

interface Snapshot {
  rects: Map<string, { x: number; y: number }>
  movingId: string
  ghost: HTMLElement | null
  ghostRect: DOMRect | null
  target: string | null
  expires: number
}

let snapshot: Snapshot | null = null

const LIQUID = 'cubic-bezier(0.55, 0.05, 0.2, 1)'
const ORGANIC = 'cubic-bezier(0.22, 1, 0.36, 1)'

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Da chiamare al tocco, prima di cambiare lo stato del prodotto */
export function captureFlip(movingId: string, target: string | null = null) {
  if (reducedMotion()) return
  const rects = new Map<string, { x: number; y: number }>()
  let ghost: HTMLElement | null = null
  let ghostRect: DOMRect | null = null
  for (const el of document.querySelectorAll<HTMLElement>('[data-flip-id]')) {
    const id = el.dataset.flipId
    if (!id) continue
    const r = el.getBoundingClientRect()
    // coordinate del documento: se nel frattempo la pagina scorre i conti tornano
    rects.set(id, { x: r.left + window.scrollX, y: r.top + window.scrollY })
    if (id === movingId) {
      ghost = el.cloneNode(true) as HTMLElement
      ghostRect = r
    }
  }
  snapshot = { rects, movingId, ghost, ghostRect, target, expires: performance.now() + 1500 }
}

function flyGhost(snap: Snapshot) {
  const { ghost, ghostRect, target } = snap
  if (!ghost || !ghostRect) return
  const to = target ? document.querySelector<HTMLElement>(`[data-flip-target="${target}"]`) : null
  const dest = to?.getBoundingClientRect()
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${ghostRect.left}px`,
    top: `${ghostRect.top}px`,
    width: `${ghostRect.width}px`,
    height: `${ghostRect.height}px`,
    margin: '0',
    zIndex: '40',
    pointerEvents: 'none',
  })
  ghost.removeAttribute('data-flip-id')
  ghost.setAttribute('aria-hidden', 'true')
  document.body.appendChild(ghost)
  const dx = dest ? dest.left + 24 - (ghostRect.left + ghostRect.width / 2) : 0
  const dy = dest ? dest.top + dest.height / 2 - (ghostRect.top + ghostRect.height / 2) : 80
  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 24}px) scale(0.8)`,
        opacity: 1,
        offset: 0.45,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: 620, easing: LIQUID },
  )
  animation.onfinish = () => ghost.remove()
  animation.oncancel = () => ghost.remove()
}

/** Va chiamato nel componente che disegna le griglie: anima dopo ogni cambio */
export function useFlipPlay() {
  useLayoutEffect(() => {
    const snap = snapshot
    if (!snap) return
    if (performance.now() > snap.expires) {
      snapshot = null
      return
    }
    const els = [...document.querySelectorAll<HTMLElement>('[data-flip-id]')]
    const moves: { el: HTMLElement; dx: number; dy: number; moving: boolean }[] = []
    let movingFound = false
    for (const el of els) {
      const id = el.dataset.flipId
      if (!id) continue
      const before = snap.rects.get(id)
      if (id === snap.movingId) movingFound = true
      if (!before) continue
      const r = el.getBoundingClientRect()
      const dx = before.x - (r.left + window.scrollX)
      const dy = before.y - (r.top + window.scrollY)
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1)
        moves.push({ el, dx, dy, moving: id === snap.movingId })
    }
    // nessun cambio ancora (render dovuto ad altro): si aspetta il prossimo
    if (moves.length === 0 && movingFound) return
    snapshot = null

    for (const { el, dx, dy, moving } of moves) {
      if (moving) {
        // il prodotto toccato: vola con un piccolo arco, si rimpicciolisce e "cade" nel carrello
        el.style.zIndex = '5'
        const animation = el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(1)` },
            {
              transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 28}px) scale(0.82)`,
              offset: 0.5,
            },
            { transform: 'translate(0, 0) scale(1.04)', offset: 0.85 },
            { transform: 'translate(0, 0) scale(1)' },
          ],
          { duration: 720, easing: LIQUID },
        )
        animation.onfinish = () => (el.style.zIndex = '')
        animation.oncancel = () => (el.style.zIndex = '')
      } else {
        // le vicine scivolano al loro nuovo posto
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 520, easing: ORGANIC },
        )
      }
    }
    if (!movingFound) flyGhost(snap)
  })
}
