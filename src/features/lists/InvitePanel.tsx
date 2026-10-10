import { Check, Link2, RefreshCw, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { appHost, it as t } from '@/i18n/it'
import { toast } from '@/lib/toast'
import type { Household } from '@/types/domain'
import { inviteLink } from './inviteCode'
import { describeListError, rotateInviteCode } from './useLists'

interface InvitePanelProps {
  household: Pick<
    Household,
    | 'id'
    | 'name'
    | 'join_code'
    | 'join_code_expires_at'
    | 'invite_token'
    | 'invite_token_expires_at'
  >
  /** Dopo "Nuovo codice": ricaricare la lista per vedere il codice nuovo */
  onRotated: () => void | Promise<void>
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Invito in una lista: "Manda l'invito" apre la condivisione del telefono con
 * il messaggio di Zenzero; dove non c'è, il messaggio va negli appunti.
 * Sotto, il codice da dettare e "Nuovo codice" (con conferma).
 */
export function InvitePanel({ household, onRotated }: InvitePanelProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [rotating, setRotating] = useState(false)
  // l'ora in cui il pannello si apre basta per decidere se l'invito è scaduto
  const [openedAt] = useState(() => Date.now())

  const link = inviteLink(window.location.origin, household.invite_token)
  // codice e link scadono insieme (7 giorni); vale la scadenza più vicina
  const expiresAt = new Date(
    Math.min(
      Date.parse(household.join_code_expires_at),
      Date.parse(household.invite_token_expires_at),
    ),
  )
  const expired = expiresAt.getTime() <= openedAt
  const expiresLabel = expiresAt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  const message = t.invite.message(household.name, link, appHost(), household.join_code)

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: t.invite.shareTitle(household.name), text: message })
        return
      } catch (shareError) {
        // chiusa senza scegliere: va bene così
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      }
    }
    if (await copyText(message)) toast(t.invite.messageCopied, 'success')
  }

  async function copyLink() {
    if (!(await copyText(link))) return
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 2000)
  }

  async function rotate() {
    setRotating(true)
    try {
      await rotateInviteCode(household.id)
      await onRotated()
      toast(t.invite.newCodeDone, 'success')
      setConfirmRotate(false)
    } catch (rotateError) {
      toast(describeListError(rotateError), 'error')
    } finally {
      setRotating(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {expired ? (
        <p className="rounded-2xl bg-sand/50 px-4 py-3 text-sm text-primary" role="status">
          {t.invite.expired}
        </p>
      ) : (
        <>
          <Button
            fullWidth
            icon={<Send size={18} aria-hidden="true" />}
            onClick={() => void share()}
          >
            {t.invite.share}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            icon={
              linkCopied ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Link2 size={18} aria-hidden="true" />
              )
            }
            onClick={() => void copyLink()}
          >
            {linkCopied ? t.invite.linkCopied : t.invite.copyLink}
          </Button>

          <div className="mt-1 flex flex-col items-center gap-1 rounded-2xl bg-app px-4 py-3 text-center ring-1 ring-subtle">
            <p className="text-sm text-secondary">{t.invite.orCode}</p>
            <p
              className="font-body text-3xl font-black tracking-[0.2em] text-accent tabular-nums"
              aria-label={household.join_code.split('').join(' ')}
            >
              {household.join_code}
            </p>
            <p className="text-xs text-secondary">{t.invite.codeHint}</p>
          </div>

          <p className="text-center text-xs text-secondary">{t.invite.validUntil(expiresLabel)}</p>
        </>
      )}

      {confirmRotate ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-sand/40 p-3" role="alertdialog">
          <p className="text-sm text-primary">{t.invite.newCodeConfirm}</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmRotate(false)}
              disabled={rotating}
            >
              {t.common.cancel}
            </Button>
            <Button className="flex-1" onClick={() => void rotate()} disabled={rotating}>
              {rotating ? t.common.wait : t.invite.newCodeButton}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="h-10 text-sm"
            icon={<RefreshCw size={16} aria-hidden="true" />}
            onClick={() => setConfirmRotate(true)}
          >
            {t.invite.newCode}
          </Button>
        </div>
      )}
    </div>
  )
}
