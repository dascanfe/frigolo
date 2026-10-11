import { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import { categoryColorVar, categoryIconBgVar } from '@/lib/colors'
import { formatPercent } from '@/lib/format'
import type { CategoryTotalsRow } from './useAnalytics'

interface CategoryDonutProps {
  rows: CategoryTotalsRow[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

/** Oltre questo numero di fette la coda finisce in "Altre" */
const MAX_SLICES = 8
const OTHER_ID = '__other__'

/* Geometria del grafico (unità del viewBox, scala con la larghezza) */
const W = 400
const H = 280
const CX = W / 2
const CY = H / 2
const R = 64
const R_INNER = 41
const ELBOW = R + 14
const LABEL_X = R + 24
const LABEL_GAP = 28
const NAME_MAX = 17

interface Slice {
  id: string
  name: string
  slug: string | null
  icon: string | null
  value: number
  fraction: number
}

interface Placed extends Slice {
  path: string
  midAngle: number
  side: 1 | -1
  anchor: { x: number; y: number }
  elbow: { x: number; y: number }
  labelY: number
}

function buildSlices(rows: CategoryTotalsRow[]): Slice[] {
  const total = rows.reduce((sum, r) => sum + Number(r.purchase_count), 0)
  if (total === 0) return []
  const sorted = [...rows].sort((a, b) => Number(b.purchase_count) - Number(a.purchase_count))
  const head = sorted.slice(0, sorted.length > MAX_SLICES ? MAX_SLICES - 1 : MAX_SLICES)
  const tail = sorted.slice(head.length)
  const slices: Slice[] = head.map((r) => ({
    id: r.category_id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    value: Number(r.purchase_count),
    fraction: Number(r.purchase_count) / total,
  }))
  if (tail.length > 0) {
    const value = tail.reduce((sum, r) => sum + Number(r.purchase_count), 0)
    slices.push({
      id: OTHER_ID,
      name: 'Altre',
      slug: null,
      icon: null,
      value,
      fraction: value / total,
    })
  }
  return slices
}

function polar(radius: number, angle: number) {
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) }
}

/** Settore di corona circolare tra due angoli (radianti, senso orario da ore 12) */
function arcPath(a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const o0 = polar(R, a0)
  const o1 = polar(R, a1)
  const i0 = polar(R_INNER, a0)
  const i1 = polar(R_INNER, a1)
  return `M ${o0.x} ${o0.y} A ${R} ${R} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${i0.x} ${i0.y} Z`
}

/** Calcola fette, punti di ancoraggio e posizione delle etichette senza sovrapposizioni */
function layout(slices: Slice[]): Placed[] {
  let angle = -Math.PI / 2
  const placed: Placed[] = slices.map((slice) => {
    const sweep = slice.fraction * Math.PI * 2
    const a0 = angle
    const a1 = angle + sweep
    angle = a1
    const mid = (a0 + a1) / 2
    const side: 1 | -1 = Math.cos(mid) >= 0 ? 1 : -1
    const elbow = polar(ELBOW, mid)
    return {
      ...slice,
      path: arcPath(a0, a1),
      midAngle: mid,
      side,
      anchor: polar(R + 1, mid),
      elbow,
      labelY: elbow.y,
    }
  })
  // etichette dello stesso lato: ordinate per altezza e distanziate di LABEL_GAP
  for (const side of [1, -1] as const) {
    const group = placed.filter((p) => p.side === side).sort((a, b) => a.elbow.y - b.elbow.y)
    let cursor = 16
    for (const item of group) {
      item.labelY = Math.max(item.elbow.y, cursor)
      cursor = item.labelY + LABEL_GAP
    }
    // se sfora in basso, risale tutto il gruppo
    const overflow = cursor - LABEL_GAP - (H - 16)
    if (overflow > 0) {
      for (const item of group) item.labelY -= overflow
    }
  }
  return placed
}

function sliceColor(slice: Slice): string {
  return slice.slug ? categoryColorVar(slice.slug) : 'var(--c-sand)'
}

function shortName(name: string): string {
  return name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1).trimEnd()}…` : name
}

/**
 * Donut per categoria disegnato in SVG: ogni fetta ha una linea che porta a
 * icona (bianca sul colore della categoria), nome e percentuale. Tap su fetta
 * o etichetta filtra il resto della pagina.
 */
export function CategoryDonut({ rows, selectedCategoryId, onSelect }: CategoryDonutProps) {
  const placed = useMemo(() => layout(buildSlices(rows)), [rows])
  const total = placed.reduce((sum, s) => sum + s.value, 0)

  if (placed.length === 0) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nel periodo.</p>
  }

  function toggle(slice: Slice) {
    if (slice.id === OTHER_ID) return
    onSelect(selectedCategoryId === slice.id ? null : slice.id)
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="-mx-3 h-auto w-[calc(100%+1.5rem)]"
      role="img"
      aria-label={`Distribuzione per categoria: ${placed.map((s) => `${s.name} ${formatPercent(s.fraction)}`).join(', ')}`}
    >
      {placed.map((slice) => {
        const dimmed = selectedCategoryId !== null && selectedCategoryId !== slice.id
        const selected = selectedCategoryId === slice.id
        const color = sliceColor(slice)
        const labelX = CX + slice.side * LABEL_X
        const textAnchor = slice.side === 1 ? 'start' : 'end'
        const iconX = labelX + slice.side * 9
        const textX = labelX + slice.side * 22
        const interactive = slice.id !== OTHER_ID
        return (
          <g
            key={slice.id}
            opacity={dimmed ? 0.35 : 1}
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'opacity 150ms' }}
            onClick={() => toggle(slice)}
            role={interactive ? 'button' : undefined}
            aria-pressed={interactive ? selected : undefined}
            aria-label={`${slice.name}, ${formatPercent(slice.fraction)}`}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={(e) => {
              if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                toggle(slice)
              }
            }}
          >
            <path d={slice.path} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
            <polyline
              points={`${slice.anchor.x},${slice.anchor.y} ${slice.elbow.x},${slice.labelY} ${labelX - slice.side * 2},${slice.labelY}`}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <circle
              cx={iconX}
              cy={slice.labelY}
              r={9}
              fill={slice.slug ? categoryIconBgVar(slice.slug) : color}
            />
            {slice.icon && (
              <svg
                x={iconX - 5.5}
                y={slice.labelY - 5.5}
                width={11}
                height={11}
                viewBox="0 0 24 24"
              >
                <Icon
                  name={slice.icon}
                  size={24}
                  strokeWidth={2.5}
                  color="white"
                  aria-hidden="true"
                />
              </svg>
            )}
            <text
              x={textX}
              y={slice.labelY - 6}
              dominantBaseline="central"
              textAnchor={textAnchor}
              fontFamily="var(--font-body)"
              fontSize={11}
              fontWeight={700}
              fill="var(--text-primary)"
            >
              {shortName(slice.name)}
            </text>
            <text
              x={textX}
              y={slice.labelY + 7}
              dominantBaseline="central"
              textAnchor={textAnchor}
              fontFamily="var(--font-body)"
              fontSize={10}
              fontWeight={900}
              fill="var(--text-secondary)"
            >
              {formatPercent(slice.fraction)}
            </text>
          </g>
        )
      })}
      <text
        x={CX}
        y={CY - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-body)"
        fontSize={26}
        fontWeight={900}
        fill="var(--text-primary)"
      >
        {total}
      </text>
      <text
        x={CX}
        y={CY + 15}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-body)"
        fontSize={9}
        fontWeight={700}
        letterSpacing={1}
        fill="var(--text-secondary)"
      >
        PRODOTTI
      </text>
    </svg>
  )
}
