/**
 * Tipi di dominio derivati da database.ts (generato con `supabase gen types`).
 * Qui vivono solo alias e costanti: la logica sta nelle feature.
 */
import type { Database } from './database'

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
export type FunctionArgs<F extends keyof PublicSchema['Functions']> =
  PublicSchema['Functions'][F]['Args']
export type FunctionReturns<F extends keyof PublicSchema['Functions']> =
  PublicSchema['Functions'][F]['Returns']

export type Household = Tables<'households'>
export type HouseholdMember = Tables<'household_members'>
export type Category = Tables<'categories'>
export type Item = Tables<'items'>
export type ListEntry = Tables<'list_entries'>
export type ShoppingTrip = Tables<'shopping_trips'>
export type Purchase = Tables<'purchases'>

/** Stati di una riga della lista, come nel check constraint di list_entries.status */
export const LIST_ENTRY_STATUSES = ['todo', 'cart'] as const
export type ListEntryStatus = (typeof LIST_ENTRY_STATUSES)[number]

/** Riga della lista già unita al prodotto e alla categoria (join fatta nel client) */
export interface ListEntryWithItem extends ListEntry {
  item: Item
  category: Category
}

/** Unità di misura, come nel check constraint di items.default_unit */
export const UNITS = ['pz', 'kg', 'g', 'l', 'ml', 'conf'] as const
export type Unit = (typeof UNITS)[number]

export function isUnit(value: string | null | undefined): value is Unit {
  return (UNITS as readonly string[]).includes(value ?? '')
}

/** Passo dello stepper quantità per unità */
export const UNIT_STEPS: Record<Unit, number> = {
  pz: 1,
  kg: 0.5,
  g: 50,
  l: 0.5,
  ml: 100,
  conf: 1,
}

/** Slug delle 14 categorie del seed */
export const CATEGORY_SLUGS = [
  'frutta',
  'verdura',
  'pane-forno',
  'carne-pesce',
  'latticini-uova',
  'dispensa',
  'colazione',
  'snack-dolci',
  'bevande',
  'surgelati',
  'casa-pulizia',
  'igiene-cura',
  'animali',
  'altro',
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

/** Token colore della palette (senza il prefisso "--"), usati da categorie e membri */
export const COLOR_TOKENS = [
  'c-cream',
  'c-bg',
  'c-sand',
  'c-amber',
  'c-orange',
  'c-olive',
  'c-ochre',
  'c-burnt',
  'c-terracotta',
  'c-sage',
  'c-teal',
  'c-gold',
  'c-rust',
  'c-brown',
  'c-olive-deep',
  'c-sky',
  'c-gold-light',
  'c-peach',
  'c-blush',
  'c-brick',
  'c-steel',
  'c-ink',
  'c-ink-soft',
] as const
export type ColorToken = (typeof COLOR_TOKENS)[number]

/** Colori tra cui un membro sceglie il proprio (abbastanza scuri per l'inchiostro crema) */
export const MEMBER_COLOR_TOKENS = [
  'c-teal',
  'c-brick',
  'c-olive-deep',
  'c-rust',
  'c-brown',
  'c-terracotta',
  'c-burnt',
  'c-ochre',
] as const satisfies readonly ColorToken[]
export type MemberColorToken = (typeof MEMBER_COLOR_TOKENS)[number]

/**
 * Riga di analytics_item_totals con la nullabilità reale: avg_interval_days
 * è null quando c'è un solo acquisto (nessun intervallo da mediare). Il tipo
 * generato non lo sa perché le funzioni SQL non dichiarano la nullabilità.
 */
export type ItemTotals = Omit<
  FunctionReturns<'analytics_item_totals'>[number],
  'avg_interval_days'
> & {
  avg_interval_days: number | null
}

/** Supermercati selezionabili dal long press sulla tile */
export const STORES = [
  'Lidl',
  'Conad',
  'Cadoro',
  'Lando',
  'Prix',
  'Maxi',
  'Alì',
  'Aldi',
  'Carrefour',
  'Action',
  'Legàmi',
  'Normal',
  'Tigotà',
  'Acqua & Sapone',
  'Amazon',
] as const
export type Store = (typeof STORES)[number]
