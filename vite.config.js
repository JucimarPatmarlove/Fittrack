import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    process.env.ANALYZE === 'true' && visualizer({ open: true, filename: 'dist/stats.html' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'FitTrack V7',
        short_name: 'FitTrack',
        description: 'Treino inteligente com gamificação e IA',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#080b0f',
        background_color: '#080b0f',
        icons: [
          { src: '/icons/icon-72x72.png',        sizes: '72x72',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-96x96.png',         sizes: '96x96',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-128x128.png',       sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-144x144.png',       sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-152x152.png',       sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192x192.png',       sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png',       sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png',       sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/apple-touch-icon.png',   sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        runtimeCaching: [
          {
            // Cache de Fontes do Google (Descarrega uma vez e guarda no cofre)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano de retenção
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de Fontes Estáticas (gstatic)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Estratégia de sobrevivência para eventuais APIs estáticas de imagens ou dados
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'visual-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          }
        ]
      },
      devOptions: { enabled: true },
    }),
  ],

  optimizeDeps: {
    exclude: ['@capacitor-community/health-kit']
  },

  build: {
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      // Plugins nativos Capacitor: só existem no runtime iOS/Android, não no bundle web
      external: ['@capacitor-community/health-kit'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'vendor-3d';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/framer-motion')) return 'vendor-charts';
          if (id.includes('node_modules/idb-keyval') || id.includes('node_modules/zod')) return 'vendor-crypto';
        }
      },
    },
  },

  server: {
    https: true,
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
