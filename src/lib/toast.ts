/* Store minimale senza dipendenze: toast(...) da qualsiasi punto dell'app */

export type ToastKind = 'success' | 'info' | 'error'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  /** Mascotte al posto dell'icona, per i momenti di festa */
  mascot?: boolean
}

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts() {
  return toasts
}

export function toast(
  message: string,
  kind: ToastKind = 'info',
  durationMs = 2800,
  mascot = false,
) {
  const id = nextId++
  toasts = [...toasts, { id, kind, message, mascot }]
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, durationMs)
}
