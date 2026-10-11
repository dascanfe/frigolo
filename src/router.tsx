import { Navigate, createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { ListScreen } from '@/features/list/ListScreen'
import { CatalogScreen } from '@/features/catalog/CatalogScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { IconPreviewScreen } from '@/features/dev/IconPreviewScreen'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ListScreen /> },
      { path: 'catalogo', element: <CatalogScreen /> },
      {
        path: 'analitiche',
        // Recharts pesa: si carica solo quando serve
        lazy: async () => ({
          Component: (await import('@/features/analytics/AnalyticsScreen')).AnalyticsScreen,
        }),
      },
      { path: 'impostazioni', element: <SettingsScreen /> },
      // solo in sviluppo: anteprima delle icone custom
      ...(import.meta.env.DEV ? [{ path: 'dev/icone', element: <IconPreviewScreen /> }] : []),
      // i link d'invito li legge main.tsx prima del router (captureInviteFromUrl):
      // qui si torna alla lista, come per ogni indirizzo che non esiste
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
