import { useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ProductGrid } from '@/components/ProductGrid'
import { ProductTile } from '@/components/ProductTile'
import type { TileState } from '@/components/ProductTile'
import { SectionHeader } from '@/components/SectionHeader'
import { useCatalog } from '@/features/catalog/useCatalog'
import { currentMonth, seasonalItems } from '@/features/catalog/seasonal'
import { useList } from '@/features/list/useList'
import { useListMutations } from '@/features/list/useToggleItem'
import { it as t } from '@/i18n/it'
import type { Item, ListEntryWithItem } from '@/types/domain'
import { MESI } from './mesi'

function tileState(entry: ListEntryWithItem | undefined): TileState {
  if (!entry) return 'idle'
  return entry.status === 'cart' ? 'done' : 'active'
}

/**
 * Ispirazioni del mese: una parola di Frigolo, cosa è di stagione e qualche
 * idea di piatto con gli ingredienti da mettere in lista con un tocco.
 * Tutto vive nell'app (mesi.ts + catalogo già in cache): funziona offline.
 */
export function InspirationScreen() {
  const catalog = useCatalog()
  const list = useList()
  const mutations = useListMutations()
  const month = currentMonth()
  const contenuto = MESI[month - 1] ?? MESI[0]!

  const stagione = useMemo(
    () => ({
      frutta: seasonalItems(catalog.items, catalog.categoryById, month, ['frutta']),
      verdura: seasonalItems(catalog.items, catalog.categoryById, month, ['verdura']),
      pesce: seasonalItems(catalog.items, catalog.categoryById, month, ['pesce']),
    }),
    [catalog.items, catalog.categoryById, month],
  )

  /** Prodotti del catalogo per nome, senza badare a maiuscole */
  const byName = useMemo(() => {
    const map = new Map<string, Item>()
    for (const item of catalog.items) {
      const key = item.name.toLowerCase()
      // il catalogo base vince su un eventuale prodotto personalizzato con lo stesso nome
      if (!map.has(key) || item.household_id === null) map.set(key, item)
    }
    return map
  }, [catalog.items])

  function toggle(item: Item) {
    const entry = list.entryByItemId.get(item.id)
    if (entry) mutations.remove(entry.id)
    else mutations.add(item)
  }

  function tiles(items: Item[]) {
    return items.map((item) => {
      const entry = list.entryByItemId.get(item.id)
      return (
        <ProductTile
          key={item.id}
          name={item.name}
          icon={item.icon}
          state={tileState(entry)}
          onTap={() => toggle(item)}
        />
      )
    })
  }

  const gruppi = [
    { titolo: t.inspiration.fruit, items: stagione.frutta },
    { titolo: t.inspiration.vegetables, items: stagione.verdura },
    { titolo: t.inspiration.fish, items: stagione.pesce },
  ].filter((g) => g.items.length > 0)

  return (
    <main className="flex flex-col pb-10">
      <PageHeader
        title={t.inspiration.title(contenuto.nome.toLowerCase())}
        subtitle={
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-base text-primary">{contenuto.intro}</p>
            <p className="text-sm text-secondary">{t.inspiration.hint}</p>
          </div>
        }
      />

      {catalog.isPending ? (
        <p className="px-4 pt-6 text-sm text-secondary">{t.inspiration.loading}</p>
      ) : (
        <>
          {gruppi.length > 0 && (
            <>
              <div className="mt-6">
                <SectionHeader title={t.inspiration.inSeason} />
              </div>
              {gruppi.map((gruppo) => (
                <section key={gruppo.titolo} className="mb-7">
                  <h3 className="px-4 pb-2 text-xs font-bold uppercase tracking-[0.08em] text-secondary">
                    {gruppo.titolo}
                  </h3>
                  <ProductGrid label={gruppo.titolo}>{tiles(gruppo.items)}</ProductGrid>
                </section>
              ))}
            </>
          )}

          <div className="mt-6">
            <SectionHeader title={t.inspiration.ideas} />
          </div>
          {contenuto.piatti.map((piatto) => {
            const ingredienti = piatto.ingredienti
              .map((nome) => byName.get(nome.toLowerCase()))
              .filter((item): item is Item => Boolean(item))
            return (
              <section key={piatto.nome} className="mb-9">
                <h3 className="px-4 font-display text-lg font-bold leading-tight text-primary">
                  {piatto.nome}
                </h3>
                <p className="px-4 pt-1 pb-4 text-sm text-secondary">{piatto.idea}</p>
                <ProductGrid label={`${t.inspiration.ingredients}: ${piatto.nome}`}>
                  {tiles(ingredienti)}
                </ProductGrid>
              </section>
            )
          })}
        </>
      )}
    </main>
  )
}
