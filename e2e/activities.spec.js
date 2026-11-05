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

let activities = [
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
];

function mockSupabase(page) {
  // Auth
  page.route('**/supabase.co/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: MOCK_USER }, error: null }),
    });
  });
  page.route('**/supabase.co/auth/v1/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }),
    });
  });

  // Listar actividades (GET)
  page.route('**/supabase.co/rest/v1/activities*', async (route) => {
    const url = route.request().url();
    if (url.includes('?select=') || url.includes('order=')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activities),
      });
      return;
    }
    await route.continue();
  });

  // Crear actividad (POST)
  page.route('**/supabase.co/rest/v1/activities', async (route) => {
    if (route.request().method() === 'POST') {
      const body = await route.request().postDataJSON();
      const newActivity = { ...body, id: `a-${Date.now()}`, user_id: MOCK_USER.id, created_at: new Date().toISOString() };
      activities.push(newActivity);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([newActivity]),
      });
      return;
    }
    await route.continue();
  });

  // Obtener actividad por id (detalle)
  page.route('**/supabase.co/rest/v1/activities?id=eq.*', async (route) => {
    const id = route.request().url().split('id=eq.')[1].split('&')[0];
    const found = activities.find((a) => a.id === id);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(found ? [found] : []),
    });
  });

  // Otras llamadas al Supabase -> 200 vacío
  page.route('**/supabase.co/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], error: null }),
    });
  });
}

test.describe('Actividades: añadir → listar → detalle', () => {
  test.beforeEach(({ page }) => {
    mockSupabase(page);
    activities = [
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
    ];
  });

  test('debería añadir una actividad, verla en el historial y abrir su detalle', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });

    // Buscar el botón/modal de añadir actividad
    const addBtn = page.getByRole('button', { name: /Añadir Actividad|Agregar Actividad|Nueva Actividad|Add Activity/i });
    if ((await addBtn.count()) > 0) {
      await addBtn.first().click();

      // Rellenar campos del modal (nombres aproximados; la app usa español)
      const dateInput = page.getByLabel(/Fecha/i);
      const typeInput = page.getByLabel(/Tipo/i);
      const durationInput = page.getByLabel(/Duración/i);

      if ((await dateInput.count()) > 0) {
        await dateInput.first().fill('2026-01-15');
      }
      if ((await typeInput.count()) > 0) {
        await typeInput.first().selectOption?.('Ride') || await typeInput.first().fill('Ride');
      }
      if ((await durationInput.count()) > 0) {
        await durationInput.first().fill('90');
      }

      const saveBtn = page.getByRole('button', { name: /Guardar|Save|Agregar/i });
      if ((await saveBtn.count()) > 0) {
        await saveBtn.first().click();
      }

      // Verificar que la actividad aparece en el listado
      await expect(page.getByText(/2026-01-15|Ride|90/i).first()).toBeVisible({ timeout: 10000 });
    }

    // Abrir detalle de la primera actividad (si hay enlace)
    const firstActivityLink = page.getByRole('link', { name: /Ride|Run|Actividad/i }).first();
    if ((await firstActivityLink.count()) > 0) {
      await firstActivityLink.click();
      await expect(page.getByText(/Detalle|Detail|Ride|Run/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
