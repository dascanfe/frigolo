import { useState } from 'react'
import { CategoryChips } from '@/components/CategoryChips'
import { AddTile, ProductTile } from '@/components/ProductTile'
import type { TileState } from '@/components/ProductTile'
import { CategoryDivider, ProductGrid } from '@/components/ProductGrid'
import { EntrySheet } from '@/features/list/EntrySheet'
import type { EntrySheetTarget } from '@/features/list/EntrySheet'
import { useList } from '@/features/list/useList'
import { useListMutations } from '@/features/list/useToggleItem'
import type { Item, ListEntryWithItem } from '@/types/domain'
import { badgeQuantity } from '@/lib/format'
import { CreateItemSheet } from './CreateItemSheet'
import type { CreateItemRequest } from './CreateItemSheet'
import { useCatalog } from './useCatalog'

function tileState(entry: ListEntryWithItem | undefined): TileState {
  if (!entry) return 'idle'
  return entry.status === 'cart' ? 'done' : 'active'
}

export function CatalogScreen() {
  const catalog = useCatalog()
  const list = useList()
  const mutations = useListMutations()
  const [selected, setSelected] = useState<string | null>(null)
  const [sheetTarget, setSheetTarget] = useState<EntrySheetTarget | null>(null)
  const [createRequest, setCreateRequest] = useState<CreateItemRequest | null>(null)

  const visibleCategories = selected
    ? catalog.categories.filter((c) => c.slug === selected)
    : catalog.categories

  function toggle(item: Item) {
    const entry = list.entryByItemId.get(item.id)
    if (entry) mutations.remove(entry.id)
    else mutations.add(item)
  }

  return (
    <main className="flex flex-col pb-6">
      <header className="px-4 pt-6 pb-1">
        <h1 className="font-display text-4xl font-bold text-primary">Catalogo</h1>
        <p className="text-sm text-secondary">
          {catalog.isPending ? 'Carico il catalogo...' : `${catalog.items.length} prodotti`}
        </p>
      </header>

      <div
        className="sticky top-0 z-10 bg-app/95 backdrop-blur-sm"
        style={{ top: 'var(--safe-top)' }}
      >
        <CategoryChips
          categories={catalog.categories}
          selected={selected}
          onSelect={setSelected}
          allLabel="Tutte"
        />
      </div>

      <ProductGrid label="Catalogo prodotti" className="pt-2">
        {visibleCategories.map((category) => {
          const items = catalog.itemsByCategory.get(category.id) ?? []
          return [
            <CategoryDivider
              key={`divider-${category.id}`}
              name={category.name}
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

      <EntrySheet target={sheetTarget} onClose={() => setSheetTarget(null)} />
      <CreateItemSheet
        request={createRequest}
        onClose={() => setCreateRequest(null)}
        addToList={false}
      />
    </main>
  )
}
