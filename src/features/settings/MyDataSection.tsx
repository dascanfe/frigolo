import { Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { SectionHeader } from '@/components/SectionHeader'
import { TextField } from '@/components/TextField'
import { signOut } from '@/features/auth/useSession'
import { it as t } from '@/i18n/it'
import { describeDbError } from '@/lib/dbErrors'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

/** Salva un oggetto come file JSON sul dispositivo */
function saveJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Impostazioni > "I tuoi dati": scarica i dati ed elimina l'account (issue #9) */
export function MyDataSection() {
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function exportData() {
    setExporting(true)
    try {
      const { data, error } = await supabase.rpc('export_my_data')
      if (error) throw error
      const day = new Date().toISOString().slice(0, 10)
      saveJson(data, `frigolo-dati-${day}.json`)
      toast(t.myData.downloaded, 'success')
    } catch (exportError) {
      toast(describeDbError(exportError, t.myData.downloadFailed), 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <SectionHeader title={t.myData.section} />
      <div className="mx-4 flex flex-col gap-3 rounded-3xl bg-surface p-4 text-sm ring-1 ring-subtle">
        <p className="text-secondary">{t.myData.intro}</p>
        <Button
          variant="secondary"
          fullWidth
          icon={<Download size={18} aria-hidden="true" />}
          onClick={() => void exportData()}
          disabled={exporting}
        >
          {exporting ? t.myData.downloading : t.myData.download}
        </Button>
        <Button
          variant="danger"
          fullWidth
          icon={<Trash2 size={18} aria-hidden="true" />}
          onClick={() => setDeleteOpen(true)}
        >
          {t.myData.deleteAccount}
        </Button>
      </div>
      <BottomSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t.myData.deleteTitle}
      >
        {deleteOpen && <DeleteAccountSteps onCancel={() => setDeleteOpen(false)} />}
      </BottomSheet>
    </>
  )
}

/** Doppia conferma: prima la spiegazione, poi la parola da scrivere */
function DeleteAccountSteps({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = word.trim().toUpperCase() === t.myData.deleteWord

  async function deleteAccount() {
    if (!ready) return
    setBusy(true)
    setError(null)
    const { error: invokeError } = await supabase.functions.invoke('delete-account', {
      body: { confirm: t.myData.deleteWord },
    })
    if (invokeError) {
      setBusy(false)
      setError(t.myData.deleteFailed)
      return
    }
    toast(t.myData.deleted, 'success', 5000)
    // l'account non c'è più: si esce e si pulisce il dispositivo
    await signOut()
  }

  if (step === 1) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-primary">{t.myData.deleteStep1}</p>
        <div className="flex flex-col gap-2">
          <Button variant="danger" fullWidth onClick={() => setStep(2)}>
            {t.myData.deleteContinue}
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 pb-2"
      onSubmit={(event) => {
        event.preventDefault()
        void deleteAccount()
      }}
    >
      <p className="text-primary">{t.myData.deleteStep2}</p>
      <TextField
        label={t.myData.deleteFieldLabel}
        value={word}
        onChange={(e) => setWord(e.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        error={error}
      />
      <div className="flex flex-col gap-2">
        <Button type="submit" variant="danger" fullWidth disabled={!ready || busy}>
          {busy ? t.myData.deleting : t.myData.deleteConfirm}
        </Button>
        <Button variant="ghost" fullWidth onClick={onCancel} disabled={busy}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  )
}
