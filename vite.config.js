import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'data/*.geojson'],
      manifest: {
        name: 'TribalWeather',
        short_name: 'TribalWeather',
        description: 'Real-time weather alerts for Pacific Northwest Tribal communities',
        theme_color: '#4A90D9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,geojson}'],
        runtimeCaching: [
          {
            urlPattern: new RegExp('^https://[a-c]\.tile\.openstreetmap\.org/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: new RegExp('^https://mesonet\.agron\.iastate\.edu/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'satellite-tiles',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
})
