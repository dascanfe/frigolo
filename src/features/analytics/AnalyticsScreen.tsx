import {
  ChartColumn,
  ChartPie,
  LayoutGrid,
  ListChecks,
  Package,
  Receipt,
  Repeat,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { LinkButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { useCatalog } from '@/features/catalog/useCatalog'
import { CategoryDonut } from './CategoryDonut'
import { MembersBar } from './MembersBar'
import { PurchaseFrequencyTable } from './PurchaseFrequencyTable'
import { TopItemsChart } from './TopItemsChart'
import { TrendChart } from './TrendChart'
import { TripsList } from './TripsList'
import {
  PERIODS,
  bucketFor,
  periodStart,
  useAnalyticsCategories,
  useAnalyticsItems,
  useAnalyticsMembers,
  useAnalyticsSummary,
  useAnalyticsTrips,
  useAnalyticsWeekly,
  useHasHistory,
} from './useAnalytics'
import type { Period } from './useAnalytics'

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('15d')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [now] = useState(() => new Date())
  const catalog = useCatalog()
  const hasHistory = useHasHistory()

  const args = { period, categoryId }
  const summary = useAnalyticsSummary(args)
  const items = useAnalyticsItems(args)
  const categories = useAnalyticsCategories(period)
  const weekly = useAnalyticsWeekly(args)
  const members = useAnalyticsMembers(args)
  // le spese non seguono il periodo: sono divise per mese, tutto lo storico
  const trips = useAnalyticsTrips({ period: 'all', categoryId }, 400)

  const selectedCategory = categoryId ? catalog.categoryById.get(categoryId) : undefined
  const fetching = summary.isFetching || items.isFetching || weekly.isFetching

  return (
    <main className="flex flex-col gap-3 pb-6">
      <header className="px-4 pt-6 pb-1">
        <h1 className="font-display text-4xl font-bold text-primary">Analitiche</h1>
        <p className="text-sm text-secondary">
          Cosa si compra, quanto spesso e chi lo mette in lista.
        </p>
      </header>

      {hasHistory.data === false ? (
        <EmptyHistory />
      ) : (
        <>
          {/* Filtri: una sola riga sopra tutti i grafici */}
          <div
            className="sticky top-0 z-10 flex flex-col gap-2 px-4 py-2"
            style={{ top: 'var(--safe-top)' }}
          >
            <div
              className="glass grid grid-cols-5 gap-1 rounded-full p-1"
              role="tablist"
              aria-label="Periodo"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={[
                    'h-10 rounded-full text-[12px] font-bold transition-colors',
                    period === p.id ? 'bg-primary text-cream shadow-tile' : 'text-secondary',
                  ].join(' ')}
                >
                  {p.label.replace(' giorni', 'gg').replace(' mesi', 'm')}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className="chip h-10 self-start pl-3"
                aria-label={`Rimuovi il filtro ${selectedCategory.name}`}
              >
                <Icon name={selectedCategory.icon} size={14} aria-hidden="true" />
                Solo {selectedCategory.name}
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            className={[
              'flex flex-col gap-3 transition-opacity',
              fetching ? 'opacity-70' : '',
            ].join(' ')}
          >
            <dl className="grid grid-cols-3 gap-2 px-4">
              <Kpi
                icon={Package}
                label="Prodotti"
                value={summary.data ? Number(summary.data.total_items) : null}
              />
              <Kpi
                icon={ShoppingBasket}
                label="Spese"
                value={summary.data ? Number(summary.data.trips) : null}
              />
              <Kpi
                icon={ListChecks}
                label="Media a spesa"
                value={summary.data ? Number(summary.data.avg_items_per_trip ?? 0) : null}
                decimals={1}
              />
            </dl>

            <Card icon={ChartColumn} title="I più acquistati">
              <TopItemsChart items={items.data ?? []} />
            </Card>

            <Card icon={Receipt} title="Le spese" hint="Mese per mese, spesa per spesa">
              <TripsList trips={trips.data ?? []} now={now} />
            </Card>

            <Card icon={ChartPie} title="Per categoria" hint="Tocca una fetta per filtrare tutto">
              <CategoryDonut
                rows={categories.data ?? []}
                selectedCategoryId={categoryId}
                onSelect={setCategoryId}
              />
            </Card>

            <Card icon={TrendingUp} title="Andamento">
              <TrendChart
                rows={weekly.data ?? []}
                bucket={bucketFor(period)}
                from={periodStart(period)}
              />
            </Card>

            <Card icon={Users} title="Chi mette in lista">
              <MembersBar rows={members.data ?? []} />
            </Card>

            <Card
              icon={Repeat}
              title="Frequenza di acquisto"
              hint="Cosa è stato comprato nell'ultimo mese, e quante volte"
            >
              <PurchaseFrequencyTable now={now} categoryId={categoryId} />
            </Card>
          </div>
        </>
      )}
    </main>
  )
}

function Card({
  icon: CardIcon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="mx-4 rounded-3xl bg-surface p-4 shadow-[0_2px_14px_rgb(58_44_33/0.06)] ring-1 ring-subtle">
      <header className="mb-3 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <CardIcon size={17} strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="flex flex-col leading-tight">
          <h2 className="font-display text-lg font-bold text-primary">{title}</h2>
          {hint && <span className="text-xs text-secondary">{hint}</span>}
        </div>
      </header>
      {children}
    </section>
  )
}

function Kpi({
  icon: KpiIcon,
  label,
  value,
  decimals = 0,
}: {
  icon: LucideIcon
  label: string
  value: number | null
  decimals?: number
}) {
  const text =
    value === null
      ? '...'
      : new Intl.NumberFormat('it-IT', {
          maximumFractionDigits: decimals,
          minimumFractionDigits: 0,
        }).format(value)
  return (
    <div className="flex flex-col items-start gap-1 rounded-3xl bg-surface p-3 shadow-[0_2px_14px_rgb(58_44_33/0.06)] ring-1 ring-subtle">
      <KpiIcon size={16} className="text-accent" aria-hidden="true" />
      <dd className="font-body text-[26px] font-black leading-none tabular-nums text-primary">
        {text}
      </dd>
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">{label}</dt>
    </div>
  )
}

/** Empty state: nessuna spesa completata, con la mascotte */
function EmptyHistory() {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
      <div className="relative" aria-hidden="true">
        <img
          src="/mascot.png"
          alt=""
          width={140}
          height={140}
          className="size-36"
          draggable={false}
        />
        <span className="absolute -right-2 -bottom-1 flex size-10 items-center justify-center rounded-2xl bg-accent text-cream shadow-tile">
          <Sparkles size={20} strokeWidth={2} />
        </span>
      </div>
      <h2 className="font-display text-2xl font-bold text-primary">Ancora nessuna spesa</h2>
      <p className="max-w-xs text-sm text-secondary">
        Quando tocchi "Spesa finita" qui vedi cosa compri di più, le categorie e ogni quanto
        ricompri le cose.
      </p>
      <LinkButton
        to="/catalogo"
        variant="secondary"
        icon={<LayoutGrid size={18} aria-hidden="true" />}
      >
        Vai al catalogo
      </LinkButton>
    </div>
  )
}
