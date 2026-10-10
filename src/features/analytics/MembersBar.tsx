import { Avatar } from '@/components/Avatar'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { memberColor } from '@/lib/colors'
import { formatPercent } from '@/lib/format'
import type { MembersRow } from './useAnalytics'

interface MembersBarProps {
  rows: MembersRow[]
}

/** Chi ha aggiunto cosa: barra comparativa con i colori dei membri */
export function MembersBar({ rows }: MembersBarProps) {
  const { members } = useHousehold()
  const total = rows.reduce((sum, r) => sum + Number(r.added_count), 0)

  if (rows.length === 0 || total === 0) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nel periodo.</p>
  }

  // prima chi ha messo in lista di più
  const entries = rows
    .map((row) => {
      const member = members.find((m) => m.user_id === row.user_id)
      const count = Number(row.added_count)
      return {
        userId: row.user_id,
        name: memberName(member, row.display_name ?? 'Qualcuno'),
        color: row.color ?? member?.color ?? 'c-ink-soft',
        avatarUrl: member?.avatar_url ?? null,
        count,
        fraction: count / total,
      }
    })
    .sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface"
        aria-hidden="true"
      >
        {entries.map((entry) => (
          <span
            key={entry.userId}
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${entry.fraction * 100}%`, backgroundColor: memberColor(entry.color) }}
          />
        ))}
      </div>
      <ul className="flex justify-between gap-3">
        {entries.map((entry) => (
          <li key={entry.userId} className="flex items-center gap-2">
            <Avatar name={entry.name} color={entry.color} avatarUrl={entry.avatarUrl} size={32} />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-primary">{entry.name}</span>
              <span className="text-xs text-secondary">
                {entry.count} {entry.count === 1 ? 'articolo' : 'articoli'} (
                {formatPercent(entry.fraction)})
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
