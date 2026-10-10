import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { Splash } from '@/components/Splash'
import { LoginScreen } from './LoginScreen'
import { OnboardingScreen } from './OnboardingScreen'
import { UpdatePasswordScreen } from './UpdatePasswordScreen'
import { HouseholdContext, useHouseholdQuery } from './useHousehold'
import { signOut, useSession } from './useSession'

interface AuthGateProps {
  children: ReactNode
}

/**
 * Cancelli in sequenza: sessione, (recupero password), household, app.
 * - nessuna sessione: LoginScreen
 * - sessione da link di recupero: UpdatePasswordScreen
 * - sessione ma nessun household: OnboardingScreen
 * - altrimenti: l'app, con HouseholdContext valorizzato
 */
export function AuthGate({ children }: AuthGateProps) {
  const session = useSession()

  if (session.status === 'loading') return <Splash />
  if (session.status === 'signed-out') return <LoginScreen />
  if (session.recovery) return <UpdatePasswordScreen onDone={session.endRecovery} />

  return (
    <HouseholdGate userId={session.user.id} email={session.user.email}>
      {children}
    </HouseholdGate>
  )
}

interface HouseholdGateProps extends AuthGateProps {
  userId: string
  email: string | undefined
}

function HouseholdGate({ userId, email, children }: HouseholdGateProps) {
  const query = useHouseholdQuery(userId)

  if (query.isPending) return <Splash message="Carico la casa..." />

  if (query.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          Non riesco a caricare la casa
        </h1>
        <p className="text-secondary">{query.error.message}</p>
        <div className="flex gap-2">
          <Button onClick={() => query.refetch()}>Riprova</Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Esci
          </Button>
        </div>
      </main>
    )
  }

  if (!query.data) return <OnboardingScreen userId={userId} email={email} />

  const { household, members } = query.data
  const me = members.find((m) => m.user_id === userId)
  if (!me) {
    // Non dovrebbe succedere: l'household è visibile solo ai membri
    return <OnboardingScreen userId={userId} email={email} />
  }

  return (
    <HouseholdContext.Provider
      value={{
        household,
        members,
        me,
        others: members.filter((m) => m.user_id !== userId),
        userId,
        email,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}
