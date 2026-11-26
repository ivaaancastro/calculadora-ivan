/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const config = {
  plugins: [
    react(),
    ...(process.env.VITEST ? [] : [
      VitePWA({
        registerType: 'autoUpdate',
        // PERF-2 / D6: recharts y leaflet (los dos trozos más pesados) no van en el precache de la
        // instalación; se guardan la primera vez que se usan (Dashboard/gráficas y mapa del detalle).
        workbox: {
          globIgnores: ['**/vendor-charts-*.js', '**/vendor-map-*.js'],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/vendor-(charts|map)-[\w-]+\.js$/,
              handler: 'CacheFirst',
              options: { cacheName: 'forma-vendor', expiration: { maxEntries: 8 } },
            },
          ],
        },
        includeAssets: ['favicon.svg', 'favicon-32x32.png', 'favicon-64x64.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Forma - Rendimiento Deportivo',
          short_name: 'Forma',
          description: 'Dashboard de rendimiento deportivo y salud',
          theme_color: '#06080f',
          background_color: '#06080f',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ])
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
        }
      }
    }
  },
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['src/__tests__/unit/**', 'node'],
      ['src/__tests__/integration/**', 'jsdom']
    ],
    setupFiles: './vitest.setup.js',
    // chartTheme lee tokens.css como texto (?raw): sin esto Vitest lo sirve vacío.
    css: { include: [/tokens\.css/] },
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}']
    }
  }
};

export default defineConfig(config);
