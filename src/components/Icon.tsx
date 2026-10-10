import { createElement } from 'react'
import type { LucideProps } from 'lucide-react'
import { getIcon } from '@/lib/icons'

interface IconProps extends Omit<LucideProps, 'name'> {
  /** Nome del componente lucide, come salvato nel DB (fallback se sconosciuto) */
  name: string | null | undefined
}

/** Icona di prodotto o categoria risolta per nome */
export function Icon({ name, ...props }: IconProps) {
  return createElement(getIcon(name), props)
}
