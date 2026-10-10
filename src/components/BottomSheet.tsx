import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Area fissa in fondo, tipicamente i bottoni di conferma */
  footer?: ReactNode
}

const CLOSE_DURATION_MS = 240
/** Trascinamento oltre questa frazione dell'altezza (o veloce) chiude il pannello */
const DRAG_CLOSE_FRACTION = 0.3
const DRAG_CLOSE_VELOCITY = 0.6

/**
 * Pannello modale che sale dal basso. Si chiude con il bottone, tap sullo
 * sfondo, Esc, oppure trascinandolo verso il basso (dalla maniglia, dal
 * titolo, o dal contenuto quando è già in cima). Resta montato per la
 * durata dell'animazione di uscita.
 */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const [prevOpen, setPrevOpen] = useState(open)
  const [closing, setClosing] = useState(false)
  const [instantClose, setInstantClose] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  // onClose è spesso una arrow inline del genitore, quindi cambia a ogni suo
  // render: gli effetti non devono dipendere da lei, altrimenti si rimontano
  // (e rubano il focus al campo di testo, chiudendo la tastiera) a ogni lettera
  const close = useEffectEvent(() => onClose())

  // Stato derivato dal cambio di prop, aggiornato durante il render (pattern
  // consigliato da React): quando open passa a false parte l'animazione di
  // uscita, tranne se il pannello è già stato trascinato via.
  if (open !== prevOpen) {
    setPrevOpen(open)
    setClosing(!open && !instantClose)
    if (open) setInstantClose(false)
  }

  // a fine animazione di uscita il pannello viene smontato
  useEffect(() => {
    if (!closing) return
    const timeout = window.setTimeout(() => setClosing(false), CLOSE_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [closing])

  const mounted = open || closing

  // Esc, blocco scroll e gestione del focus finché il pannello è aperto.
  // Il body NON viene fissato: su iOS, quando si apre la tastiera dentro il
  // pannello, Safari sposta la pagina per mostrare il campo e con il body
  // fissato tutto finisce fuori schermo. Lo sfondo resta fermo perché il
  // backdrop ha touch-action: none e il contenuto overscroll-behavior: contain.
  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = previousOverflow
      previousFocus.current?.focus?.()
    }
  }, [open])

  // Tastiera aperta: il pannello si restringe alla parte visibile dello
  // schermo (visualViewport) e resta ancorato in basso, così il contenuto
  // scorre dentro il pannello invece di uscire dai bordi.
  useEffect(() => {
    const panel = panelRef.current
    const viewport = window.visualViewport
    if (!open || !panel || !viewport) return

    const fit = () => {
      const keyboardOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      const shrunk = window.innerHeight - viewport.height > 80
      panel.style.bottom = shrunk ? `${keyboardOffset}px` : ''
      panel.style.maxHeight = shrunk ? `${viewport.height - 24}px` : ''
      if (shrunk) {
        // mantiene il campo attivo in vista dentro il contenuto scorrevole
        const active = document.activeElement
        if (active instanceof HTMLElement && panel.contains(active)) {
          active.scrollIntoView({ block: 'nearest' })
        }
      }
    }
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    fit()
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
      panel.style.bottom = ''
      panel.style.maxHeight = ''
    }
  }, [open])

  // Trascinamento verso il basso (touch e mouse, tramite Pointer Events)
  useEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return

    let pointerId: number | null = null
    let startY = 0
    let startTime = 0
    let dragging = false
    let allowed = false
    let lastDy = 0

    const setOffset = (dy: number, animate: boolean) => {
      panel.style.transition = animate
        ? `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1)`
        : 'none'
      panel.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
      const backdrop = backdropRef.current
      if (backdrop) {
        backdrop.style.transition = panel.style.transition.replace('transform', 'opacity')
        backdrop.style.opacity = dy > 0 ? String(Math.max(0, 1 - dy / panel.offsetHeight)) : ''
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (pointerId !== null) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const target = event.target as HTMLElement
      const content = contentRef.current
      const inContent = content?.contains(target) ?? false
      // dal contenuto si trascina solo se è già in cima, altrimenti scorre
      allowed = !inContent || !content || content.scrollTop <= 0
      if (!allowed) return
      // niente drag da campi di testo o bottoni
      if (target.closest('input, textarea, select, button, a, [role="radio"]')) return
      pointerId = event.pointerId
      startY = event.clientY
      startTime = event.timeStamp
      dragging = false
      lastDy = 0
      // l'animazione di apertura ha fill-mode both: va rimossa per applicare il transform
      panel.style.animation = 'none'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      const dy = event.clientY - startY
      if (!dragging) {
        if (dy > 8) {
          dragging = true
          panel.setPointerCapture(pointerId)
        } else if (dy < -8) {
          // verso l'alto: lascia scorrere il contenuto
          pointerId = null
          return
        } else {
          return
        }
      }
      lastDy = Math.max(0, dy)
      setOffset(lastDy, false)
      event.preventDefault()
    }

    const finish = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      const wasDragging = dragging
      pointerId = null
      dragging = false
      if (!wasDragging) return
      const elapsed = Math.max(1, event.timeStamp - startTime)
      const velocity = lastDy / elapsed
      if (lastDy > panel.offsetHeight * DRAG_CLOSE_FRACTION || velocity > DRAG_CLOSE_VELOCITY) {
        setOffset(panel.offsetHeight, true)
        setInstantClose(true)
        window.setTimeout(close, 180)
      } else {
        setOffset(0, true)
      }
    }

    // touch-action: pan-y sul contenuto lascia scorrere; il resto è "none"
    panel.addEventListener('pointerdown', onPointerDown)
    panel.addEventListener('pointermove', onPointerMove, { passive: false })
    panel.addEventListener('pointerup', finish)
    panel.addEventListener('pointercancel', finish)
    return () => {
      panel.removeEventListener('pointerdown', onPointerDown)
      panel.removeEventListener('pointermove', onPointerMove)
      panel.removeEventListener('pointerup', finish)
      panel.removeEventListener('pointercancel', finish)
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className="sheet-backdrop"
        data-closing={closing}
        onClick={onClose}
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="sheet-panel"
        data-closing={closing}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="sheet-grip" style={{ touchAction: 'none' }}>
          <div className="sheet-handle" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 px-5 pb-2">
            {title ? (
              <h2 id={titleId} className="font-display text-xl font-bold text-primary">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="-mr-2 flex size-11 items-center justify-center rounded-full text-secondary"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-2"
          style={{ touchAction: 'pan-y' }}
        >
          {children}
        </div>
        {footer && <div className="px-5 pt-3">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}
