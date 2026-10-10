import { Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { UnitChips } from '@/components/UnitChips'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { useLongPress } from '@/lib/useLongPress'
import { categoryTextColorVar } from '@/lib/colors'
import type { Category, Item, ListEntryWithItem, Unit } from '@/types/domain'
import { isUnit } from '@/types/domain'
import { useStores } from './useStores'
import { useListMutations } from './useToggleItem'

export interface EntrySheetTarget {
  item: Item
  category: Category
  /** Riga esistente in lista; assente se il prodotto non è ancora in lista */
  entry?: ListEntryWithItem
  /** Motivo del suggerimento (Fase 6), mostrato sotto il nome */
  reason?: string
}

interface EntrySheetProps {
  target: EntrySheetTarget | null
  onClose: () => void
}

/** Bottom sheet del long press: quantità, unità, nota; aggiunta o rimozione */
export function EntrySheet({ target, onClose }: EntrySheetProps) {
  return (
    <BottomSheet open={target !== null} onClose={onClose} title={target?.item.name}>
      {target && (
        <EntryForm key={target.entry?.id ?? target.item.id} target={target} onClose={onClose} />
      )}
    </BottomSheet>
  )
}

function EntryForm({ target, onClose }: { target: EntrySheetTarget; onClose: () => void }) {
  const { item, category, entry, reason } = target
  const { members } = useHousehold()
  const mutations = useListMutations()
  const { stores, addStore, renameStore, removeStore } = useStores()
  const [addingStore, setAddingStore] = useState(false)
  const [newStore, setNewStore] = useState('')
  /** Supermercato in modifica (long press sul chip) e nuovo nome */
  const [editingStore, setEditingStore] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [storeError, setStoreError] = useState<string | null>(null)

  const initialUnit: Unit = isUnit(entry?.unit)
    ? entry.unit
    : isUnit(item.default_unit)
      ? item.default_unit
      : 'pz'
  const [quantity, setQuantity] = useState<number>(entry?.quantity ?? 1)
  const [unit, setUnit] = useState<Unit>(initialUnit)
  const [note, setNote] = useState(entry?.note ?? '')
  const [store, setStore] = useState<string | null>(entry?.store ?? null)

  const dirty =
    !entry ||
    quantity !== entry.quantity ||
    unit !== (entry.unit ?? item.default_unit) ||
    note !== (entry.note ?? '') ||
    store !== (entry.store ?? null)

  const addedBy = entry ? members.find((m) => m.user_id === entry.added_by) : undefined

  async function submitNewStore() {
    if (!newStore.trim()) return
    setStoreError(null)
    try {
      const name = await addStore.mutateAsync(newStore)
      setStore(name)
      setNewStore('')
      setAddingStore(false)
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Non sono riuscito ad aggiungerlo')
    }
  }

  function startEditStore(name: string) {
    setAddingStore(false)
    setEditingStore(name)
    setEditName(name)
    setStoreError(null)
  }

  async function submitRename() {
    if (!editingStore) return
    setStoreError(null)
    try {
      const name = await renameStore.mutateAsync({ from: editingStore, to: editName })
      if (store === editingStore) setStore(name)
      setEditingStore(null)
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Non sono riuscito a rinominarlo')
    }
  }

  async function submitRemove() {
    if (!editingStore) return
    setStoreError(null)
    try {
      await removeStore.mutateAsync(editingStore)
      if (store === editingStore) setStore(null)
      setEditingStore(null)
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Non sono riuscito a eliminarlo')
    }
  }

  function save() {
    if (entry) {
      mutations.update(entry.id, { quantity, unit, note, store })
    } else {
      mutations.add(item, { quantity, unit, note, store })
    }
    onClose()
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-surface text-secondary ring-1 ring-subtle">
          <Icon name={item.icon} size={26} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: categoryTextColorVar(category.slug) }}
          >
            {category.name}
          </span>
          {reason && <span className="text-sm text-secondary">{reason}</span>}
          {entry && addedBy && (
            <span className="text-sm text-secondary">Aggiunto da {memberName(addedBy)}</span>
          )}
        </div>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-bold text-primary">Dove lo compri</legend>
        <div className="chip-row py-1" role="radiogroup" aria-label="Supermercato">
          <StoreChip label="Ovunque" selected={store === null} onSelect={() => setStore(null)} />
          {stores.map((name) => (
            <StoreChip
              key={name}
              label={name}
              selected={store === name}
              onSelect={() => setStore(name)}
              onEdit={() => startEditStore(name)}
            />
          ))}
          <button
            type="button"
            onClick={() => setAddingStore(true)}
            className="chip h-10 shrink-0 gap-1 border-dashed pr-4 pl-3 text-secondary"
            aria-label="Aggiungi un supermercato"
          >
            <Plus size={16} aria-hidden="true" />
            Aggiungi
          </button>
        </div>
        {editingStore && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void submitRename()
                  }
                }}
                maxLength={40}
                autoFocus
                autoCapitalize="words"
                aria-label={`Nuovo nome per ${editingStore}`}
                className="h-11 min-w-0 flex-1 rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button
                type="button"
                className="h-11 px-4"
                icon={<Check size={18} aria-hidden="true" />}
                onClick={() => void submitRename()}
                disabled={renameStore.isPending || !editName.trim()}
              >
                Salva
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-sm"
                onClick={() => setEditingStore(null)}
              >
                Annulla
              </Button>
              <Button
                type="button"
                variant="danger"
                className="h-9 text-sm"
                icon={<Trash2 size={16} aria-hidden="true" />}
                onClick={() => void submitRemove()}
                disabled={removeStore.isPending}
              >
                Elimina
              </Button>
            </div>
          </div>
        )}
        {addingStore && (
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submitNewStore()
                }
              }}
              maxLength={40}
              autoFocus
              autoCapitalize="words"
              placeholder="Nome del supermercato"
              aria-label="Nome del nuovo supermercato"
              className="h-11 min-w-0 flex-1 rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button
              type="button"
              className="h-11 px-4"
              onClick={() => void submitNewStore()}
              disabled={addStore.isPending || !newStore.trim()}
            >
              Aggiungi
            </Button>
          </div>
        )}
        {storeError && (
          <p className="text-xs font-bold text-rust" role="alert">
            {storeError}
          </p>
        )}
        {!addingStore && !editingStore && (
          <p className="text-xs text-secondary">
            Tieni premuto un supermercato per rinominarlo o eliminarlo.
          </p>
        )}
      </fieldset>

      <QuantityStepper value={quantity} unit={unit} onChange={setQuantity} />
      <UnitChips value={unit} onChange={setUnit} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="entry-note" className="text-sm font-bold text-primary">
          Nota
        </label>
        <input
          id="entry-note"
          type="text"
          maxLength={200}
          placeholder="Es. quello senza lattosio"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-12 w-full rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button fullWidth onClick={save} disabled={entry ? !dirty : false}>
          {entry ? 'Salva' : 'Aggiungi alla lista'}
        </Button>
        {entry && (
          <Button
            variant="danger"
            fullWidth
            icon={<Trash2 size={18} aria-hidden="true" />}
            onClick={() => {
              mutations.remove(entry.id)
              onClose()
            }}
          >
            Rimuovi dalla lista
          </Button>
        )}
      </div>
    </div>
  )
}

function StoreChip({
  label,
  selected,
  onSelect,
  onEdit,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  onEdit?: () => void
}) {
  const handlers = useLongPress({ onTap: onSelect, onLongPress: onEdit })
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={onEdit ? `${label}, tieni premuto per modificare` : label}
      className="chip h-10 shrink-0 px-4"
      style={
        selected
          ? {
              backgroundColor: 'var(--text-primary)',
              borderColor: 'var(--text-primary)',
              color: 'var(--c-cream)',
            }
          : undefined
      }
      {...handlers}
    >
      {label}
    </button>
  )
}
