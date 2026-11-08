import { useStuck } from '@/lib/useStuck'
import { useMemo, useRef, useState } from 'react'
import { CategoryChips } from '@/components/CategoryChips'
import { PageHeader, STICKY_TOP } from '@/components/PageHeader'
import { AddTile, ProductTile } from '@/components/ProductTile'
import type { TileState } from '@/components/ProductTile'
import { CategoryDivider, ProductGrid } from '@/components/ProductGrid'
import { EntrySheet } from '@/features/list/EntrySheet'
import type { EntrySheetTarget } from '@/features/list/EntrySheet'
import { useList } from '@/features/list/useList'
import { useListMutations } from '@/features/list/useToggleItem'
import type { Item, ListEntryWithItem } from '@/types/domain'
import { it as t } from '@/i18n/it'
import { badgeQuantity } from '@/lib/format'
import { CreateItemSheet } from './CreateItemSheet'
import type { CreateItemRequest } from './CreateItemSheet'
import { currentMonth, SEASONAL_CATALOG_SLUGS, seasonalItems } from './seasonal'
import { useCatalog } from './useCatalog'
import { categoryAnchorId, useCategoryScrollSpy } from './useCategoryScrollSpy'

function tileState(entry: ListEntryWithItem | undefined): TileState {
  if (!entry) return 'idle'
  return entry.status === 'cart' ? 'done' : 'active'
}

export function CatalogScreen() {
  const catalog = useCatalog()
  const list = useList()
  const mutations = useListMutations()
  const stickyRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const stuck = useStuck(stickyRef)
  const slugs = catalog.categories.map((c) => c.slug)
  const { active, goTo } = useCategoryScrollSpy(slugs, stickyRef, endRef)
  const [sheetTarget, setSheetTarget] = useState<EntrySheetTarget | null>(null)
  const [createRequest, setCreateRequest] = useState<CreateItemRequest | null>(null)

  // frutta e verdura del mese: in cima, prima delle categorie
  const month = currentMonth()
  const inSeason = useMemo(
    () => seasonalItems(catalog.items, catalog.categoryById, month, SEASONAL_CATALOG_SLUGS),
    [catalog.items, catalog.categoryById, month],
  )

  function toggle(item: Item) {
    const entry = list.entryByItemId.get(item.id)
    if (entry) mutations.remove(entry.id)
    else mutations.add(item)
  }

  return (
    <main className="flex flex-col pb-6">
      <PageHeader
        title={t.nav.catalog}
        subtitle={catalog.isPending ? 'Carico il catalogo...' : `${catalog.items.length} prodotti`}
      />

      <div
        ref={stickyRef}
        className={`sticky z-10 bg-app/95 backdrop-blur-sm transition-[padding] duration-150 ${stuck ? 'pl-[46px]' : ''}`}
        style={{ top: STICKY_TOP }}
      >
        <CategoryChips
          categories={catalog.categories}
          selected={active}
          onSelect={goTo}
          toggle={false}
          followSelected
          allLabel="Tutte"
        />
      </div>

      <ProductGrid label="Catalogo prodotti" className="pt-2">
        {inSeason.length > 0 && [
          <CategoryDivider
            key="divider-season"
            name={t.season.title}
            id="cat-di-stagione"
            slug="verdura"
            icon="Sprout"
          />,
          ...inSeason.map((item) => {
            const category = catalog.categoryById.get(item.category_id)
            const entry = list.entryByItemId.get(item.id)
            return (
              <ProductTile
                key={`season-${item.id}`}
                name={item.name}
                icon={item.icon}
                state={tileState(entry)}
                quantity={
                  entry
                    ? badgeQuantity(entry.quantity, entry.unit, entry.item.default_unit)
                    : undefined
                }
                unit={entry?.unit}
                onTap={() => toggle(item)}
                onLongPress={category ? () => setSheetTarget({ item, category, entry }) : undefined}
              />
            )
          }),
        ]}
        {catalog.categories.map((category) => {
          const items = catalog.itemsByCategory.get(category.id) ?? []
          return [
            <CategoryDivider
              key={`divider-${category.id}`}
              name={category.name}
              id={categoryAnchorId(category.slug)}
              slug={category.slug}
              icon={category.icon}
            />,
            ...items.map((item) => {
              const entry = list.entryByItemId.get(item.id)
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
                  onTap={() => toggle(item)}
                  onLongPress={() => setSheetTarget({ item, category, entry })}
                />
              )
            }),
            <AddTile key={`add-${category.id}`} onTap={() => setCreateRequest({ category })} />,
          ]
        })}
      </ProductGrid>
      <div ref={endRef} aria-hidden="true" />

      <EntrySheet target={sheetTarget} onClose={() => setSheetTarget(null)} />
      <CreateItemSheet
        request={createRequest}
        onClose={() => setCreateRequest(null)}
        addToList={false}
      />
    </main>
  )
}
