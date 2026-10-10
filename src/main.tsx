import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font in locale (niente richieste a Google): solo i sottoinsiemi latini e i pesi usati
import '@fontsource/lato/latin-400.css'
import '@fontsource/lato/latin-700.css'
import '@fontsource/lato/latin-900.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-700-italic.css'
import '@/styles/global.css'
import App from '@/App'
import { setupInstallPrompt, setupServiceWorker } from '@/lib/pwa'
import { applyStoredTheme } from '@/lib/theme'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento #root non trovato in index.html')
}

applyStoredTheme()
setupServiceWorker()
setupInstallPrompt()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
