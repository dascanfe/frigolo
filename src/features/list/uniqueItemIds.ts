/** Id dei prodotti senza ripetizioni, nell'ordine in cui compaiono (i più recenti per primi) */
export function uniqueItemIds(rows: readonly { item_id: string }[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const row of rows) {
    if (seen.has(row.item_id)) continue
    seen.add(row.item_id)
    ids.push(row.item_id)
  }
  return ids
}
