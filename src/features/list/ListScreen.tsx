import { ChevronDown, History, LayoutGrid, SearchX, ShoppingBasket, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { LinkButton } from '@/components/Button'
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
import { ListSwitcherSheet } from '@/features/lists/ListSwitcherSheet'
import { triggerTip } from '@/features/tips/tips'
import { useSearch } from '@/features/search/useSearch'
import { usePurchaseHistoryQuery, useSuggestions } from '@/features/suggestions/useSuggestions'
import { it as t } from '@/i18n/it'
import { badgeQuantity, capitalizeFirst, pluralize } from '@/lib/format'
import type { Item, ListEntryWithItem } from '@/types/domain'
import { CompleteTripButton } from './CompleteTripButton'
import { EntrySheet } from './EntrySheet'
import type { EntrySheetTarget } from './EntrySheet'
import { useList } from './useList'
import { useListMutations } from './useToggleItem'

function tileState(entry: ListEntryWithItem | undefined): TileState {
  if (!entry) return 'idle'
  return entry.status === 'cart' ? 'done' : 'active'
}

const RECENT_LIMIT = 9

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
  const search = useSearch(query, catalog.items)
  const { suggestions } = useSuggestions()
  const history = usePurchaseHistoryQuery(household.id)
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

  /** Ultimi prodotti comprati (distinti), non già in lista: un tap per rimetterli */
  const recentItems = useMemo(() => {
    const seen = new Set<string>()
    const result: Item[] = []
    for (const purchase of history.data ?? []) {
      if (seen.has(purchase.item_id) || list.entryByItemId.has(purchase.item_id)) continue
      seen.add(purchase.item_id)
      const item = catalog.itemById.get(purchase.item_id)
      if (item) result.push(item)
      if (result.length >= RECENT_LIMIT) break
    }
    return result
  }, [history.data, list.entryByItemId, catalog.itemById])

  /** Suggeriti, senza ripetere quelli già in "Gli ultimi acquisti" */
  const visibleSuggestions = useMemo(() => {
    const recentIds = new Set(recentItems.map((item) => item.id))
    return suggestions.filter((suggestion) => !recentIds.has(suggestion.itemId))
  }, [suggestions, recentItems])

  const isEmpty = !list.isPending && list.entries.length === 0

  /** "Per cominciare": prodotti comuni da toccare, finché non c'è la prima spesa */
  const starterItems = useMemo(() => {
    if (!isEmpty || history.isPending || (history.data?.length ?? 0) > 0) return []
    return t.emptyList.starterNames
      .map((name) => catalog.items.find((item) => item.name === name && !item.is_archived))
      .filter((item): item is Item => Boolean(item))
  }, [isEmpty, history.isPending, history.data, catalog.items])

  // primo prodotto che non c'è nel catalogo: si spiega come crearlo
  const noResultsCanCreate =
    search.query.length > 0 && search.results.length === 0 && search.canCreate
  useEffect(() => {
    if (noResultsCanCreate) triggerTip('create')
  }, [noResultsCanCreate])
  const searching = search.query.length > 0

  /** Chiude la ricerca: campo vuoto, tastiera chiusa, torna la lista */
  function finishSearch() {
    setQuery('')
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  /** Tap su un risultato: aggiunge (o toglie se è già in lista) e torna alla lista */
  function toggleResult(item: Item) {
    const entry = list.entryByItemId.get(item.id)
    if (entry) mutations.remove(entry.id)
    else mutations.add(item)
    finishSearch()
  }

  /** Invio: aggiunge il primo risultato non ancora in lista, altrimenti crea */
  function submitSearch() {
    const first = search.results.find((item) => !list.entryByItemId.has(item.id))
    if (first) {
      mutations.add(first)
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
            <h1 className="truncate font-display text-4xl font-bold text-primary">
              {household.name}
            </h1>
            <ChevronDown
              size={26}
              strokeWidth={2.5}
              className="mt-1 shrink-0 text-secondary"
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
        <ul className="flex shrink-0 -space-x-2 pt-1" aria-label={t.lists.people}>
          {members.map((member) => (
            <li key={member.user_id}>
              <Avatar
                name={memberName(member)}
                color={member.color}
                avatarUrl={member.avatar_url}
                size={36}
                className="ring-app"
              />
            </li>
          ))}
        </ul>
      </header>

      <SearchBar
        value={query}
        onChange={(v) => setQuery(capitalizeFirst(v))}
        onSubmit={submitSearch}
      />

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
          <SectionHeader title={t.list.results} count={search.results.length} />
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
          <EmptyState
            icon={ShoppingBasket}
            title={t.emptyList.title}
            description={t.emptyList.subtitle}
            action={
              <LinkButton
                to="/catalogo"
                variant="secondary"
                icon={<LayoutGrid size={18} aria-hidden="true" />}
              >
                {t.emptyList.openCatalog}
              </LinkButton>
            }
          />
          {starterItems.length > 0 && (
            <div className="flex flex-col gap-2 pb-4">
              <p className="px-4 text-center text-xs font-bold text-secondary">
                {t.emptyList.starters}
              </p>
              <div
                className="flex flex-wrap justify-center gap-2 px-4"
                role="group"
                aria-label={t.emptyList.starters}
              >
                {starterItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="chip h-10 shrink-0 px-4"
                    onClick={() => mutations.add(item)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <SectionHeader title={t.list.toBuy} count={todo.length} />
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
                count={cart.length}
                collapsible={{
                  open: cartOpen,
                  onToggle: () => setCartOpen((o) => !o),
                  controls: 'cart-grid',
                }}
              />
              <p className="-mt-2 px-4 pb-3 text-sm text-secondary">{t.list.cartHint}</p>
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
        <section className="mt-8 border-t border-subtle pt-4">
          <SectionHeader
            title={t.list.recent}
            count={recentItems.length}
            action={<History size={20} className="text-secondary" aria-hidden="true" />}
          />
          <p className="-mt-2 px-4 pb-3 text-sm text-secondary">{t.list.recentHint}</p>
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

      {!searching && visibleSuggestions.length > 0 && (
        <section className="mt-8 border-t border-subtle pt-4">
          <SectionHeader title={t.list.suggested} count={visibleSuggestions.length} />
          <p className="-mt-2 px-4 pb-3 text-sm text-secondary">{t.list.suggestedHint}</p>
          <ProductGrid label={t.list.suggested}>
            {visibleSuggestions.map((suggestion) => (
              <ProductTile
                key={suggestion.itemId}
                name={suggestion.item.name}
                icon={suggestion.item.icon}
                state="idle"
                hint={suggestion.kind}
                onTap={() => mutations.add(suggestion.item)}
                onLongPress={() =>
                  setSheetTarget({
                    item: suggestion.item,
                    category: suggestion.category,
                    reason: suggestion.reason,
                  })
                }
              />
            ))}
          </ProductGrid>
        </section>
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
