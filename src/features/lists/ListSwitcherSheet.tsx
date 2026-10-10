import { Check, KeyRound, Plus } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { it as t } from '@/i18n/it'
import { toast } from '@/lib/toast'
import { CreateListForm } from './CreateListForm'
import { JoinForm } from './JoinForm'
import { useInvalidateLists } from './useLists'

type Mode = 'pick' | 'create' | 'join'

interface ListSwitcherSheetProps {
  open: boolean
  onClose: () => void
  /** Apre direttamente su "Nuova lista" o "Ho un codice" */
  initialMode?: Mode
}

const collator = new Intl.Collator('it', { sensitivity: 'base' })

/** "Cambia lista": le tue liste, più crea una lista nuova o entra con un codice */
export function ListSwitcherSheet({ open, onClose, initialMode = 'pick' }: ListSwitcherSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={t.lists.yourLists}>
      {open && <SwitcherContent initialMode={initialMode} onClose={onClose} />}
    </BottomSheet>
  )
}

function SwitcherContent({ initialMode, onClose }: { initialMode: Mode; onClose: () => void }) {
  const { lists, household, userId, selectList } = useHousehold()
  const invalidate = useInvalidateLists()
  const [mode, setMode] = useState<Mode>(initialMode)

  const sorted = [...lists].sort((a, b) => collator.compare(a.household.name, b.household.name))

  async function openList(id: string) {
    await invalidate(userId)
    selectList(id)
    onClose()
  }

  if (mode === 'create') {
    return (
      <div className="pb-2">
        <CreateListForm
          initialName=""
          onCreated={async (id, name) => {
            await openList(id)
            toast(t.lists.created(name), 'success')
          }}
          onCancel={() => setMode('pick')}
        />
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="flex flex-col gap-3 pb-2">
        <p className="text-sm text-secondary">{t.join.subtitle}</p>
        <JoinForm
          onJoined={async ({ householdId, name, already }) => {
            await openList(householdId)
            toast(already ? t.join.already : t.join.joined(name), 'success')
          }}
          onCancel={() => setMode('pick')}
          cancelLabel={t.common.cancel}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <ul className="divide-y divide-subtle rounded-3xl bg-surface ring-1 ring-subtle">
        {sorted.map(({ household: list, members }) => {
          const current = list.id === household.id
          return (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => {
                  selectList(list.id)
                  onClose()
                  if (!current) toast(t.lists.switched(list.name), 'info')
                }}
                aria-current={current ? 'true' : undefined}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate font-bold text-primary">{list.name}</span>
                  <span className="text-xs text-secondary">
                    {t.lists.peopleCount(members.length)}
                    {current && ` · ${t.lists.current}`}
                  </span>
                </div>
                <span className="flex -space-x-2" aria-hidden="true">
                  {members.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.user_id}
                      name={memberName(member)}
                      color={member.color}
                      avatarUrl={member.avatar_url}
                      size={28}
                      className="ring-app"
                    />
                  ))}
                </span>
                <span className="flex size-6 shrink-0 items-center justify-center text-accent">
                  {current && <Check size={20} strokeWidth={3} aria-hidden="true" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          icon={<Plus size={18} aria-hidden="true" />}
          onClick={() => setMode('create')}
        >
          {t.lists.newList}
        </Button>
        <Button
          variant="secondary"
          icon={<KeyRound size={18} aria-hidden="true" />}
          onClick={() => setMode('join')}
        >
          {t.firstList.code}
        </Button>
      </div>
    </div>
  )
}
