import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

const ONE_WEEK = 7 * 24 * 60 * 60

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": il plugin non ricarica mai la pagina da solo (lo fa pwa.ts, e solo quando
      // l'app e' in background); il nuovo service worker si attiva comunque da solo (skipWaiting)
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'mascot.png', 'mascot-avatar.webp', 'mascot-sad.webp', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'Frigolo',
        short_name: 'Frigolo',
        description: 'La lista della spesa condivisa',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#DB6A2E',
        background_color: '#F4ECE2',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // app shell precachata; le splash iOS restano fuori (pesano e servono solo all'installazione)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/splash/*', '**/og-image.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // il nuovo worker si attiva appena installato e prende il controllo: alla riapertura
        // successiva tutti hanno la versione nuova, senza azioni
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // letture Supabase (tabelle e RPC in GET): rete prima, cache se manca
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/.*/i,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 200, maxAgeSeconds: ONE_WEEK },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
})
