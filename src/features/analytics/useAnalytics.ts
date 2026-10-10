import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'
import type { FunctionReturns, ItemTotals } from '@/types/domain'

export type Period = '15d' | '30d' | '3m' | '12m' | 'all'

export const PERIODS: { id: Period; label: string }[] = [
  { id: '15d', label: '15 giorni' },
  { id: '30d', label: '30 giorni' },
  { id: '3m', label: '3 mesi' },
  { id: '12m', label: '12 mesi' },
  { id: 'all', label: 'Sempre' },
]

export type Bucket = 'day' | 'week' | 'month'

/** Inizio del periodo (null = dall'inizio dei tempi) */
export function periodStart(period: Period, now = new Date()): Date | null {
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)
  switch (period) {
    case '15d':
      from.setDate(from.getDate() - 15)
      return from
    case '30d':
      from.setDate(from.getDate() - 30)
      return from
    case '3m':
      from.setMonth(from.getMonth() - 3)
      return from
    case '12m':
      from.setFullYear(from.getFullYear() - 1)
      return from
    case 'all':
      return null
  }
}

/** Giorni su 15 giorni, settimane sui periodi medi, mesi su quelli lunghi */
export function bucketFor(period: Period): Bucket {
  if (period === '15d') return 'day'
  return period === '30d' || period === '3m' ? 'week' : 'month'
}

export type SummaryRow = FunctionReturns<'analytics_summary'>[number]
export type CategoryTotalsRow = FunctionReturns<'analytics_category_totals'>[number]
export type WeeklyRow = FunctionReturns<'analytics_weekly'>[number]
export type MembersRow = FunctionReturns<'analytics_members'>[number]

interface AnalyticsArgs {
  period: Period
  categoryId: string | null
}

function baseArgs(householdId: string, { period, categoryId }: AnalyticsArgs) {
  const from = periodStart(period)
  return {
    p_household_id: householdId,
    p_from: from ? from.toISOString() : undefined,
    p_category_id: categoryId ?? undefined,
  }
}

const STALE = 60_000

/** True se l'household ha almeno un acquisto (per l'empty state) */
export function useHasHistory() {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'has-history'],
    staleTime: STALE,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', household.id)
      if (error) throw error
      return (count ?? 0) > 0
    },
  })
}

export function useAnalyticsSummary(args: AnalyticsArgs) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'summary', args.period, args.categoryId],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<SummaryRow> => {
      const { data, error } = await supabase.rpc('analytics_summary', baseArgs(household.id, args))
      if (error) throw error
      return data[0] ?? { total_items: 0, trips: 0, avg_items_per_trip: 0 }
    },
  })
}

export function useAnalyticsItems(args: AnalyticsArgs) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'items', args.period, args.categoryId],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ItemTotals[]> => {
      const { data, error } = await supabase.rpc(
        'analytics_item_totals',
        baseArgs(household.id, args),
      )
      if (error) throw error
      return data as ItemTotals[]
    },
  })
}

/** Le categorie non si filtrano per categoria: il donut mostra sempre l'insieme */
export function useAnalyticsCategories(period: Period) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'categories', period],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<CategoryTotalsRow[]> => {
      const from = periodStart(period)
      const { data, error } = await supabase.rpc('analytics_category_totals', {
        p_household_id: household.id,
        p_from: from ? from.toISOString() : undefined,
      })
      if (error) throw error
      return data
    },
  })
}

export function useAnalyticsWeekly(args: AnalyticsArgs) {
  const { household } = useHousehold()
  const bucket = bucketFor(args.period)
  return useQuery({
    queryKey: ['analytics', household.id, 'weekly', args.period, args.categoryId],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<WeeklyRow[]> => {
      const { data, error } = await supabase.rpc('analytics_weekly', {
        ...baseArgs(household.id, args),
        p_bucket: bucket,
      })
      if (error) throw error
      return data
    },
  })
}

export function useAnalyticsMembers(args: AnalyticsArgs) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'members', args.period, args.categoryId],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<MembersRow[]> => {
      const { data, error } = await supabase.rpc('analytics_members', baseArgs(household.id, args))
      if (error) throw error
      return data
    },
  })
}

export interface TripRow {
  id: string
  store: string | null
  started_at: string
  completed_at: string | null
  /** null = salvata dal job notturno, non da "Spesa finita" */
  completed_by: string | null
  purchases: {
    id: string
    quantity: number
    unit: string | null
    items: { name: string; icon: string } | null
  }[]
}

/** Le spese del periodo con i prodotti, per la card "Le spese" */
export function useAnalyticsTrips(args: AnalyticsArgs, limit = 30) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: ['analytics', household.id, 'trips', args.period, args.categoryId, limit],
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<TripRow[]> => {
      const from = periodStart(args.period)
      let query = supabase
        .from('shopping_trips')
        .select(
          'id, store, started_at, completed_at, completed_by, purchases(id, quantity, unit, category_id, items(name, icon))',
        )
        .eq('household_id', household.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit)
      if (from) query = query.gte('completed_at', from.toISOString())
      const { data, error } = await query
      if (error) throw error
      return data
        .map((trip) => ({
          ...trip,
          purchases: trip.purchases.filter(
            (p) => !args.categoryId || p.category_id === args.categoryId,
          ),
        }))
        .filter((trip) => trip.purchases.length > 0)
    },
  })
}
