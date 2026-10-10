import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { it as t } from '@/i18n/it'
import { isCompleteInviteCode, isInviteToken, normalizeInviteCode, parseInvite } from './inviteCode'
import { describeListError, getInvite, joinList } from './useLists'

export interface JoinResult {
  householdId: string
  name: string
  /** Era già una delle sue liste */
  already: boolean
}

interface JoinFormProps {
  onJoined: (result: JoinResult) => void | Promise<void>
  /** "Non ho un codice": torna indietro (onboarding) */
  onCancel?: () => void
  cancelLabel?: string
}

/** "Entra in una lista": codice d'invito scritto a mano o link incollato */
export function JoinForm({ onJoined, onCancel, cancelLabel = t.join.noCode }: JoinFormProps) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** invite: codice corto o token di un link incollato */
  async function join(invite: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const preview = await getInvite(invite)
      const householdId = preview ? await joinList(invite) : null
      if (!preview || !householdId) {
        setError(isInviteToken(invite) ? t.join.badLink : t.join.badCode)
        return
      }
      await onJoined({ householdId, name: preview.name, already: preview.isMember })
    } catch (joinError) {
      setError(describeListError(joinError))
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isCompleteInviteCode(code)) void join(code)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t.join.codeLabel}
        value={code}
        onChange={(e) => {
          setCode(normalizeInviteCode(e.target.value))
          setError(null)
        }}
        onPaste={(e) => {
          // incollando il link intero: il token del link si usa subito
          const pasted = e.clipboardData.getData('text')
          if (!pasted.includes('/invito/')) return
          e.preventDefault()
          const invite = parseInvite(pasted)
          if (invite && isInviteToken(invite)) void join(invite)
          else setCode(normalizeInviteCode(invite ?? ''))
        }}
        placeholder={t.join.codePlaceholder}
        hint={t.join.codeHint}
        error={error}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        className="text-center text-xl font-black tracking-[0.25em]"
      />
      <Button type="submit" fullWidth disabled={busy || !isCompleteInviteCode(code)}>
        {busy ? t.join.joining : t.join.submit}
      </Button>
      {onCancel && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
        </div>
      )}
    </form>
  )
}
