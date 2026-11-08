import { ChevronDown, Copy, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useEffectEvent } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/Button'
import { it as t } from '@/i18n/it'
import { toast } from '@/lib/toast'
import { recordEvent } from '@/lib/telemetry'

interface IosInstallGuideProps {
  open: boolean
  onClose: () => void
  /** false = iPhone con un browser che non è Safari: si spiega di aprirlo con Safari */
  safari: boolean
}

function Step({ n, children, visual }: { n: number; children: ReactNode; visual: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-[color:var(--on-accent)]">
        {n}
      </span>
      <p className="min-w-0 flex-1 text-sm text-primary">{children}</p>
      <span aria-hidden="true">{visual}</span>
    </li>
  )
}

/**
 * Guida a tre passaggi per aggiungere Frigolo alla schermata Home da Safari
 * su iPhone. In basso un indicatore animato punta verso il bottone Condividi
 * della barra di Safari (il layout viewport finisce proprio sopra la barra).
 * Non si fissa il body: è un overlay a sé, come i pannelli.
 */
export function IosInstallGuide({ open, onClose, safari }: IosInstallGuideProps) {
  const close = useEffectEvent(() => onClose())

  useEffect(() => {
    if (!open) return
    // metriche anonime: guida iPhone aperta
    recordEvent('install_guida_ios')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      toast(t.installGuide.copied, 'success')
    } catch {
      toast(t.installGuide.copyFailed, 'error')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col touch-none bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label={safari ? t.installGuide.title : t.installGuide.titleOther}
      onClick={onClose}
    >
      <div className="flex flex-1 touch-auto items-center justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(var(--safe-top)+16px)]">
        <div
          className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-tile ring-1 ring-subtle"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-start gap-3">
            <img
              src="/mascot-avatar.webp"
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-primary">
                {safari ? t.installGuide.title : t.installGuide.titleOther}
              </h2>
              {safari && <p className="text-sm text-secondary">{t.installGuide.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.installGuide.close}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-secondary active:bg-sand/40"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {safari ? (
            <ol className="flex flex-col gap-3.5">
              <Step
                n={1}
                visual={
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-elevated text-accent ring-1 ring-subtle">
                    <Share size={22} aria-hidden="true" />
                  </span>
                }
              >
                {t.installGuide.step1}
              </Step>
              <Step
                n={2}
                visual={
                  <span className="flex h-11 items-center gap-1.5 rounded-2xl bg-elevated px-2.5 text-[11px] font-bold text-primary ring-1 ring-subtle">
                    <SquarePlus size={18} aria-hidden="true" />
                    Home
                  </span>
                }
              >
                {t.installGuide.step2}
              </Step>
              <Step
                n={3}
                visual={
                  <span className="flex h-11 items-center rounded-2xl bg-elevated px-3 text-sm font-bold text-accent ring-1 ring-subtle">
                    {t.installGuide.addShort}
                  </span>
                }
              >
                {t.installGuide.step3}
              </Step>
            </ol>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-primary">{t.installGuide.notSafari}</p>
              <Button
                variant="secondary"
                icon={<Copy size={18} aria-hidden="true" />}
                onClick={() => void copyLink()}
              >
                {t.installGuide.copyLink}
              </Button>
            </div>
          )}
        </div>
      </div>

      {safari ? (
        <div
          className="pointer-events-none flex flex-col items-center gap-1 pb-[max(8px,var(--safe-bottom))] text-white"
          aria-hidden="true"
        >
          <span className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-black text-[color:var(--on-accent)] shadow-tile">
            {t.installGuide.pointer}
          </span>
          <ChevronDown size={44} strokeWidth={3} className="install-pointer drop-shadow-md" />
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>,
    document.body,
  )
}
