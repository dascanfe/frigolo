import { Archive, ArchiveRestore } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { CategoryChips } from '@/components/CategoryChips'
import { TextField } from '@/components/TextField'
import { UnitChips } from '@/components/UnitChips'
import { IconPicker } from '@/features/catalog/IconPicker'
import { useCatalog } from '@/features/catalog/useCatalog'
import { isIconName } from '@/lib/icons'
import type { IconName } from '@/lib/icons'
import { toast } from '@/lib/toast'
import type { Category, Item, Unit } from '@/types/domain'
import { isUnit } from '@/types/domain'
import { useSettingsMutations } from './useSettingsMutations'

interface EditItemSheetProps {
  item: Item | null
  onClose: () => void
}

/** Modifica di un prodotto custom: nome, categoria, icona, unità, archiviazione */
export function EditItemSheet({ item, onClose }: EditItemSheetProps) {
  return (
    <BottomSheet open={item !== null} onClose={onClose} title="Modifica prodotto">
      {item && <EditItemForm key={item.id} item={item} onClose={onClose} />}
    </BottomSheet>
  )
}

function EditItemForm({ item, onClose }: { item: Item; onClose: () => void }) {
  const catalog = useCatalog()
  const { updateItem } = useSettingsMutations()
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState<Category | null>(
    catalog.categoryById.get(item.category_id) ?? null,
  )
  const [icon, setIcon] = useState<IconName>(isIconName(item.icon) ? item.icon : 'ShoppingBasket')
  const [unit, setUnit] = useState<Unit>(isUnit(item.default_unit) ? item.default_unit : 'pz')
  const [error, setError] = useState<string | null>(null)

  async function save(patch: Partial<Item>) {
    setError(null)
    try {
      await updateItem.mutateAsync({ id: item.id, ...patch })
      return true
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : ''
      setError(
        message.includes('duplicate') || message.includes('23505')
          ? 'Esiste già un prodotto con questo nome.'
          : message || 'Salvataggio non riuscito',
      )
      return false
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !category) return
    const ok = await save({ name: name.trim(), category_id: category.id, icon, default_unit: unit })
    if (ok) {
      toast('Prodotto aggiornato', 'success')
      onClose()
    }
  }

  async function toggleArchive() {
    const ok = await save({ is_archived: !item.is_archived })
    if (ok) {
      toast(item.is_archived ? 'Prodotto ripristinato' : 'Prodotto archiviato', 'success')
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-2">
      <TextField
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        required
        autoComplete="off"
        error={error}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Categoria</span>
        <div className="-mx-5">
          <CategoryChips
            categories={catalog.categories}
            selected={category?.slug ?? null}
            onSelect={(slug) =>
              setCategory(slug ? (catalog.categoryBySlug.get(slug) ?? null) : null)
            }
          />
        </div>
      </div>
      <IconPicker value={icon} onChange={setIcon} categorySlug={category?.slug ?? null} />
      <UnitChips value={unit} onChange={setUnit} label="Unità di default" />
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="submit"
          fullWidth
          disabled={updateItem.isPending || !name.trim() || !category}
        >
          {updateItem.isPending ? 'Salvo...' : 'Salva'}
        </Button>
        <Button
          type="button"
          variant={item.is_archived ? 'secondary' : 'danger'}
          fullWidth
          icon={
            item.is_archived ? (
              <ArchiveRestore size={18} aria-hidden="true" />
            ) : (
              <Archive size={18} aria-hidden="true" />
            )
          }
          onClick={toggleArchive}
          disabled={updateItem.isPending}
        >
          {item.is_archived ? 'Ripristina nel catalogo' : 'Archivia'}
        </Button>
      </div>
    </form>
  )
}
