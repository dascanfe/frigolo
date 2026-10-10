import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
