import { Check, Home, KeyRound, LogOut } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { AVATAR_PRESETS } from '@/lib/avatars'
import { memberColor, memberColorName, onMemberColor } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { MEMBER_COLOR_TOKENS } from '@/types/domain'
import type { MemberColorToken } from '@/types/domain'
import { signOut } from './useSession'
import { useInvalidateHousehold } from './useHousehold'

interface OnboardingScreenProps {
  userId: string
  email: string | undefined
}

type Mode = 'create' | 'join'

function suggestedName(email: string | undefined): string {
  const local = email?.split('@')[0] ?? ''
  if (!local) return ''
  return local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]+/g, ' ')
}

/** Primo accesso: crea l'household o entra in quello del partner con il codice */
export function OnboardingScreen({ userId, email }: OnboardingScreenProps) {
  const invalidate = useInvalidateHousehold()
  const [mode, setMode] = useState<Mode>('create')
  const [displayName, setDisplayName] = useState(() => suggestedName(email))
  const [color, setColor] = useState<MemberColorToken>('c-teal')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState('Casa')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const args = { p_display_name: displayName.trim(), p_color: color }
    const { data: householdId, error: rpcError } =
      mode === 'create'
        ? await supabase.rpc('create_household', {
            p_name: householdName.trim() || 'Casa',
            ...args,
          })
        : await supabase.rpc('join_household', { p_code: joinCode.trim().toUpperCase(), ...args })

    if (rpcError || !householdId) {
      setBusy(false)
      setError(translateRpcError(rpcError?.message))
      return
    }

    if (avatar) {
      // l'avatar non passa dall'RPC: la policy permette di aggiornare la propria riga
      await supabase
        .from('household_members')
        .update({ avatar_url: avatar })
        .eq('household_id', householdId)
        .eq('user_id', userId)
    }

    await invalidate(userId)
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-safe pt-10">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-secondary">Benvenuto</p>
        <h1 className="font-display text-3xl font-bold text-primary">Prepariamo la casa</h1>
        <p className="text-secondary">
          La lista è condivisa tra chi vive nella stessa casa. Crea tu la casa oppure entra in
          quella del partner con il codice.
        </p>
      </header>

      <div
        className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 ring-1 ring-subtle"
        role="tablist"
      >
        {(
          [
            { id: 'create', label: 'Crea la casa', icon: Home },
            { id: 'join', label: 'Ho un codice', icon: KeyRound },
          ] as const
        ).map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={[
              'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors',
              mode === id ? 'bg-primary text-cream' : 'text-secondary',
            ].join(' ')}
          >
            <TabIcon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {mode === 'create' ? (
          <TextField
            label="Nome della casa"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            maxLength={60}
            placeholder="Casa"
            autoComplete="off"
          />
        ) : (
          <TextField
            label="Codice della casa"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={8}
            placeholder="ABCD2345"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            hint="Lo trovi nelle Impostazioni del partner."
            className="text-center text-xl font-black tracking-[0.25em]"
          />
        )}

        <TextField
          label="Il tuo nome"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
          placeholder="Come ti chiama il partner"
          autoComplete="nickname"
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold text-primary">Il tuo colore</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Il tuo colore">
            {MEMBER_COLOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={color === token}
                aria-label={memberColorName(token)}
                onClick={() => setColor(token)}
                className="flex size-11 items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  backgroundColor: memberColor(token),
                  color: onMemberColor(token),
                  outline: color === token ? '3px solid var(--text-primary)' : undefined,
                  outlineOffset: 2,
                }}
              >
                {color === token && <Check size={20} strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold text-primary">Il tuo avatar</legend>
          <div className="flex gap-3" role="radiogroup" aria-label="Il tuo avatar">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={avatar === preset.url}
                onClick={() => setAvatar(avatar === preset.url ? null : preset.url)}
                className="flex flex-col items-center gap-1 rounded-2xl p-2 transition-colors"
                style={{ backgroundColor: avatar === preset.url ? 'var(--c-sand)' : undefined }}
              >
                <Avatar name={preset.label} color={color} avatarUrl={preset.url} size={56} />
                <span className="text-xs font-bold text-secondary">{preset.label}</span>
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={avatar === null}
              onClick={() => setAvatar(null)}
              className="flex flex-col items-center gap-1 rounded-2xl p-2 transition-colors"
              style={{ backgroundColor: avatar === null ? 'var(--c-sand)' : undefined }}
            >
              <Avatar name={displayName || '?'} color={color} size={56} />
              <span className="text-xs font-bold text-secondary">Iniziale</span>
            </button>
          </div>
        </fieldset>

        {error && (
          <p className="rounded-2xl bg-rust/10 px-4 py-3 text-sm font-bold text-rust" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={busy || !displayName.trim() || (mode === 'join' && joinCode.length < 8)}
        >
          {busy ? 'Un attimo...' : mode === 'create' ? 'Crea la casa' : 'Entra nella casa'}
        </Button>
      </form>

      <div className="mt-auto flex justify-center pb-4">
        <Button
          variant="ghost"
          icon={<LogOut size={18} aria-hidden="true" />}
          onClick={() => signOut()}
        >
          Esci
        </Button>
      </div>
    </main>
  )
}

/** I messaggi delle RPC sono già in italiano: qui solo i casi tecnici */
function translateRpcError(message: string | undefined): string {
  if (!message) return 'Qualcosa è andato storto. Riprova.'
  if (message.includes('fetch') || message.toLowerCase().includes('network')) {
    return 'Nessuna connessione. Controlla la rete e riprova.'
  }
  return message
}
