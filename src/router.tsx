import { Navigate, createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { RouteError } from '@/components/ErrorBoundary'
import { ListScreen } from '@/features/list/ListScreen'
import { CatalogScreen } from '@/features/catalog/CatalogScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { InspirationScreen } from '@/features/inspiration/InspirationScreen'
import { IconPreviewScreen } from '@/features/dev/IconPreviewScreen'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    // errore nella cornice stessa (barra, intestazioni): schermata intera
    errorElement: <RouteError fullScreen />,
    children: [
      {
        // errore in una schermata: la testata resta, si può tornare alla lista
        errorElement: <RouteError />,
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
          { path: 'ispirazioni', element: <InspirationScreen /> },
          // solo in sviluppo: anteprima delle icone custom
          ...(import.meta.env.DEV ? [{ path: 'dev/icone', element: <IconPreviewScreen /> }] : []),
          // i link d'invito li legge main.tsx prima del router (captureInviteFromUrl):
          // qui si torna alla lista, come per ogni indirizzo che non esiste
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
