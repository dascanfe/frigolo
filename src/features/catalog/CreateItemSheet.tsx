import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { CategoryChips } from '@/components/CategoryChips'
import { TextField } from '@/components/TextField'
import { UnitChips } from '@/components/UnitChips'
import { useHousehold } from '@/features/auth/useHousehold'
import { useListMutations } from '@/features/list/useToggleItem'
import { CATEGORY_ICON_SUGGESTIONS } from '@/lib/iconKeywords'
import type { IconName } from '@/lib/icons'
import { supabase } from '@/lib/supabase'
import { capitalizeFirst } from '@/lib/format'
import { toast } from '@/lib/toast'
import type { Category, Item, Unit } from '@/types/domain'
import { CATEGORY_SLUGS } from '@/types/domain'
import { IconPicker } from './IconPicker'
import { itemsQueryKey, useCatalog } from './useCatalog'

export interface CreateItemRequest {
  /** Nome precompilato (dalla ricerca) */
  name?: string
  /** Categoria preselezionata (dal catalogo) */
  category?: Category
}

interface CreateItemSheetProps {
  request: CreateItemRequest | null
  onClose: () => void
  /** Se true (default) il nuovo prodotto va subito in lista */
  addToList?: boolean
}

function defaultIconFor(category: Category | null): IconName {
  const slug = category?.slug
  if (slug && (CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return CATEGORY_ICON_SUGGESTIONS[slug as (typeof CATEGORY_SLUGS)[number]][0] ?? 'ShoppingBasket'
  }
  return 'ShoppingBasket'
}

/** Bottom sheet per creare un prodotto custom dell'household */
export function CreateItemSheet({ request, onClose, addToList = true }: CreateItemSheetProps) {
  return (
    <BottomSheet open={request !== null} onClose={onClose} title="Nuovo prodotto">
      {request && (
        <CreateItemForm
          key={`${request.name ?? ''}|${request.category?.id ?? ''}`}
          request={request}
          onClose={onClose}
          addToList={addToList}
        />
      )}
    </BottomSheet>
  )
}

function CreateItemForm({
  request,
  onClose,
  addToList,
}: {
  request: CreateItemRequest
  onClose: () => void
  addToList: boolean
}) {
  const { household, userId } = useHousehold()
  const catalog = useCatalog()
  const mutations = useListMutations()
  const queryClient = useQueryClient()

  const [name, setName] = useState(capitalizeFirst(request.name?.trim() ?? ''))
  const [category, setCategory] = useState<Category | null>(request.category ?? null)
  const [icon, setIcon] = useState<IconName>(() => defaultIconFor(request.category ?? null))
  const [iconTouched, setIconTouched] = useState(false)
  const [unit, setUnit] = useState<Unit>('pz')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectCategory(slug: string | null) {
    const next = slug ? (catalog.categoryBySlug.get(slug) ?? null) : null
    setCategory(next)
    // finché l'utente non sceglie un'icona a mano, segue la categoria
    if (!iconTouched) setIcon(defaultIconFor(next))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const cleanName = capitalizeFirst(name.trim())
    if (!cleanName || !category) return
    setBusy(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('items')
      .insert({
        household_id: household.id,
        category_id: category.id,
        name: cleanName,
        icon,
        default_unit: unit,
        created_by: userId,
      })
      .select()
      .single()

    setBusy(false)
    if (insertError || !data) {
      setError(
        insertError?.code === '23505'
          ? 'Esiste già un prodotto con questo nome.'
          : (insertError?.message ?? 'Non sono riuscito a salvare il prodotto.'),
      )
      return
    }

    // aggiorna la cache del catalogo prima di aggiungere alla lista, così
    // la riga trova subito il suo prodotto
    queryClient.setQueryData<Item[]>(itemsQueryKey(household.id), (items) =>
      items ? [...items, data] : [data],
    )
    void queryClient.invalidateQueries({ queryKey: itemsQueryKey(household.id) })

    if (addToList) mutations.add(data)
    toast(
      addToList ? `${data.name} creato e aggiunto alla lista` : `${data.name} creato`,
      'success',
    )
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-2">
      <TextField
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        required
        autoFocus={!request.name}
        placeholder="Es. Tofu affumicato"
        autoCapitalize="sentences"
        autoComplete="off"
        error={error}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Categoria</span>
        <div className="-mx-5">
          <CategoryChips
            categories={catalog.categories}
            selected={category?.slug ?? null}
            onSelect={selectCategory}
          />
        </div>
        {!category && (
          <p className="text-xs text-secondary">Scegli una categoria per continuare.</p>
        )}
      </div>

      <IconPicker
        value={icon}
        onChange={(next) => {
          setIcon(next)
          setIconTouched(true)
        }}
        categorySlug={category?.slug ?? null}
      />

      <UnitChips value={unit} onChange={setUnit} label="Unità di default" />

      <Button
        type="submit"
        fullWidth
        icon={<Plus size={18} aria-hidden="true" />}
        disabled={busy || !name.trim() || !category}
      >
        {busy ? 'Salvo...' : addToList ? 'Crea e aggiungi alla lista' : 'Crea prodotto'}
      </Button>
    </form>
  )
}
