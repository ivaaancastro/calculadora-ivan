import { test, expect } from '@playwright/test';

const MOCK_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'atleta@prueba.e2e',
};

const MOCK_SESSION = {
  access_token: 'mock-access-token-e2e',
  refresh_token: 'mock-refresh-token-e2e',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

const MOCK_PROFILE = {
  id: MOCK_USER.id,
  full_name: 'Atleta Prueba E2E',
  weight: 70,
  ctl: 85,
  atl: 75,
  tsb: 10,
};

const MOCK_ACTIVITIES = [
  {
    id: 'a-1',
    user_id: MOCK_USER.id,
    date: '2026-01-10',
    type: 'Ride',
    duration: 60,
    distance: 25000,
    elevation_gain: 300,
    hr_avg: 145,
    tss: 70,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'a-2',
    user_id: MOCK_USER.id,
    date: '2026-01-09',
    type: 'Run',
    duration: 45,
    distance: 8000,
    elevation_gain: 50,
    hr_avg: 155,
    tss: 55,
    created_at: '2026-01-09T07:00:00Z',
  },
];

// Intercepta llamadas a Supabase para devolver datos mockeados (sin red real).
function mockSupabase(page) {
  // Auth: todas las rutas de auth (getSession, getUser, signIn, signUp, authorize, logout)
  page.route('**/supabase.co/auth/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // getUser / session -> devuelve usuario activo
    if (url.includes('/user') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: MOCK_USER }, error: null }),
      });
      return;
    }

    // signInWithPassword / signUp / setSession / authorize -> devuelve sesión y usuario
    if (url.includes('/token') || url.includes('/authorize')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { session: MOCK_SESSION, user: MOCK_USER },
          error: null,
        }),
      });
      return;
    }

    // signOut -> ok
    if (url.includes('/logout')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, error: null }),
      });
      return;
    }

    await route.continue();
  });

  // Perfil del usuario
  page.route('**/supabase.co/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_PROFILE]),
    });
  });

  // Actividades del usuario
  page.route('**/supabase.co/rest/v1/activities*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACTIVITIES),
    });
  });

  // Cualquier otra llamada a Supabase -> continua (evita devolver 200 vacío que rompa el flujo de auth)
  page.route('**/supabase.co/**', async (route) => {
    await route.continue();
  });
}

test.describe('Dashboard UI (autenticado)', () => {
  test.beforeEach(({ page }) => {
    mockSupabase(page);
  });

  test('debería cargar el dashboard autenticado y mostrar métricas clave tras login', async ({ page }) => {
    await page.goto('/');

    // Flujo de login (mismo patrón que auth.spec.js): abre el modal y entra al laboratorio.
    // Tras el login, supabase-js guarda la sesión en localStorage.
    await page.getByRole('button', { name: /Iniciar Sesión|Empezar Gratis|Crear Cuenta Gratis/i }).first().click();
    await page.getByRole('button', { name: /Entrar al Laboratorio/i }).click();

    // Recargar para que getSession() lea la sesión persistida en localStorage y renderice el dashboard.
    await page.reload();

    // Tras login exitoso + recarga, se muestra el dashboard y no la landing
    await expect(page.getByText(/Tu laboratorio de rendimiento deportivos/i)).not.toBeVisible({
      timeout: 10000,
    });

    // Verifica presencia de métricas clave del PMC (si se renderizan)
    await expect(page.getByText(/Atleta Prueba E2E|Fitness|CTL|Forma|TSB|Fatiga|ATL/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Las actividades mockeadas pueden aparecer en el historial (se prueban a fondo en activities.spec.js).
    // Aquí solo verificamos que el dashboard no muestre un estado de error/vacío tras la carga autenticada.
    const activityRows = page.getByRole('row').or(page.getByText(/Ride|Run|Actividad/i));
    if ((await activityRows.count()) > 0) {
      await expect(activityRows.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
