import { Hammer } from 'lucide-react'

interface ComingSoonProps {
  title: string
  phase: number
}

/** Placeholder temporaneo per le schermate delle fasi successive */
export function ComingSoon({ title, phase }: ComingSoonProps) {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Hammer size={40} strokeWidth={1.5} className="text-secondary" aria-hidden="true" />
      <h1 className="font-display text-3xl font-bold text-primary">{title}</h1>
      <p className="text-secondary">In arrivo nella Fase {phase}.</p>
    </main>
  )
}
