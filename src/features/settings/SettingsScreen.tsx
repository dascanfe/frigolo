import { useQuery } from '@tanstack/react-query'
import {
  Archive,
  Check,
  Coffee,
  DoorOpen,
  KeyRound,
  List,
  LogOut,
  Palette,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { ConfirmSheet } from '@/components/ConfirmSheet'
import { Icon } from '@/components/Icon'
import { SectionHeader } from '@/components/SectionHeader'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { signOut } from '@/features/auth/useSession'
import { InvitePanel } from '@/features/lists/InvitePanel'
import { ListSwitcherSheet } from '@/features/lists/ListSwitcherSheet'
import {
  deleteList,
  describeListError,
  leaveList,
  renameList,
  useInvalidateLists,
} from '@/features/lists/useLists'
import { avatarPublicUrl } from '@/features/profile/profileApi'
import { DONATION_URL, SUPPORT_EMAIL, it as t } from '@/i18n/it'
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
import { MyDataSection } from './MyDataSection'
import { PasswordSheet } from './PasswordSheet'
import { ProfileSheet } from './ProfileSheet'
import { ThemePicker } from './ThemePicker'

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
  const { household, members, profile, lists, userId, email } = useHousehold()
  const invalidateLists = useInvalidateLists()
  const customItems = useCustomItems(household.id)
  const sw = useSyncExternalStore(
    subscribeServiceWorker,
    getServiceWorkerState,
    getServiceWorkerState,
  )

  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(household.name)
  const [savingName, setSavingName] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [applying, setApplying] = useState(false)

  const alone = members.length === 1

  async function saveName(event: FormEvent) {
    event.preventDefault()
    if (!nameDraft.trim()) return
    setSavingName(true)
    try {
      await renameList(household.id, nameDraft)
      await invalidateLists(userId)
      setEditingName(false)
      toast(t.lists.renamed, 'success')
    } catch (renameError) {
      toast(describeListError(renameError), 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function handleLeave() {
    const name = household.name
    try {
      const deleted = await leaveList(household.id)
      setConfirm(null)
      await invalidateLists(userId)
      toast(deleted ? t.lists.leftDeleted(name) : t.lists.left(name), 'success')
    } catch (leaveError) {
      toast(describeListError(leaveError), 'error')
    }
  }

  async function handleDelete() {
    try {
      await deleteList(household.id)
      setConfirm(null)
      await invalidateLists(userId)
      toast(t.lists.deleted, 'success')
    } catch (deleteError) {
      toast(describeListError(deleteError), 'error')
    }
  }

  async function handleCheckUpdate() {
    setCheckingUpdate(true)
    try {
      const found = await checkForUpdate()
      toast(found ? t.app.updateFound : t.app.upToDate, found ? 'success' : 'info')
    } catch {
      toast(t.app.updateCheckFailed, 'error')
    } finally {
      setCheckingUpdate(false)
    }
  }

  async function handleApplyUpdate() {
    setApplying(true)
    toast(t.app.updating, 'info', 4000)
    await applyUpdate()
  }

  const activeCustom = (customItems.data ?? []).filter((i) => !i.is_archived)
  const archivedCustom = (customItems.data ?? []).filter((i) => i.is_archived)
  const offlineStatus = import.meta.env.DEV
    ? t.app.offlineDev
    : sw.needRefresh
      ? t.app.offlineUpdate
      : sw.registered || sw.offlineReady
        ? t.app.offlineReady
        : t.app.offlineNone

  return (
    <main className="flex flex-col gap-2 pb-6">
      <header className="px-4 pt-6 pb-2">
        <h1 className="font-display text-4xl font-bold text-primary">Impostazioni</h1>
      </header>

      {/* ---------------- Profilo ---------------- */}
      <SectionHeader title={t.profile.sheetTitle} />
      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        className="mx-4 flex items-center gap-3 rounded-3xl bg-surface px-4 py-3 text-left ring-1 ring-subtle"
      >
        <Avatar
          name={memberName(profile)}
          color={profile.color}
          avatarUrl={avatarPublicUrl(profile.avatar_path)}
          size={48}
        />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-bold text-primary">{memberName(profile)}</span>
          <span className="text-xs text-secondary">Nome, foto e colore, uguali in ogni lista</span>
        </span>
        <Pencil size={18} className="text-secondary" aria-hidden="true" />
      </button>

      {/* ---------------- Lista aperta ---------------- */}
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
            aria-label={`${t.lists.rename} la lista ${household.name}`}
          >
            {t.lists.rename}
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
            aria-label={t.lists.nameLabel}
            className="h-12 min-w-0 flex-1 rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button
            type="submit"
            disabled={savingName || !nameDraft.trim()}
            icon={<Check size={18} aria-hidden="true" />}
          >
            {t.common.save}
          </Button>
        </form>
      )}
      <ul
        className="mx-4 divide-y divide-subtle rounded-3xl bg-surface ring-1 ring-subtle"
        aria-label={t.lists.people}
      >
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
              {member.user_id === userId && (
                <span className="text-xs text-secondary">{t.lists.you}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {alone && <p className="px-4 text-sm text-secondary">{t.lists.alone}</p>}

      <SectionHeader title={t.invite.sectionTitle} />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 ring-1 ring-subtle">
        <p className="text-sm text-secondary">{t.invite.subtitle(household.name)}</p>
        <InvitePanel
          household={household}
          peopleCount={members.length}
          onRotated={() => invalidateLists(userId)}
        />
      </div>

      {/* ---------------- Le tue liste ---------------- */}
      <SectionHeader title={t.lists.yourLists} count={lists.length} />
      <div className="mx-4 flex flex-col gap-2 rounded-3xl bg-surface p-4 ring-1 ring-subtle">
        <Button
          variant="secondary"
          fullWidth
          icon={<List size={18} aria-hidden="true" />}
          onClick={() => setSwitcherOpen(true)}
        >
          {t.lists.switch}
        </Button>
        <Button
          variant="danger"
          fullWidth
          icon={<DoorOpen size={18} aria-hidden="true" />}
          onClick={() => setConfirm('leave')}
        >
          {t.lists.leave}
        </Button>
        {alone && (
          <Button
            variant="danger"
            fullWidth
            icon={<Trash2 size={18} aria-hidden="true" />}
            onClick={() => setConfirm('delete')}
          >
            {t.lists.delete}
          </Button>
        )}
      </div>

      {/* ---------------- Tema ---------------- */}
      <SectionHeader
        title={t.theme.section}
        action={<Palette size={20} className="text-secondary" aria-hidden="true" />}
      />
      <ThemePicker />

      {/* ---------------- Prodotti custom ---------------- */}
      <SectionHeader title={t.customItems.title} count={activeCustom.length} />
      {customItems.isPending ? (
        <p className="px-4 text-sm text-secondary">{t.customItems.loading}</p>
      ) : activeCustom.length === 0 && archivedCustom.length === 0 ? (
        <p className="px-4 text-sm text-secondary">{t.customItems.empty}</p>
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
                  <Archive
                    size={16}
                    className="text-secondary"
                    aria-label={t.customItems.archived}
                  />
                ) : (
                  <Pencil size={16} className="text-secondary" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- App ---------------- */}
      <SectionHeader title={t.app.section} />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 text-sm ring-1 ring-subtle">
        <div className="flex justify-between">
          <span className="text-secondary">{t.app.version}</span>
          <span className="font-bold text-primary">{__APP_VERSION__}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">{t.app.offlineUse}</span>
          <span className="font-bold text-primary">{offlineStatus}</span>
        </div>
        {sw.needRefresh ? (
          <Button
            fullWidth
            icon={<RefreshCw size={18} aria-hidden="true" />}
            onClick={handleApplyUpdate}
            disabled={applying}
          >
            {applying ? t.app.updating : t.app.updateNow}
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
            {checkingUpdate ? t.app.checking : t.app.checkUpdates}
          </Button>
        )}
        <p className="text-xs text-secondary">{t.app.updateHint}</p>
      </div>

      {/* ---------------- I tuoi dati ---------------- */}
      <MyDataSection />

      {/* ---------------- Account ---------------- */}
      <SectionHeader title={t.account.section} />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 text-sm ring-1 ring-subtle">
        {email && (
          <div className="flex justify-between gap-3">
            <span className="text-secondary">{t.account.email}</span>
            <span className="truncate font-bold text-primary">{email}</span>
          </div>
        )}
        <Button
          variant="secondary"
          fullWidth
          icon={<KeyRound size={18} aria-hidden="true" />}
          onClick={() => setPasswordOpen(true)}
        >
          {t.account.changePassword}
        </Button>
      </div>

      <div className="mx-4 mt-2">
        <Button
          variant="ghost"
          fullWidth
          icon={<LogOut size={18} aria-hidden="true" />}
          onClick={() => void signOut()}
        >
          {t.common.signOut} ({memberName(profile)})
        </Button>
      </div>

      {/* ---------------- Caffè: una riga discreta, in fondo ---------------- */}
      <div className="mx-4 mt-4 flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-secondary">{t.donation.text}</p>
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-accent active:bg-sand/40"
        >
          <Coffee size={16} aria-hidden="true" />
          {t.donation.label}
        </a>
        <p className="mt-2 text-xs text-secondary">
          {t.support.text}{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-accent underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <PasswordSheet open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditItemSheet item={editingItem} onClose={() => setEditingItem(null)} />
      <ListSwitcherSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
      <ConfirmSheet
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        title={t.lists.leave}
        message={
          alone ? t.lists.leaveLastConfirm(household.name) : t.lists.leaveConfirm(household.name)
        }
        confirmLabel={t.lists.leave}
        onConfirm={handleLeave}
        danger
      />
      <ConfirmSheet
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={t.lists.delete}
        message={t.lists.deleteConfirm(household.name)}
        confirmLabel={t.lists.delete}
        onConfirm={handleDelete}
        danger
      />
    </main>
  )
}
