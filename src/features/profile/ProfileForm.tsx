import { Camera, Check, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { it as t } from '@/i18n/it'
import { memberColor, memberColorName, onMemberColor } from '@/lib/colors'
import { MEMBER_COLOR_TOKENS } from '@/types/domain'
import type { MemberColorToken, Profile } from '@/types/domain'
import {
  AvatarFileError,
  avatarPublicUrl,
  removeAvatarFile,
  saveProfile,
  uploadAvatar,
} from './profileApi'

function isMemberColor(value: string | null): value is MemberColorToken {
  return (MEMBER_COLOR_TOKENS as readonly string[]).includes(value ?? '')
}

interface ProfileFormProps {
  userId: string
  initialName: string
  initialColor: string | null
  initialAvatarPath: string | null
  submitLabel: string
  onSaved: (profile: Profile) => void | Promise<void>
}

/**
 * Nome, foto e colore: uguali in tutte le liste. Lo usano l'onboarding
 * ("Come ti chiami?") e il pannello del profilo nelle Impostazioni.
 */
export function ProfileForm({
  userId,
  initialName,
  initialColor,
  initialAvatarPath,
  submitLabel,
  onSaved,
}: ProfileFormProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState<MemberColorToken>(
    isMemberColor(initialColor) ? initialColor : 'c-teal',
  )
  const [avatarPath, setAvatarPath] = useState<string | null>(initialAvatarPath)
  const avatarUrl = avatarPublicUrl(avatarPath)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const busy = uploading || saving

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const uploaded = await uploadAvatar(userId, file)
      // una foto caricata ora e subito sostituita non serve più
      if (avatarPath !== initialAvatarPath) void removeAvatarFile(userId, avatarPath)
      setAvatarPath(uploaded)
    } catch (uploadError) {
      setError(uploadError instanceof AvatarFileError ? t.profile.photoBad : t.profile.photoFailed)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError(t.profile.nameEmpty)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const profile = await saveProfile({ displayName: name, color, avatarPath })
      // la foto di prima (anche tornando alla mascotte) si toglie dal bucket
      if (initialAvatarPath !== avatarPath) void removeAvatarFile(userId, initialAvatarPath)
      await onSaved(profile)
    } catch {
      setError(t.profile.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar name={name || '?'} color={color} avatarUrl={avatarUrl} size={112} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            aria-label={avatarUrl ? t.profile.photoChange : t.profile.photoAdd}
            className="absolute -right-1 -bottom-1 flex size-11 items-center justify-center rounded-full bg-primary text-cream shadow-sheet ring-4 ring-elevated transition-transform active:scale-95 disabled:opacity-60"
          >
            <Camera size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="h-9 text-sm"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            {uploading
              ? t.profile.photoLoading
              : avatarUrl
                ? t.profile.photoChange
                : t.profile.photoAdd}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              icon={<RotateCcw size={16} aria-hidden="true" />}
              className="h-9 text-sm"
              onClick={() => {
                if (avatarPath !== initialAvatarPath) void removeAvatarFile(userId, avatarPath)
                setAvatarPath(null)
              }}
              disabled={busy}
            >
              {t.profile.photoRemove}
            </Button>
          )}
        </div>
        {!avatarUrl && <p className="text-center text-xs text-secondary">{t.profile.photoHint}</p>}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      <TextField
        label={t.profile.nameLabel}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setNameError(null)
        }}
        maxLength={40}
        placeholder={t.profile.namePlaceholder}
        hint={t.profile.nameHint}
        error={nameError}
        autoCapitalize="words"
        autoComplete="nickname"
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-bold text-primary">{t.profile.colorLabel}</legend>
        <p className="text-xs text-secondary">{t.profile.colorHint}</p>
        <div
          className="grid grid-cols-4 gap-3 pt-1"
          role="radiogroup"
          aria-label={t.profile.colorLabel}
        >
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
                className="relative flex justify-self-center rounded-full transition-transform active:scale-95"
                style={{
                  boxShadow: selected
                    ? `0 0 0 3px var(--bg-elevated), 0 0 0 5px ${memberColor(token)}`
                    : undefined,
                }}
              >
                {/* anteprima: la mascotte su questo colore */}
                <Avatar name={memberColorName(token)} color={token} size={56} />
                {selected && (
                  <span
                    className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full ring-2 ring-elevated"
                    style={{ backgroundColor: memberColor(token), color: onMemberColor(token) }}
                    aria-hidden="true"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
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

      <Button type="submit" fullWidth disabled={busy}>
        {saving ? t.profile.saving : submitLabel}
      </Button>
    </form>
  )
}
