import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { Splash } from '@/components/Splash'
import { pickCurrentList, readStoredList, storeCurrentList } from '@/features/lists/currentList'
import { clearPendingInvite, readPendingInvite } from '@/features/lists/inviteCode'
import {
  joinedAt,
  useInvalidateLists,
  useListsQuery,
  useProfileQuery,
} from '@/features/lists/useLists'
import type { ListMember } from '@/features/lists/useLists'
import { avatarPublicUrl } from '@/features/profile/profileApi'
import { FirstListScreen } from '@/features/onboarding/FirstListScreen'
import { InviteScreen } from '@/features/onboarding/InviteScreen'
import { ProfileSetupScreen } from '@/features/onboarding/ProfileSetupScreen'
import { it as t } from '@/i18n/it'
import { LoginScreen } from './LoginScreen'
import { UpdatePasswordScreen } from './UpdatePasswordScreen'
import { HouseholdContext } from './useHousehold'
import type { HouseholdContextValue } from './useHousehold'
import { signOut, useSession } from './useSession'

interface AuthGateProps {
  children: ReactNode
}

/**
 * Cancelli in sequenza:
 * - nessuna sessione: LoginScreen (registrazione, "Controlla la posta")
 * - sessione da link di recupero: UpdatePasswordScreen
 * - profilo da completare: "Come ti chiami?"
 * - link d'invito in sospeso: "Ti invitano in {lista}"
 * - nessuna lista: "La tua prima lista" (ed eventualmente "Invita")
 * - altrimenti: l'app, con HouseholdContext sulla lista aperta
 */
export function AuthGate({ children }: AuthGateProps) {
  const session = useSession()

  if (session.status === 'loading') return <Splash />
  if (session.status === 'signed-out') return <LoginScreen />
  if (session.recovery) return <UpdatePasswordScreen onDone={session.endRecovery} />

  return (
    <SignedInGate key={session.user.id} userId={session.user.id} email={session.user.email}>
      {children}
    </SignedInGate>
  )
}

interface SignedInGateProps extends AuthGateProps {
  userId: string
  email: string | undefined
}

function SignedInGate({ userId, email, children }: SignedInGateProps) {
  const profileQuery = useProfileQuery(userId)
  const listsQuery = useListsQuery(userId)
  const invalidate = useInvalidateLists()
  const [storedListId, setStoredListId] = useState(() => readStoredList(userId))
  const [pendingInvite, setPendingInvite] = useState(readPendingInvite)
  // "La tua prima lista" resta finché chi la crea non ha finito di invitare
  const [firstListFlow, setFirstListFlow] = useState(false)

  const lists = listsQuery.data
  const profile = profileQuery.data
  const currentId = useMemo(
    () =>
      lists
        ? pickCurrentList(
            lists.map((list) => ({ id: list.household.id, joinedAt: joinedAt(list, userId) })),
            storedListId,
          )
        : null,
    [lists, storedListId, userId],
  )

  const value = useMemo((): HouseholdContextValue | null => {
    if (!lists || !profile) return null
    const current = lists.find((list) => list.household.id === currentId)
    if (!current) return null
    const me: ListMember = current.members.find((m) => m.user_id === userId) ?? {
      user_id: userId,
      joined_at: current.household.created_at,
      display_name: profile.display_name,
      color: profile.color,
      avatar_url: avatarPublicUrl(profile.avatar_path),
    }
    return {
      household: current.household,
      members: current.members,
      userId,
      email,
      profile,
      me,
      others: current.members.filter((m) => m.user_id !== userId),
      lists,
      selectList: (householdId: string) => {
        storeCurrentList(userId, householdId)
        setStoredListId(householdId)
      },
    }
  }, [lists, profile, currentId, userId, email])

  async function openList(householdId: string | null) {
    await invalidate(userId)
    if (householdId) {
      storeCurrentList(userId, householdId)
      setStoredListId(householdId)
    }
  }

  if (profileQuery.isPending || listsQuery.isPending) {
    return <Splash message="Carico la lista..." />
  }

  if (profileQuery.isError || listsQuery.isError) {
    const error = profileQuery.error ?? listsQuery.error
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">{t.errors.loadLists}</h1>
        <p className="text-secondary">
          {error?.message.toLowerCase().includes('fetch') ? t.errors.network : error?.message}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              void profileQuery.refetch()
              void listsQuery.refetch()
            }}
          >
            {t.common.retry}
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            {t.common.signOut}
          </Button>
        </div>
      </main>
    )
  }

  if (!profileQuery.data.completed_at) {
    return (
      <ProfileSetupScreen
        userId={userId}
        email={email}
        profile={profileQuery.data}
        onDone={async () => {
          await invalidate(userId)
        }}
      />
    )
  }

  if (pendingInvite) {
    return (
      <InviteScreen
        code={pendingInvite}
        onDone={async (householdId) => {
          clearPendingInvite()
          await openList(householdId)
          setPendingInvite(null)
        }}
      />
    )
  }

  if (!value || firstListFlow) {
    return (
      <FirstListScreen
        onStart={() => setFirstListFlow(true)}
        onDone={async (householdId) => {
          await openList(householdId)
          setFirstListFlow(false)
        }}
      />
    )
  }

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}
