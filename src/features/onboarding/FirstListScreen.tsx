import { ChevronRight, KeyRound, User, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { CreateListForm } from '@/features/lists/CreateListForm'
import { InvitePanel } from '@/features/lists/InvitePanel'
import { JoinForm } from '@/features/lists/JoinForm'
import { it as t } from '@/i18n/it'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import type { Household } from '@/types/domain'
import { OnboardingLayout } from './OnboardingLayout'

type Step =
  | { kind: 'choose' }
  | { kind: 'name'; shared: boolean }
  | { kind: 'invite'; household: Household }
  | { kind: 'join' }

interface FirstListScreenProps {
  /** Il percorso è partito: la schermata resta anche quando la lista esiste già */
  onStart: () => void
  /** Fine: apre la lista */
  onDone: (householdId: string) => void | Promise<void>
}

/** "La tua prima lista": per conto mio, con altre persone, ho un codice */
export function FirstListScreen({ onStart, onDone }: FirstListScreenProps) {
  const [step, setStep] = useState<Step>({ kind: 'choose' })

  if (step.kind === 'name') {
    return (
      <OnboardingLayout title={t.firstList.title} subtitle={t.firstList.nameSubtitle}>
        <CreateListForm
          onCreated={async (id) => {
            if (!step.shared) {
              await onDone(id)
              return
            }
            const { data } = await supabase.from('households').select('*').eq('id', id).single()
            if (data) setStep({ kind: 'invite', household: data })
            else await onDone(id)
          }}
          onCancel={() => setStep({ kind: 'choose' })}
          cancelLabel={t.common.cancel}
        />
      </OnboardingLayout>
    )
  }

  if (step.kind === 'invite') {
    const { household } = step
    return (
      <OnboardingLayout
        title={t.invite.title}
        subtitle={t.invite.subtitle(household.name)}
        showSignOut={false}
      >
        <InvitePanel
          household={household}
          peopleCount={1}
          onRotated={async () => {
            const { data } = await supabase
              .from('households')
              .select('*')
              .eq('id', household.id)
              .single()
            if (data) setStep({ kind: 'invite', household: data })
          }}
        />
        <div className="mt-auto flex justify-center pb-6">
          <Button variant="ghost" onClick={() => void onDone(household.id)}>
            {t.invite.later}
          </Button>
        </div>
      </OnboardingLayout>
    )
  }

  if (step.kind === 'join') {
    return (
      <OnboardingLayout title={t.join.title} subtitle={t.join.subtitle}>
        <JoinForm
          onJoined={async ({ householdId, name }) => {
            await onDone(householdId)
            toast(t.join.joined(name), 'success')
          }}
          onCancel={() => setStep({ kind: 'choose' })}
        />
      </OnboardingLayout>
    )
  }

  const choices = [
    {
      id: 'solo',
      label: t.firstList.solo,
      hint: t.firstList.soloHint,
      icon: User,
      next: () => setStep({ kind: 'name', shared: false }),
    },
    {
      id: 'shared',
      label: t.firstList.shared,
      hint: t.firstList.sharedHint,
      icon: Users,
      next: () => {
        onStart()
        setStep({ kind: 'name', shared: true })
      },
    },
    {
      id: 'code',
      label: t.firstList.code,
      hint: t.firstList.codeHint,
      icon: KeyRound,
      next: () => setStep({ kind: 'join' }),
    },
  ] as const

  return (
    <OnboardingLayout title={t.firstList.title} subtitle={t.firstList.subtitle} mascot>
      <ul className="flex flex-col gap-3">
        {choices.map(({ id, label, hint, icon: ChoiceIcon, next }) => (
          <li key={id}>
            <button
              type="button"
              onClick={next}
              className="flex w-full items-center gap-4 rounded-3xl bg-surface px-4 py-4 text-left ring-1 ring-subtle transition-transform active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-cream">
                <ChoiceIcon size={22} aria-hidden="true" />
              </span>
              <span className="flex flex-1 flex-col leading-tight">
                <span className="font-bold text-primary">{label}</span>
                <span className="text-sm text-secondary">{hint}</span>
              </span>
              <ChevronRight size={20} className="text-secondary" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </OnboardingLayout>
  )
}
