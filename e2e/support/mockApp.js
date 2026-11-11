/**
 * Módulo único de datos simulados para los E2E (RF1).
 *
 * Contiene sesión, perfil, actividades, bienestar, entrenos planificados y la
 * fecha fija. Todo es determinista: no hay Math.random ni Date.now() sin fijar,
 * para que las capturas de referencia no cambien entre ejecuciones.
 *
 * Uso típico:
 *   test.beforeEach(async ({ page }) => { await setupApp(page, { authenticated: true }); });
 */

/** Instante fijo de la app en todas las pruebas (mediodía UTC). */
export const FIXED_NOW = new Date('2026-06-15T12:00:00Z');

/** Debe coincidir con `VITE_SUPABASE_URL` del webServer en playwright.config.js. */
export const SUPABASE_URL = 'https://e2e-forma.supabase.co';
export const SUPABASE_KEY = 'e2e-anon-key';
export const AUTH_STORAGE_KEY = 'sb-e2e-forma-auth-token';

export const MOCK_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'atleta@prueba.e2e',
  user_metadata: { full_name: 'Atleta Prueba E2E' },
  app_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

const expiresAt = Math.floor(FIXED_NOW.getTime() / 1000) + 60 * 60 * 24 * 365;

export const MOCK_SESSION = {
  access_token: 'mock-access-token-e2e',
  refresh_token: 'mock-refresh-token-e2e',
  expires_in: 3600,
  expires_at: expiresAt,
  token_type: 'bearer',
  user: MOCK_USER,
};

/** Fila de la tabla `profiles`. */
export const MOCK_PROFILE = {
  user_id: MOCK_USER.id,
  full_name: 'Atleta Prueba E2E',
  gender: 'male',
  weight: 70,
  fc_rest: 50,
  run_fc_max: 190,
  run_lthr: 170,
  run_zones_mode: 'lthr',
  run_threshold_pace: '4:30',
  bike_fc_max: 185,
  bike_lthr: 165,
  bike_zones_mode: 'lthr',
  bike_ftp: 250,
  intervals_athlete_id: null,
  intervals_api_key: null,
};

// PRNG determinista (mulberry32) para generar series reproducibles.
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDay = (daysAgo) => {
  const d = new Date(FIXED_NOW.getTime() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
};

function buildStreams(seed, kind) {
  const rnd = prng(seed);
  const n = 120;
  const time = [];
  const heartrate = [];
  const watts = [];
  const altitude = [];
  const distance = [];
  const velocity = [];
  const cadence = [];
  const latlng = [];
  for (let i = 0; i < n; i++) {
    time.push(i * 30);
    heartrate.push(Math.round(120 + 40 * Math.sin(i / 14) + rnd() * 6));
    watts.push(kind === 'ride' ? Math.round(180 + 70 * Math.sin(i / 9) + rnd() * 10) : 0);
    altitude.push(Math.round(650 + 40 * Math.sin(i / 20)));
    distance.push(Math.round(i * (kind === 'ride' ? 230 : 95)));
    velocity.push(Number((kind === 'ride' ? 7.5 : 3.4) + Math.sin(i / 11) * 0.6).toFixed(2) * 1);
    cadence.push(Math.round((kind === 'ride' ? 85 : 84) + rnd() * 4));
    latlng.push([40.4168 + i * 0.0003, -3.7038 + Math.sin(i / 15) * 0.004]);
  }
  const wrap = (data) => ({ data });
  return {
    time: wrap(time),
    heartrate: wrap(heartrate),
    watts: wrap(watts),
    altitude: wrap(altitude),
    distance: wrap(distance),
    velocity_smooth: wrap(velocity),
    cadence: wrap(cadence),
    latlng: wrap(latlng),
  };
}

/** ~5 meses de entrenamientos, 4 por semana, hasta el día anterior a FIXED_NOW. */
export const MOCK_ACTIVITIES = (() => {
  const rnd = prng(2026);
  const list = [];
  const plan = [
    { dow: 1, type: 'Run', name: 'Rodaje suave', dur: 45, dist: 8000, el: 60, hr: 138, tss: 45, w: 0 },
    { dow: 2, type: 'Ride', name: 'Series de umbral', dur: 75, dist: 32000, el: 380, hr: 152, tss: 85, w: 215 },
    { dow: 4, type: 'Run', name: 'Tempo', dur: 55, dist: 11000, el: 90, hr: 158, tss: 65, w: 0 },
    { dow: 6, type: 'Ride', name: 'Salida larga', dur: 150, dist: 68000, el: 900, hr: 140, tss: 120, w: 195 },
  ];
  let id = 1;
  for (let daysAgo = 150; daysAgo >= 1; daysAgo--) {
    const day = new Date(FIXED_NOW.getTime() - daysAgo * 86400000);
    const dow = day.getUTCDay();
    const slot = plan.find((p) => p.dow === dow);
    if (!slot) continue;
    const k = 0.9 + rnd() * 0.2;
    list.push({
      id: `a-${id}`,
      user_id: MOCK_USER.id,
      strava_id: null,
      created_at: `${isoDay(daysAgo)}T08:00:00Z`,
      date: isoDay(daysAgo),
      type: slot.type,
      name: slot.name,
      description: null,
      notes: null,
      duration: Math.round(slot.dur * k),
      distance: Math.round(slot.dist * k),
      elevation_gain: Math.round(slot.el * k),
      hr_avg: Math.round(slot.hr * (0.97 + rnd() * 0.06)),
      watts_avg: slot.w ? Math.round(slot.w * k) : null,
      speed_avg: slot.type === 'Run' ? 3.4 : 7.5,
      calories: Math.round(slot.dur * 9 * k),
      effort_perceived: 5,
    });
    id += 1;
  }
  return list;
})();

/** Actividad usada por las pruebas de detalle (la más reciente, con telemetría). */
export const DETAIL_ACTIVITY_ID = MOCK_ACTIVITIES[MOCK_ACTIVITIES.length - 1].id;

const STREAMS_BY_ID = Object.fromEntries(
  MOCK_ACTIVITIES.slice(-6).map((a, i) => [
    a.id,
    buildStreams(100 + i, a.type === 'Ride' ? 'ride' : 'run'),
  ]),
);

/** Filas de `wellness_data` de los últimos 60 días. */
export const MOCK_WELLNESS = (() => {
  const rnd = prng(77);
  const rows = [];
  for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
    rows.push({
      user_id: MOCK_USER.id,
      date: isoDay(daysAgo),
      hrv: Math.round(62 + 8 * Math.sin(daysAgo / 6) + rnd() * 4),
      hrv_sdnn: null,
      sleep_secs: Math.round((7 + Math.sin(daysAgo / 4) * 0.8) * 3600),
      sleep_score: Math.round(78 + rnd() * 10),
      resting_hr: Math.round(50 + Math.sin(daysAgo / 8) * 2),
      weight: 70,
      body_fat: null,
      vo2max: 52,
      readiness: Math.round(70 + rnd() * 15),
      ctl: null,
      atl: null,
      steps: Math.round(8000 + rnd() * 3000),
      spo2: 97,
      respiration: 14,
      stress: null,
      soreness: null,
    });
  }
  return rows;
})();

export const MOCK_PLANNED = [
  {
    id: 'p-1',
    user_id: MOCK_USER.id,
    date: isoDay(-2),
    type: 'Run',
    title: 'Series 5x1000',
    description: '15m calentamiento\n5x 1km Z4 / 2m rec\n10m vuelta a la calma',
    duration: 60,
  },
  {
    id: 'p-2',
    user_id: MOCK_USER.id,
    date: isoDay(-4),
    type: 'Ride',
    title: 'Fondo con tempo',
    description: '2h Z2 con 3x15m Z3',
    duration: 120,
  },
];

// ── Interceptores ───────────────────────────────────────────────────────────

const json = (route, body, status = 200, headers = {}) =>
  route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });

/** PostgREST devuelve un objeto (no un array) si la petición pide `.single()`. */
function respondRows(route, rows) {
  const accept = route.request().headers()['accept'] || '';
  if (accept.includes('vnd.pgrst.object')) {
    return rows.length
      ? json(route, rows[0])
      : json(route, { code: 'PGRST116', message: 'no rows', details: null, hint: null }, 406);
  }
  return json(route, rows);
}

/**
 * Intercepta Supabase (REST y auth) y bloquea el resto de la red externa
 * (fuentes de Google, teselas de mapas…) para que el render sea reproducible.
 *
 * `state.activities` permite a las pruebas de escritura añadir filas.
 */
export async function mockNetwork(page, state = {}) {
  const activities = state.activities || [...MOCK_ACTIVITIES];

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.fallback();
    }
    if (url.startsWith(SUPABASE_URL)) return route.fallback();
    return route.abort();
  });

  // Playwright ejecuta primero el último handler registrado: lo genérico va antes,
  // lo específico después. Cualquier otra tabla o función → vacío.
  await page.route(`${SUPABASE_URL}/**`, (route) => json(route, []));

  await page.route(`${SUPABASE_URL}/auth/v1/**`, (route) => {
    const url = route.request().url();
    if (url.includes('/logout')) return route.fulfill({ status: 204, body: '' });
    if (url.includes('/token')) return json(route, { ...MOCK_SESSION });
    return json(route, MOCK_USER);
  });

  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, (route) => json(route, null));

  await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) => {
    const method = route.request().method();
    if (method !== 'GET') return json(route, [MOCK_PROFILE], 200);
    return respondRows(route, [MOCK_PROFILE]);
  });

  await page.route(`${SUPABASE_URL}/rest/v1/wellness_data*`, (route) =>
    route.request().method() === 'GET' ? respondRows(route, MOCK_WELLNESS) : json(route, []),
  );

  await page.route(`${SUPABASE_URL}/rest/v1/planned_workouts*`, (route) =>
    route.request().method() === 'GET' ? respondRows(route, MOCK_PLANNED) : json(route, []),
  );

  await page.route(`${SUPABASE_URL}/rest/v1/activities*`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      const rows = (Array.isArray(body) ? body : [body]).map((r, i) => ({
        ...r,
        id: `new-${activities.length + i}`,
        created_at: FIXED_NOW.toISOString(),
      }));
      activities.push(...rows);
      return json(route, rows, 201);
    }
    if (req.method() !== 'GET') return json(route, []);

    const select = url.searchParams.get('select') || '';
    if (select.startsWith('id,streams_data')) {
      const rows = Object.entries(STREAMS_BY_ID).map(([id, streams_data]) => ({ id, streams_data }));
      // Solo la fase de segundo plano (últimos 95 días); la histórica queda vacía.
      return json(route, url.searchParams.get('date')?.startsWith('lt.') ? [] : rows);
    }
    return respondRows(route, activities);
  });
}

/**
 * Prepara la página: fecha fija, sin aleatoriedad, sin animaciones y, si se
 * pide, con la sesión ya guardada en localStorage (como tras iniciar sesión).
 */
export async function setupApp(page, { authenticated = false, theme = 'light', state, ui } = {}) {
  // Fecha base fija pero el reloj sigue avanzando: con `clock.setFixedTime` las
  // animaciones de Recharts (basadas en Date.now) se quedan congeladas al inicio.
  await page.addInitScript((fixedMs) => {
    const RealDate = Date;
    const offset = fixedMs - RealDate.now();
    class FixedDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(RealDate.now() + offset);
        else super(...args);
      }
      static now() {
        return RealDate.now() + offset;
      }
    }
    // eslint-disable-next-line no-global-assign
    Date = FixedDate;
  }, FIXED_NOW.getTime());
  await mockNetwork(page, state);

  await page.addInitScript(
    ({ authenticated: auth, theme: th, ui: uiMode, key, session }) => {
      // Aleatoriedad reproducible (el simulador de bienestar usa Math.random).
      let seed = 42;
      Math.random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      try {
        // Solo la primera carga de la pestaña: tras un cierre de sesión o un
        // borrado de cuenta, una recarga no debe volver a iniciar sesión.
        if (!sessionStorage.getItem('e2e-seeded')) {
          sessionStorage.setItem('e2e-seeded', '1');
          localStorage.setItem('theme', th);
          // Piel v2: se siembra antes de cualquier script de la página, igual que
          // un usuario que ya eligió el modo en Ajustes (RF9.1).
          if (uiMode) localStorage.setItem('ui', uiMode);
          if (auth) localStorage.setItem(key, JSON.stringify(session));
        }
      } catch {
        /* storage no disponible */
      }
    },
    { authenticated, theme, ui, key: AUTH_STORAGE_KEY, session: MOCK_SESSION },
  );

  // Animaciones y transiciones desactivadas, y cursor oculto.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.setAttribute('data-e2e', 'no-motion');
    // También oculta el botón flotante de React Query Devtools (solo existe en dev).
    style.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}.tsqd-parent-container,.tsqd-open-btn-container,[class*="tsqd-"]{display:none!important}`;
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
}
