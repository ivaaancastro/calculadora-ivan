/* global process */
import { defineConfig, devices } from '@playwright/test';

// Puerto propio para los E2E: no choca con un `npm run dev` del usuario en 5173
// ni reutiliza un servidor que sirva otro checkout.
const PORT = Number(process.env.E2E_PORT || 5273);
const BASE_URL = `http://localhost:${PORT}`;

// Variables fijas para que la sesión simulada (e2e/support/mockApp.js) use
// siempre la misma clave de localStorage, tenga o no .env el desarrollador.
const E2E_ENV = {
  VITE_SUPABASE_URL: 'https://e2e-forma.supabase.co',
  VITE_SUPABASE_KEY: 'e2e-anon-key',
  VITE_GEMINI_API_KEY: '',
  // Sin estas variables el callback de Strava muestra "Faltan las claves API" (en CI no hay .env).
  VITE_STRAVA_CLIENT_ID: 'e2e-strava-client',
  VITE_STRAVA_CLIENT_SECRET: 'e2e-strava-secret',
  VITE_STRAVA_REDIRECT_URI: 'http://localhost:5273/strava-callback',
};

// Specs que también corren en un teléfono (390 px con toque). El resto, solo en escritorio.
const MOBILE_SPECS = /(layout|mobile)\.spec\.js/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    timezoneId: 'Europe/Madrid',
    locale: 'es-ES',
  },

  projects: [
    {
      name: 'desktop',
      testIgnore: /mobile\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: MOBILE_SPECS,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
    },
  ],

  /* Ejecutar el servidor de Vite antes de los tests */
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    env: E2E_ENV,
    timeout: 120000,
  },
});
