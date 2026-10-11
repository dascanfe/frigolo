import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { it as t } from '@/i18n/it'
import { createList, describeListError } from './useLists'

interface CreateListFormProps {
  /** Nome proposto all'apertura */
  initialName?: string
  onCreated: (householdId: string, name: string) => void | Promise<void>
  onCancel?: () => void
  cancelLabel?: string
}

/** Nome della lista con gli esempi da toccare, poi "Crea la lista" */
export function CreateListForm({
  initialName = t.lists.nameDefault,
  onCreated,
  onCancel,
  cancelLabel = t.common.cancel,
}: CreateListFormProps) {
  const [name, setName] = useState(initialName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError(t.lists.nameEmpty)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const id = await createList(clean)
      await onCreated(id, clean)
    } catch (createError) {
      const message = describeListError(createError)
      setError(message === t.lists.actionFailed ? t.lists.createFailed : message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t.lists.nameLabel}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        maxLength={60}
        placeholder={t.lists.nameDefault}
        hint={t.lists.nameHint}
        error={error}
        autoCapitalize="sentences"
        autoComplete="off"
      />
      <div className="chip-row -mx-1 px-1" role="group" aria-label="Esempi di nomi">
        {t.lists.nameExamples.map((example) => (
          <button
            key={example}
            type="button"
            className="chip h-10 shrink-0 px-4"
            aria-pressed={name.trim() === example}
            onClick={() => {
              setName(example)
              setError(null)
            }}
          >
            {example}
          </button>
        ))}
      </div>
      <Button type="submit" fullWidth disabled={busy}>
        {busy ? t.lists.creating : t.lists.create}
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
