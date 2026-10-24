import { Button } from '@/components/Button'
import { it as t } from '@/i18n/it'

interface CrashScreenProps {
  /** Occupa tutto lo schermo (errore fuori dalle schermate); altrimenti sta sopra la barra in basso */
  fullScreen?: boolean
}

/**
 * Schermata di cortesia quando un componente lancia durante il render: al
 * posto dello schermo bianco. Non usa router, query né contesti (può comparire
 * anche se quelli sono rotti), quindi i due bottoni ricaricano la pagina.
 */
export function CrashScreen({ fullScreen = false }: CrashScreenProps) {
  return (
    <main
      className={`flex flex-col items-center justify-center gap-3 bg-app px-8 text-center ${
        fullScreen ? 'min-h-dvh' : 'min-h-[70dvh]'
      }`}
      role="alert"
    >
      <img
        src="/mascot-sad.webp"
        alt=""
        width={112}
        height={112}
        className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
        draggable={false}
      />
      <h1 className="font-display text-3xl font-bold text-primary">{t.crash.title}</h1>
      <p className="max-w-xs text-sm text-secondary">{t.crash.text}</p>
      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={() => window.location.reload()}>{t.crash.reload}</Button>
        <Button variant="ghost" onClick={() => window.location.assign('/')}>
          {t.crash.home}
        </Button>
      </div>
    </main>
  )
}
