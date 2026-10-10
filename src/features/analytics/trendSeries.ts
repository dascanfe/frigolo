import { formatMonth, formatShortDate } from '@/lib/format'
import type { Bucket, WeeklyRow } from './useAnalytics'

export interface Point {
  key: string
  label: string
  count: number
}

/** Giorno stesso, lunedì della settimana o primo del mese che contiene la data */
function startOfBucket(date: Date, bucket: Bucket): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (bucket === 'day') return d
  if (bucket === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  const weekday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - weekday)
  return d
}

function nextBucket(date: Date, bucket: Bucket): Date {
  const d = new Date(date)
  if (bucket === 'month') d.setMonth(d.getMonth() + 1)
  else if (bucket === 'day') d.setDate(d.getDate() + 1)
  else d.setDate(d.getDate() + 7)
  return d
}

function keyOf(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Serie continua: ogni settimana (o mese) del periodo, anche a zero */
export function buildSeries(
  rows: WeeklyRow[],
  bucket: Bucket,
  from: Date | null,
  now = new Date(),
): Point[] {
  const counts = new Map(rows.map((r) => [r.bucket_start, Number(r.purchase_count)]))
  const firstData = rows[0] ? new Date(rows[0].bucket_start) : null
  const startDate = from ?? firstData
  if (!startDate) return []
  let cursor = startOfBucket(startDate, bucket)
  const end = startOfBucket(now, bucket)
  const points: Point[] = []
  let guard = 0
  while (cursor.getTime() <= end.getTime() && guard < 400) {
    const key = keyOf(cursor)
    points.push({
      key,
      label: bucket === 'month' ? formatMonth(cursor) : formatShortDate(cursor),
      count: counts.get(key) ?? 0,
    })
    cursor = nextBucket(cursor, bucket)
    guard++
  }
  return points
}
