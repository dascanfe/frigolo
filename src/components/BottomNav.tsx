import { ChartColumn, LayoutGrid, Settings, ShoppingBasket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Lista', icon: ShoppingBasket, end: true },
  { to: '/catalogo', label: 'Catalogo', icon: LayoutGrid },
  { to: '/analitiche', label: 'Analitiche', icon: ChartColumn },
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings },
]

/**
 * Navigazione flottante in basso: pillola con effetto vetro, solo icone
 * (etichetta in aria-label), vicina al bordo sopra la safe area iOS.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigazione principale"
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
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
