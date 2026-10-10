import { useQuery } from '@tanstack/react-query'
import {
  Archive,
  Check,
  Copy,
  KeyRound,
  LogOut,
  Palette,
  Pencil,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { SectionHeader } from '@/components/SectionHeader'
import { memberName, useHousehold, useInvalidateHousehold } from '@/features/auth/useHousehold'
import { signOut } from '@/features/auth/useSession'
import {
  applyUpdate,
  checkForUpdate,
  getServiceWorkerState,
  subscribeServiceWorker,
} from '@/lib/pwa'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import type { Item } from '@/types/domain'
import { EditItemSheet } from './EditItemSheet'
import { PasswordSheet } from './PasswordSheet'
import { ProfileSheet } from './ProfileSheet'
import { ThemePicker } from './ThemePicker'
import { useSettingsMutations } from './useSettingsMutations'

const collator = new Intl.Collator('it', { sensitivity: 'base' })

/** Tutti i prodotti custom dell'household, archiviati compresi */
function useCustomItems(householdId: string) {
  return useQuery({
    queryKey: ['items', householdId, 'custom-all'],
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('household_id', householdId)
      if (error) throw error
      return [...data].sort((a, b) => collator.compare(a.name, b.name))
    },
  })
}

export function SettingsScreen() {
  const { household, members, me, userId, email } = useHousehold()
  const invalidate = useInvalidateHousehold()
  const { renameHousehold } = useSettingsMutations()
  const customItems = useCustomItems(household.id)
  const sw = useSyncExternalStore(
    subscribeServiceWorker,
    getServiceWorkerState,
    getServiceWorkerState,
  )

  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(household.name)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [applying, setApplying] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(household.join_code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard non disponibile: il codice resta visibile
    }
  }

  async function rotateCode() {
    setRotating(true)
    await supabase.rpc('rotate_join_code', { p_household_id: household.id })
    await invalidate(userId)
    setRotating(false)
  }

  async function saveName(event: FormEvent) {
    event.preventDefault()
    if (!nameDraft.trim()) return
    await renameHousehold.mutateAsync(nameDraft)
    setEditingName(false)
  }

  async function handleCheckUpdate() {
    setCheckingUpdate(true)
    try {
      const found = await checkForUpdate()
      toast(
        found ? 'Nuova versione trovata: tocca "Aggiorna adesso"' : "Sei già all'ultima versione",
        found ? 'success' : 'info',
      )
    } catch {
      toast('Controllo non riuscito, riprova con la rete attiva', 'error')
    } finally {
      setCheckingUpdate(false)
    }
  }

  async function handleApplyUpdate() {
    setApplying(true)
    toast('Aggiorno...', 'info', 4000)
    await applyUpdate()
  }

  const activeCustom = (customItems.data ?? []).filter((i) => !i.is_archived)
  const archivedCustom = (customItems.data ?? []).filter((i) => i.is_archived)
  const offlineStatus = import.meta.env.DEV
    ? 'Non attivo in sviluppo'
    : sw.needRefresh
      ? 'Aggiornamento disponibile'
      : sw.registered || sw.offlineReady
        ? 'Pronto'
        : 'Non disponibile'

  return (
    <main className="flex flex-col gap-2 pb-6">
      <header className="px-4 pt-6 pb-2">
        <h1 className="font-display text-4xl font-bold text-primary">Impostazioni</h1>
      </header>

      {/* ---------------- Profilo e casa ---------------- */}
      <SectionHeader
        title={household.name}
        count={members.length}
        action={
          <Button
            variant="ghost"
            icon={<Pencil size={18} aria-hidden="true" />}
            onClick={() => {
              setNameDraft(household.name)
              setEditingName((v) => !v)
            }}
            aria-label="Rinomina la casa"
          >
            Rinomina
          </Button>
        }
      />
      {editingName && (
        <form onSubmit={saveName} className="mx-4 flex gap-2">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={60}
            autoFocus
            autoCapitalize="sentences"
            aria-label="Nome della casa"
            className="h-12 min-w-0 flex-1 rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button
            type="submit"
            disabled={renameHousehold.isPending || !nameDraft.trim()}
            icon={<Check size={18} aria-hidden="true" />}
          >
            Salva
          </Button>
        </form>
      )}
      <ul className="mx-4 divide-y divide-subtle rounded-3xl bg-surface ring-1 ring-subtle">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center gap-3 px-4 py-3">
            <Avatar
              name={memberName(member)}
              color={member.color}
              avatarUrl={member.avatar_url}
              size={44}
            />
            <div className="flex flex-1 flex-col leading-tight">
              <span className="font-bold text-primary">{memberName(member)}</span>
              {member.user_id === userId && <span className="text-xs text-secondary">Sei tu</span>}
            </div>
            {member.user_id === userId && (
              <Button
                variant="secondary"
                className="h-10 px-4 text-sm"
                icon={<UserRound size={16} aria-hidden="true" />}
                onClick={() => setProfileOpen(true)}
              >
                Profilo
              </Button>
            )}
          </li>
        ))}
      </ul>

      {members.length < 2 && (
        <>
          <SectionHeader title="Invita il partner" />
          <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 ring-1 ring-subtle">
            <p className="text-sm text-secondary">
              Il partner accede a Frigolo e poi inserisce questo codice.
            </p>
            <p className="text-center font-display text-3xl font-bold tracking-[0.2em] text-accent">
              {household.join_code}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                icon={<Copy size={18} aria-hidden="true" />}
                onClick={copyCode}
              >
                {copied ? 'Copiato' : 'Copia'}
              </Button>
              <Button
                variant="ghost"
                icon={<RefreshCw size={18} aria-hidden="true" />}
                onClick={rotateCode}
                disabled={rotating}
              >
                Rigenera
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Tema ---------------- */}
      <SectionHeader
        title="Tema"
        action={<Palette size={20} className="text-secondary" aria-hidden="true" />}
      />
      <ThemePicker />

      {/* ---------------- Prodotti custom ---------------- */}
      <SectionHeader title="I vostri prodotti" count={activeCustom.length} />
      {customItems.isPending ? (
        <p className="px-4 text-sm text-secondary">Carico...</p>
      ) : activeCustom.length === 0 && archivedCustom.length === 0 ? (
        <p className="px-4 text-sm text-secondary">
          Nessun prodotto creato da voi. Si aggiungono dalla ricerca o dal catalogo.
        </p>
      ) : (
        <ul className="mx-4 divide-y divide-subtle rounded-3xl bg-surface ring-1 ring-subtle">
          {[...activeCustom, ...archivedCustom].map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setEditingItem(item)}
                className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left"
              >
                <Icon
                  name={item.icon}
                  size={20}
                  className="shrink-0 text-secondary"
                  aria-hidden="true"
                />
                <span
                  className={[
                    'flex-1 font-bold',
                    item.is_archived ? 'text-secondary line-through' : 'text-primary',
                  ].join(' ')}
                >
                  {item.name}
                </span>
                {item.is_archived ? (
                  <Archive size={16} className="text-secondary" aria-label="archiviato" />
                ) : (
                  <Pencil size={16} className="text-secondary" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- App ---------------- */}
      <SectionHeader title="App" />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 text-sm ring-1 ring-subtle">
        <div className="flex justify-between">
          <span className="text-secondary">Versione</span>
          <span className="font-bold text-primary">{__APP_VERSION__}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">Uso offline</span>
          <span className="font-bold text-primary">{offlineStatus}</span>
        </div>
        {sw.needRefresh ? (
          <Button
            fullWidth
            icon={<RefreshCw size={18} aria-hidden="true" />}
            onClick={handleApplyUpdate}
            disabled={applying}
          >
            {applying ? 'Aggiorno...' : 'Aggiorna adesso'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            icon={
              <RefreshCw
                size={18}
                className={checkingUpdate ? 'animate-spin' : ''}
                aria-hidden="true"
              />
            }
            onClick={handleCheckUpdate}
            disabled={checkingUpdate || import.meta.env.DEV}
          >
            {checkingUpdate ? 'Controllo...' : 'Controlla aggiornamenti'}
          </Button>
        )}
        <p className="text-xs text-secondary">
          L&apos;app controlla da sola ogni ora e quando torna in primo piano; qui puoi forzare il
          controllo.
        </p>
      </div>

      {/* ---------------- Account ---------------- */}
      <SectionHeader title="Account" />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 text-sm ring-1 ring-subtle">
        {email && (
          <div className="flex justify-between gap-3">
            <span className="text-secondary">Email</span>
            <span className="truncate font-bold text-primary">{email}</span>
          </div>
        )}
        <Button
          variant="secondary"
          fullWidth
          icon={<KeyRound size={18} aria-hidden="true" />}
          onClick={() => setPasswordOpen(true)}
        >
          Cambia password
        </Button>
      </div>

      <div className="mx-4 mt-2">
        <Button
          variant="ghost"
          fullWidth
          icon={<LogOut size={18} aria-hidden="true" />}
          onClick={() => signOut()}
        >
          Esci ({memberName(me)})
        </Button>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <PasswordSheet open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditItemSheet item={editingItem} onClose={() => setEditingItem(null)} />
    </main>
  )
}
