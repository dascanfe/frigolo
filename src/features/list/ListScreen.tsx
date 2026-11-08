import {
  ChevronDown,
  ChevronRight,
  History,
  LayoutGrid,
  Pointer,
  SearchX,
  Settings,
  Store,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { AddTile, ProductTile } from '@/components/ProductTile'
import type { TileState } from '@/components/ProductTile'
import { ProductGrid } from '@/components/ProductGrid'
import { SearchBar } from '@/components/SearchBar'
import { SectionHeader } from '@/components/SectionHeader'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { CreateItemSheet } from '@/features/catalog/CreateItemSheet'
import type { CreateItemRequest } from '@/features/catalog/CreateItemSheet'
import { useCatalog } from '@/features/catalog/useCatalog'
import { InstallCard } from '@/features/install/InstallCard'
import { ListSwitcherSheet } from '@/features/lists/ListSwitcherSheet'
import { armShareNudge } from '@/features/tips/shareNudge'
import { dismissTip, triggerTip } from '@/features/tips/tips'
import { currentMonth } from '@/features/catalog/seasonal'
import { MESI } from '@/features/inspiration/mesi'
import { useSearch } from '@/features/search/useSearch'
import { recordEvent } from '@/lib/telemetry'
import { usePurchaseHistoryQuery } from '@/features/suggestions/useSuggestions'
import { it as t } from '@/i18n/it'
import { badgeQuantity, capitalizeFirst, pluralize } from '@/lib/format'
import { toast } from '@/lib/toast'
import type { Item, ListEntryWithItem } from '@/types/domain'
import { CompleteTripButton } from './CompleteTripButton'
import { EntrySheet } from './EntrySheet'
import type { EntrySheetTarget } from './EntrySheet'
import { ShareNudge } from './ShareNudge'
import { useList } from './useList'
import { useRecentTripItems } from './useRecentTripItems'
import { useListMutations } from './useToggleItem'

function tileState(entry: ListEntryWithItem | undefined): TileState {
  if (!entry) return 'idle'
  return entry.status === 'cart' ? 'done' : 'active'
}

/** Avatar mostrati in testata: oltre questi, un tondo "+N" */
const MAX_AVATARS = 5

export function ListScreen() {
  const { household, members, lists } = useHousehold()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const catalog = useCatalog()
  const list = useList()
  const mutations = useListMutations()
  const [cartOpen, setCartOpen] = useState(true)
  const [sheetTarget, setSheetTarget] = useState<EntrySheetTarget | null>(null)
  const [query, setQuery] = useState('')
  const [createRequest, setCreateRequest] = useState<CreateItemRequest | null>(null)
  const history = usePurchaseHistoryQuery(household.id)
  const recentTrips = useRecentTripItems(household.id)
  const purchaseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const purchase of history.data ?? [])
      counts.set(purchase.item_id, (counts.get(purchase.item_id) ?? 0) + 1)
    return counts
  }, [history.data])
  const search = useSearch(query, catalog.items, purchaseCounts)
  const [storeFilter, setStoreFilter] = useState<string | null>(null)

  /** Supermercati presenti tra i prodotti in lista, per i filtri */
  const storesInList = useMemo(() => {
    const set = new Set<string>()
    for (const entry of list.entries) if (entry.store) set.add(entry.store)
    return [...set].sort((a, b) => a.localeCompare(b, 'it'))
  }, [list.entries])
  const activeStore = storeFilter && storesInList.includes(storeFilter) ? storeFilter : null

  // filtro per supermercato: quelli di quel supermercato più quelli "Ovunque"
  // (senza supermercato), che si possono prendere anche lì. Il carrello resta
  // intero: è quello che hai già preso, ovunque sia.
  const todo = activeStore
    ? list.todo.filter((e) => e.store === activeStore || e.store === null)
    : list.todo
  const cart = list.cart

  /** Prodotti delle ultime 3 spese chiuse, non già in lista: un tocco per rimetterli */
  const recentItems = useMemo(() => {
    const result: Item[] = []
    for (const itemId of recentTrips.data ?? []) {
      if (list.entryByItemId.has(itemId)) continue
      const item = catalog.itemById.get(itemId)
      if (item && !item.is_archived) result.push(item)
    }
    return result
  }, [recentTrips.data, list.entryByItemId, catalog.itemById])

  const isEmpty = !list.isPending && list.entries.length === 0

  /** "Per cominciare": prodotti comuni da toccare, finché non c'è la prima spesa */
  const starterItems = useMemo(() => {
    if (!isEmpty || history.isPending || (history.data?.length ?? 0) > 0) return []
    return t.emptyList.starterNames
      .map((name) => catalog.items.find((item) => item.name === name && !item.is_archived))
      .filter((item): item is Item => Boolean(item))
  }, [isEmpty, history.isPending, history.data, catalog.items])

  /** Chi parte da zero: lista vuota e nessuna spesa fatta */
  const firstUse = isEmpty && !history.isPending && (history.data?.length ?? 0) === 0

  /**
   * Aggiunge un prodotto. Il primissimo di chi parte da zero si festeggia con
   * la mascotte (al posto del suggerimento "Fatto, è in lista") e prepara
   * l'invito a condividere, che comparirà una volta sola nella lista.
   */
  function addItem(item: Item) {
    if (firstUse) {
      dismissTip('added')
      toast(t.emptyList.firstAdded, 'success', 4200, true)
      armShareNudge()
    }
    mutations.add(item)
  }

  // primo prodotto che non c'è nel catalogo: si spiega come crearlo
  const noResultsCanCreate =
    search.query.length > 0 && search.results.length === 0 && search.canCreate
  useEffect(() => {
    if (noResultsCanCreate) triggerTip('create')
  }, [noResultsCanCreate])
  const searching = search.query.length > 0

  // metriche anonime: una ricerca rimasta senza risultati per 1,5 secondi
  // conta una volta, finché il campo non si svuota. Mai il testo cercato.
  const searchEmpty = searching && search.results.length === 0
  const emptyCounted = useRef(false)
  useEffect(() => {
    if (!searching) {
      emptyCounted.current = false
      return
    }
    if (!searchEmpty || emptyCounted.current) return
    const timer = setTimeout(() => {
      emptyCounted.current = true
      recordEvent('ricerca_vuota', true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [searching, searchEmpty, search.query])

  /** Chiude la ricerca: campo vuoto, tastiera chiusa, torna la lista */
  function finishSearch() {
    setQuery('')
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  /** Tap su un risultato: aggiunge (o toglie se è già in lista) e torna alla lista */
  function toggleResult(item: Item) {
    const entry = list.entryByItemId.get(item.id)
    if (entry) mutations.remove(entry.id)
    else addItem(item)
    finishSearch()
  }

  /** Invio: aggiunge il primo risultato non ancora in lista, altrimenti crea */
  function submitSearch() {
    const first = search.results.find((item) => !list.entryByItemId.has(item.id))
    if (first) {
      addItem(first)
      finishSearch()
    } else if (search.canCreate) {
      setCreateRequest({ name: query })
    }
  }

  return (
    <main className="flex flex-col pb-24">
      <header className="flex items-start justify-between gap-3 px-4 pt-6 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="-ml-1 flex min-w-0 items-center gap-1 rounded-2xl px-1 text-left active:bg-sand/40"
            aria-haspopup="dialog"
            aria-label={`${t.lists.switch}. Lista aperta: ${household.name}`}
          >
            <h1 className="truncate font-display text-3xl font-bold text-primary sm:text-4xl">
              {household.name}
            </h1>
            <ChevronDown
              size={24}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-secondary"
              aria-hidden="true"
            />
          </button>
          <p className="text-sm text-secondary">
            {list.isPending
              ? t.list.loading
              : list.todoCount === 0
                ? t.list.nothingToBuy
                : pluralize(list.todoCount, 'prodotto da comprare', 'prodotti da comprare')}
            {lists.length > 1 && ` · ${pluralize(lists.length, 'lista', 'liste')}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/analitiche"
            aria-label={t.nav.openAnalytics(household.name)}
            title={t.nav.analytics}
            className="flex min-h-11 items-center rounded-full px-1 active:bg-sand/40"
          >
            <span className="flex -space-x-2.5" aria-hidden="true">
              {members.slice(0, MAX_AVATARS).map((member) => (
                <Avatar
                  key={member.user_id}
                  name={memberName(member)}
                  color={member.color}
                  avatarUrl={member.avatar_url}
                  size={30}
                  className="ring-app"
                />
              ))}
              {members.length > MAX_AVATARS && (
                <span className="ring-app relative z-0 inline-flex size-[30px] items-center justify-center rounded-full bg-surface text-xs font-black text-secondary ring-2">
                  +{members.length - MAX_AVATARS}
                </span>
              )}
            </span>
          </Link>
          <Link
            to="/impostazioni"
            aria-label={t.nav.settings}
            title={t.nav.settings}
            className="group flex size-11 items-center justify-center"
          >
            <span className="glass flex size-9 items-center justify-center rounded-full text-secondary transition-transform group-active:scale-95">
              <Settings size={18} strokeWidth={2.25} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </header>

      <SearchBar
        value={query}
        onChange={(v) => setQuery(capitalizeFirst(v))}
        onSubmit={submitSearch}
      />

      {!searching && !isEmpty && <ShareNudge />}
      {!searching && !isEmpty && <InstallCard />}

      {!searching && storesInList.length > 0 && (
        <div className="chip-row px-4 py-1" role="group" aria-label={t.list.filterByStore}>
          <button
            type="button"
            className="chip h-10 shrink-0 px-4"
            aria-pressed={activeStore === null}
            onClick={() => setStoreFilter(null)}
          >
            {t.list.all}
          </button>
          {storesInList.map((name) => (
            <button
              key={name}
              type="button"
              className="chip h-10 shrink-0 gap-1.5 pl-3"
              aria-pressed={activeStore === name}
              onClick={() => setStoreFilter(activeStore === name ? null : name)}
            >
              <Store size={15} aria-hidden="true" />
              {name}
            </button>
          ))}
        </div>
      )}

      {list.error && (
        <p
          className="mx-4 rounded-2xl bg-rust/10 px-4 py-3 text-sm font-bold text-rust"
          role="alert"
        >
          {list.error.message}
        </p>
      )}

      {searching ? (
        <>
          <SectionHeader lead="block" title={t.list.results} count={search.results.length} />
          {search.results.length === 0 && !search.canCreate ? (
            <EmptyState
              icon={SearchX}
              title={t.list.noResults}
              description={t.list.noResultsHint}
            />
          ) : (
            <ProductGrid label={t.list.resultsLabel}>
              {search.canCreate && search.results.length === 0 && (
                <AddTile
                  label={t.list.create(query.trim())}
                  onTap={() => setCreateRequest({ name: query })}
                />
              )}
              {search.results.map((item) => {
                const entry = list.entryByItemId.get(item.id)
                const category = catalog.categoryById.get(item.category_id)
                return (
                  <ProductTile
                    key={item.id}
                    name={item.name}
                    icon={item.icon}
                    state={tileState(entry)}
                    quantity={
                      entry
                        ? badgeQuantity(entry.quantity, entry.unit, entry.item.default_unit)
                        : undefined
                    }
                    unit={entry?.unit}
                    onTap={() => toggleResult(item)}
                    onLongPress={
                      category ? () => setSheetTarget({ item, category, entry }) : undefined
                    }
                  />
                )
              })}
              {/* con dei risultati, "Crea" va in fondo: è facile toccarlo per sbaglio
                  e creare un doppione con un errore di battitura */}
              {search.canCreate && search.results.length > 0 && (
                <AddTile
                  label={t.list.create(query.trim())}
                  onTap={() => setCreateRequest({ name: query })}
                />
              )}
            </ProductGrid>
          )}
        </>
      ) : isEmpty ? (
        <>
          <div className="px-4 pt-6 pb-4 text-center">
            <h2 className="font-display text-2xl font-bold text-primary">{t.emptyList.title}</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-secondary">{t.emptyList.subtitle}</p>
          </div>
          {starterItems.length > 0 && (
            <>
              <p className="flex items-center justify-center gap-1.5 pb-3 text-sm font-bold text-accent">
                <Pointer size={16} strokeWidth={2.25} aria-hidden="true" />
                {t.emptyList.starters}
              </p>
              <ProductGrid label={t.emptyList.starters}>
                {starterItems.map((item, index) => (
                  <div key={item.id} className={index < 3 ? 'starter-nudge' : undefined}>
                    <ProductTile
                      name={item.name}
                      icon={item.icon}
                      state="idle"
                      onTap={() => addItem(item)}
                    />
                  </div>
                ))}
              </ProductGrid>
            </>
          )}
          <Link
            to="/catalogo"
            className="mx-auto mt-5 flex h-11 items-center px-4 text-sm font-bold text-secondary underline underline-offset-4"
          >
            {t.emptyList.openCatalog}
          </Link>
          <InstallCard />
        </>
      ) : (
        <>
          <SectionHeader
            lead="block"
            title={t.list.toBuy}
            count={todo.length}
            action={
              <Link
                to="/catalogo"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-accent active:bg-sand/40"
              >
                <LayoutGrid size={16} strokeWidth={2.25} aria-hidden="true" />
                {t.nav.openCatalog}
              </Link>
            }
          />
          {todo.length === 0 ? (
            <p className="px-4 pb-2 text-sm text-secondary">
              {activeStore ? t.list.nothingElseAt(activeStore) : t.list.allTaken}
            </p>
          ) : (
            <ProductGrid label={t.list.toBuy}>
              {todo.map((entry) => (
                <ProductTile
                  key={entry.id}
                  name={entry.item.name}
                  icon={entry.item.icon}
                  state="active"
                  quantity={badgeQuantity(entry.quantity, entry.unit, entry.item.default_unit)}
                  unit={entry.unit}
                  store={entry.store}
                  note={entry.note}
                  onTap={() => mutations.setStatus(entry.id, 'cart')}
                  onLongPress={() =>
                    setSheetTarget({ item: entry.item, category: entry.category, entry })
                  }
                />
              ))}
            </ProductGrid>
          )}

          {cart.length > 0 && (
            <>
              <SectionHeader
                title={t.list.cart}
                description={t.list.cartHint}
                count={cart.length}
                collapsible={{
                  open: cartOpen,
                  onToggle: () => setCartOpen((o) => !o),
                  controls: 'cart-grid',
                }}
              />
              {cartOpen && (
                <div id="cart-grid">
                  <ProductGrid label={t.list.cart}>
                    {cart.map((entry) => (
                      <ProductTile
                        key={entry.id}
                        name={entry.item.name}
                        icon={entry.item.icon}
                        state="done"
                        store={entry.store}
                        onTap={() => mutations.setStatus(entry.id, 'todo')}
                        onLongPress={() =>
                          setSheetTarget({ item: entry.item, category: entry.category, entry })
                        }
                      />
                    ))}
                  </ProductGrid>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!searching && recentItems.length > 0 && (
        <section className="mt-section border-t border-subtle">
          <SectionHeader
            lead="block"
            title={t.list.recent}
            description={t.list.recentHint}
            count={recentItems.length}
            action={<History size={20} className="text-secondary" aria-hidden="true" />}
          />
          <ProductGrid label={t.list.recent}>
            {recentItems.map((item) => {
              const category = catalog.categoryById.get(item.category_id)
              return (
                <ProductTile
                  key={item.id}
                  name={item.name}
                  icon={item.icon}
                  state="idle"
                  onTap={() => mutations.add(item)}
                  onLongPress={category ? () => setSheetTarget({ item, category }) : undefined}
                />
              )
            })}
          </ProductGrid>
        </section>
      )}

      {!searching && (
        <Link
          to="/ispirazioni"
          className="inspiration-card mx-4 mt-section flex min-h-[104px] items-center gap-3 overflow-hidden rounded-3xl py-3 pr-3 pl-5 text-left ring-1 ring-subtle"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-display text-xl leading-tight font-bold text-primary">
              {t.inspiration.ctaTitle}
            </span>
            <span className="text-sm leading-snug text-secondary">
              {t.inspiration.ctaSubtitle(MESI[currentMonth() - 1]?.nome.toLowerCase() ?? '')}
            </span>
          </span>
          <img
            src="/mascot-happy.webp"
            alt=""
            width={72}
            height={72}
            className="size-[72px] shrink-0 object-contain"
            draggable={false}
          />
          <ChevronRight
            size={22}
            strokeWidth={2.5}
            className="shrink-0 text-accent"
            aria-hidden="true"
          />
        </Link>
      )}

      <EntrySheet target={sheetTarget} onClose={() => setSheetTarget(null)} />
      <CreateItemSheet
        request={createRequest}
        onClose={() => {
          setCreateRequest(null)
          setQuery('')
        }}
      />
      <CompleteTripButton
        cart={list.cart}
        todoCount={list.todoCount}
        suggestedStore={activeStore}
      />
      <ListSwitcherSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </main>
  )
}
