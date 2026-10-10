import { Camera, Check, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { memberColor, memberColorName, onMemberColor } from '@/lib/colors'
import { toast } from '@/lib/toast'
import { MEMBER_COLOR_TOKENS } from '@/types/domain'
import type { MemberColorToken } from '@/types/domain'
import { useSettingsMutations } from './useSettingsMutations'

interface ProfileSheetProps {
  open: boolean
  onClose: () => void
}

/** Profilo: nome visualizzato, foto (solo la propria) e colore dell'anello */
export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Il tuo profilo">
      {open && <ProfileForm onClose={onClose} />}
    </BottomSheet>
  )
}

function isMemberColor(value: string | null): value is MemberColorToken {
  return (MEMBER_COLOR_TOKENS as readonly string[]).includes(value ?? '')
}

function ProfileForm({ onClose }: { onClose: () => void }) {
  const { me } = useHousehold()
  const { updateProfile, uploadAvatar } = useSettingsMutations()
  const fileInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(memberName(me, ''))
  const [color, setColor] = useState<MemberColorToken>(
    isMemberColor(me.color) ? me.color : 'c-teal',
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatar_url)
  const [error, setError] = useState<string | null>(null)

  const busy = updateProfile.isPending || uploadAvatar.isPending

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      setAvatarUrl(await uploadAvatar.mutateAsync(file))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Caricamento non riuscito')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await updateProfile.mutateAsync({ display_name: name.trim(), color, avatar_url: avatarUrl })
      toast('Profilo aggiornato', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Salvataggio non riuscito')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-2">
      {/* Foto: solo la propria, con il bottone fotocamera sovrapposto */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar name={name || '?'} color={color} avatarUrl={avatarUrl} size={112} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            aria-label="Cambia foto"
            className="absolute -right-1 -bottom-1 flex size-11 items-center justify-center rounded-full bg-primary text-cream shadow-sheet ring-4 ring-elevated transition-transform active:scale-95 disabled:opacity-60"
          >
            <Camera size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-secondary">
          {uploadAvatar.isPending ? 'Carico la foto...' : 'Tocca la fotocamera per cambiare foto'}
        </p>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            icon={<Trash2 size={16} aria-hidden="true" />}
            className="h-9 text-sm"
            onClick={() => setAvatarUrl(null)}
          >
            Usa solo l&apos;iniziale
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      <TextField
        label="Nome visualizzato"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        required
        autoCapitalize="words"
        autoComplete="nickname"
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-bold text-primary">Colore dell&apos;anello</legend>
        <div className="flex flex-wrap gap-3 pt-1" role="radiogroup" aria-label="Colore">
          {MEMBER_COLOR_TOKENS.map((token) => {
            const selected = color === token
            return (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={memberColorName(token)}
                onClick={() => setColor(token)}
                className="flex size-10 items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  backgroundColor: memberColor(token),
                  color: onMemberColor(token),
                  boxShadow: selected
                    ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${memberColor(token)}`
                    : undefined,
                }}
              >
                {selected && <Check size={18} strokeWidth={3} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-2xl bg-rust/10 px-4 py-3 text-sm font-bold text-rust" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth disabled={busy || !name.trim()}>
        {updateProfile.isPending ? 'Salvo...' : 'Salva'}
      </Button>
    </form>
  )
}
