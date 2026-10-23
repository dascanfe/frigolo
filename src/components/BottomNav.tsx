import { ChartColumn, LayoutGrid, Settings, ShoppingBasket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { it as t } from '@/i18n/it'
import { useKeyboardOpen } from '@/lib/useKeyboardOpen'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: t.nav.list, icon: ShoppingBasket, end: true },
  { to: '/catalogo', label: t.nav.catalog, icon: LayoutGrid },
  { to: '/analitiche', label: t.nav.analytics, icon: ChartColumn },
  { to: '/impostazioni', label: t.nav.settings, icon: Settings },
]

/**
 * Navigazione flottante in basso: pillola con effetto vetro, solo icone
 * (etichetta in aria-label), vicina al bordo sopra la safe area iOS.
 * Sempre fissa; nascosta mentre si scrive.
 */
export function BottomNav() {
  // con la tastiera aperta la barra sparisce: su iOS la tastiera sposta il
  // viewport visivo e una barra fissa in basso salirebbe con il contenuto
  const keyboardOpen = useKeyboardOpen()
  return (
    <nav
      aria-label={t.nav.label}
      aria-hidden={keyboardOpen || undefined}
      inert={keyboardOpen}
      className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 transition-[opacity,translate] duration-150 ${
        keyboardOpen ? 'invisible translate-y-4 opacity-0' : ''
      }`}
      style={{ bottom: 'calc(var(--nav-gap) + var(--safe-bottom))' }}
    >
      <ul
        className="glass pointer-events-auto flex w-full max-w-xs items-stretch rounded-full p-1.5"
        style={{ height: 'var(--nav-height)' }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              title={label}
              className={({ isActive }) =>
                [
                  'flex h-full min-h-11 items-center justify-center rounded-full transition-colors duration-150',
                  isActive ? 'bg-accent text-cream shadow-tile' : 'text-secondary',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <Icon size={24} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
