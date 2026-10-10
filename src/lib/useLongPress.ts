import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'
import { haptics } from './haptics'

interface UseLongPressOptions {
  /** Tap breve (o Invio/Spazio da tastiera) */
  onTap?: () => void
  /** Pressione prolungata: se manca, il long press non viene rilevato */
  onLongPress?: () => void
  /** Millisecondi prima di considerare la pressione "lunga" */
  delay?: number
  /** Spostamento in px oltre il quale la pressione è uno scroll, non un tap */
  moveTolerance?: number
  disabled?: boolean
}

/**
 * Distingue tap e long press con i Pointer Events, senza dipendenze.
 * Il tap viene emesso su "click" (non su pointerup) così funziona anche da
 * tastiera e il browser continua a gestire da solo lo scroll sui touch.
 */
export function useLongPress({
  onTap,
  onLongPress,
  delay = 500,
  moveTolerance = 10,
  disabled = false,
}: UseLongPressOptions) {
  const timer = useRef<number | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || !onLongPress) return
      // solo tasto principale del mouse; touch e penna passano sempre
      if (event.pointerType === 'mouse' && event.button !== 0) return
      origin.current = { x: event.clientX, y: event.clientY }
      longPressFired.current = false
      clearTimer()
      timer.current = window.setTimeout(() => {
        timer.current = null
        longPressFired.current = true
        haptics.hold()
        onLongPress()
      }, delay)
    },
    [disabled, onLongPress, delay, clearTimer],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!origin.current || timer.current === null) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      if (Math.hypot(dx, dy) > moveTolerance) {
        clearTimer()
        origin.current = null
      }
    },
    [moveTolerance, clearTimer],
  )

  const onPointerEnd = useCallback(() => {
    clearTimer()
    origin.current = null
  }, [clearTimer])

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (disabled) return
      // il click che segue un long press non è un tap
      if (longPressFired.current) {
        longPressFired.current = false
        event.preventDefault()
        return
      }
      onTap?.()
    },
    [disabled, onTap],
  )

  const onContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      // niente menu contestuale sul long press touch
      if (onLongPress) event.preventDefault()
    },
    [onLongPress],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onPointerLeave: onPointerEnd,
    onClick,
    onContextMenu,
  }
}
