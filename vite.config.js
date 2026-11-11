/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const config = {
  plugins: [
    react(),
    ...(process.env.VITEST ? [] : [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon-32x32.png', 'favicon-64x64.png', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png'],
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
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}']
    }
  }
};

export default defineConfig(({ mode }) => {
  // `VITE_UI` (spec-rediseno-02-c3-skin): valor por defecto para que `%VITE_UI%` de
  // index.html siempre resuelva (y Vite no avise de variable no definida). Un `.env`
  // o el entorno pueden fijarlo a `v2`; `localStorage` sigue ganando en el navegador.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    ...config,
    define: {
      'import.meta.env.VITE_UI': JSON.stringify(env.VITE_UI || 'v1'),
    },
  };
});
