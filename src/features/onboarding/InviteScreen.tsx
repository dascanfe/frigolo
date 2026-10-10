import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import { canAddList, hasRoomForPeople } from '@/features/lists/limits'
import { describeListError, getInvite, joinList } from '@/features/lists/useLists'
import { it as t } from '@/i18n/it'
import { toast } from '@/lib/toast'
import { useState } from 'react'
import { OnboardingLayout } from './OnboardingLayout'

interface InviteScreenProps {
  code: string
  /** Quante liste ha già l'utente: al massimo 2 */
  listCount: number
  /** Fine: id della lista in cui si è entrati, o null se si rinuncia */
  onDone: (householdId: string | null) => void | Promise<void>
}

/** "Ti invitano in {lista}": si vede aprendo un link d'invito */
export function InviteScreen({ code, listCount, onDone }: InviteScreenProps) {
  const preview = useQuery({
    queryKey: ['invite', code],
    queryFn: () => getInvite(code),
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setBusy(true)
    setError(null)
    try {
      const id = await joinList(code)
      if (!id) {
        setError(t.join.badLink)
        setBusy(false)
        return
      }
      await onDone(id)
      toast(t.join.joined(preview.data?.name ?? ''), 'success')
    } catch (joinError) {
      setError(describeListError(joinError))
      setBusy(false)
    }
  }

  if (preview.isPending) {
    return (
      <OnboardingLayout title={t.join.title} subtitle={t.join.checking} showSignOut={false}>
        <span />
      </OnboardingLayout>
    )
  }

  if (preview.isError || !preview.data) {
    return (
      <OnboardingLayout
        title={t.join.title}
        subtitle={preview.isError ? describeListError(preview.error) : t.join.badLink}
        showSignOut={false}
        mascot
      >
        <div className="flex flex-col gap-2">
          {preview.isError && (
            <Button fullWidth onClick={() => void preview.refetch()}>
              {t.common.retry}
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={() => void onDone(null)}>
            {t.common.close}
          </Button>
        </div>
      </OnboardingLayout>
    )
  }

  const invite = preview.data

  if (invite.isMember) {
    return (
      <OnboardingLayout
        title={t.join.inviteTitle(invite.name)}
        subtitle={t.join.already}
        mascot
        showSignOut={false}
      >
        <Button fullWidth onClick={() => void accept()} disabled={busy}>
          {t.profile.next}
        </Button>
      </OnboardingLayout>
    )
  }

  // limiti spiegati prima di provare: 2 liste a testa, 5 persone per lista
  const blocked = !canAddList(listCount)
    ? t.join.limitInvite
    : !hasRoomForPeople(invite.memberCount)
      ? t.join.full
      : null
  if (blocked) {
    return (
      <OnboardingLayout
        title={t.join.inviteTitle(invite.name)}
        subtitle={blocked}
        mascot
        showSignOut={false}
      >
        <Button variant="secondary" fullWidth onClick={() => void onDone(null)}>
          {t.common.close}
        </Button>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout
      title={t.join.inviteTitle(invite.name)}
      subtitle={t.join.inviteSubtitle(invite.memberCount)}
      mascot
      showSignOut={false}
    >
      {error && (
        <p className="rounded-2xl bg-rust/10 px-4 py-3 text-sm font-bold text-rust" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={() => void accept()} disabled={busy}>
          {busy ? t.join.joining : t.join.submit}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => void onDone(null)} disabled={busy}>
          {t.join.decline}
        </Button>
      </div>
    </OnboardingLayout>
  )
}
