/** Numero scritto nel campo (con virgola o punto), o null se non è una quantità valida */
export function parseQuantity(testo: string): number | null {
  const pulito = testo.trim().replace(',', '.')
  if (!/^\d*\.?\d*$/.test(pulito) || !/\d/.test(pulito)) return null
  const n = Number.parseFloat(pulito)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Come si mostra una quantità nel campo: virgola italiana per i decimali */
export function formatQuantity(value: number): string {
  return String(value).replace('.', ',')
}
