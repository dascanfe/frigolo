/** Schermata di attesa mentre sessione e household vengono caricati */
export function Splash({ message = 'Un attimo...' }: { message?: string }) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-app"
      role="status"
      aria-live="polite"
    >
      <img
        src="/mascot.png"
        alt=""
        width={112}
        height={112}
        className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
        draggable={false}
      />
      <h1 className="font-display text-3xl font-bold text-primary">Frigolo</h1>
      <p className="text-sm text-secondary">{message}</p>
    </main>
  )
}
