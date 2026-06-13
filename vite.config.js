import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,mp4,webm}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB limit para vídeos curtos
        runtimeCaching: [
          {
            urlPattern: /\.(mp4|webm|mov)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(mp4|webm)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-video-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
        skipWaiting: false,
        clientsClaim: true,
      },
      devOptions: { enabled: true },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/@mediapipe') ||
            id.includes('node_modules/@tensorflow')
          ) {
            return 'vendor-ml';
          }
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three') ||
            id.includes('node_modules/@threlte')
          ) {
            return 'vendor-3d';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-is/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory-') ||
            id.includes('node_modules/lodash')
          ) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/zod')) {
            return 'vendor-zod';
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }
          if (id.includes('node_modules/idb')) {
            return 'vendor-idb';
          }
          if (id.includes('node_modules/dompurify')) {
            return 'vendor-security';
          }
          if (
            id.includes('node_modules/@anthropic-ai') ||
            id.includes('node_modules/anthropic')
          ) {
            return 'vendor-anthropic';
          }
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
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
