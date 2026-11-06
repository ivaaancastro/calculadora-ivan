/**
 * Utilidades compartidas por las pruebas de interfaz (visual, layout, táctil, gestos).
 * Los datos simulados viven en mockApp.js; aquí solo hay rutas y sondas del DOM.
 */
import { expect } from '@playwright/test';
import { DETAIL_ACTIVITY_ID } from './mockApp.js';

/** Abre una pantalla de SCREENS y espera a que esté estable. */
export const openScreen = (page, screen) => gotoReady(page, screen.path, screen.via);

/** Pantallas cubiertas por la red de seguridad. `auth: false` = sin sesión. */
export const SCREENS = [
  // La landing no tiene gráficas y su hero mide 100vh: se captura con `fullPage` sin redimensionar.
  { name: 'landing', path: '/', auth: false, fullPage: true },
  { name: 'dashboard', path: '/', auth: true },
  { name: 'rendimiento', path: '/stats', auth: true },
  { name: 'calendario', path: '/calendar', auth: true },
  { name: 'actividades', path: '/history', auth: true },
  // La telemetría llega en segundo plano y el detalle solo la lee al abrirse,
  // así que se entra desde el historial (igual que un usuario) y no por URL directa.
  { name: 'detalle', path: `/activity/${DETAIL_ACTIVITY_ID}`, auth: true, via: '/history' },
  { name: 'salud', path: '/health', auth: true },
  { name: 'perfil', path: '/profile', auth: true },
];

export const THEMES = ['light', 'dark'];

/** Navega a `path` y espera a que la pantalla esté estable (sin cargas ni esqueletos). */
export async function gotoReady(page, path, via) {
  if (via) {
    const streams = page.waitForResponse((r) => r.url().includes('streams_data'));
    await page.goto(via);
    await streams;
    await page.evaluate((to) => {
      history.pushState({}, '', to);
      dispatchEvent(new PopStateEvent('popstate'));
    }, path);
  } else {
    await page.goto(path);
  }
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/Iniciando sistema|Cargando métricas|Cargando\.\.\./i)).toHaveCount(0, {
    timeout: 15000,
  });
  await page.evaluate(() => document.fonts?.ready);
  await expect(page.locator('#root')).not.toBeEmpty();
}

/** Desbordamiento horizontal de la página (px de más). 0 = correcto. */
export function horizontalOverflow(page) {
  return page.evaluate(() => {
    const el = document.documentElement;
    return Math.max(el.scrollWidth - el.clientWidth, document.body.scrollWidth - el.clientWidth, 0);
  });
}

/**
 * Elementos de contenido tapados por una barra fija (fixed/sticky).
 * Se evalúa en la posición actual de scroll: `zone: 'top'` solo considera barras
 * ancladas en la mitad superior de la pantalla y `'bottom'` en la inferior.
 */
export function coveredByFixedBars(page, zone) {
  return page.evaluate((zoneArg) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isFixed = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const pos = getComputedStyle(n).position;
        if (pos === 'fixed' || pos === 'sticky') return n;
      }
      return null;
    };
    const describe = (el) => {
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${text}"`;
    };
    const candidates = document.querySelectorAll(
      'a, button, input, select, textarea, h1, h2, h3, h4, p, li, label, td, th, span',
    );
    const problems = [];
    for (const el of candidates) {
      if (isFixed(el)) continue; // contenido de la propia barra
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      const interactive = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
      if (!own && !interactive) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const left = Math.max(r.left, 0);
      const right = Math.min(r.right, vw);
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, vh);
      if (right - left < 2 || bottom - top < 2) continue; // fuera de pantalla
      const x = (left + right) / 2;
      const y = (top + bottom) / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
      const bar = isFixed(hit);
      if (!bar) continue; // lo tapa contenido normal, no una barra fija
      const br = bar.getBoundingClientRect();
      const barIsTop = br.top + br.height / 2 < vh / 2;
      if ((zoneArg === 'top') !== barIsTop) continue;
      problems.push(`${describe(el)} tapado por ${describe(bar)}`);
    }
    return problems;
  }, zone);
}

/** Controles interactivos visibles con área táctil menor que `min` px en algún eje. */
export function smallTouchTargets(page, min = 44) {
  return page.evaluate((minSize) => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch]';
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || el.closest('[aria-hidden=true]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right < 0 || r.left > window.innerWidth) continue; // pestañas fuera de pantalla
      if (r.width < minSize || r.height < minSize) {
        const label = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '')
          .trim().replace(/\s+/g, ' ').slice(0, 30);
        out.push({
          control: `${el.tagName.toLowerCase()} "${label}"`,
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        });
      }
    }
    return out;
  }, min);
}

/**
 * Desliza un dedo en horizontal sobre el centro de `locator` con eventos táctiles reales (CDP).
 * `dx` negativo = hacia la izquierda.
 */
export async function swipeHorizontally(page, locator, dx = -220) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('El elemento no es visible para deslizar');
  const startX = Math.min(Math.max(box.x + box.width / 2 - dx / 2, 100), 290);
  const y = box.y + Math.min(box.height / 2, 60);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }],
    });
  await touch('touchStart', startX);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', startX + (dx * i) / steps);
    await page.waitForTimeout(16);
  }
  await touch('touchEnd', startX + dx);
  await cdp.detach();
  await page.waitForTimeout(500);
}

/**
 * Deja la página lista para capturarla entera SIN usar `fullPage`: cada captura de
 * página completa redimensiona el viewport y las gráficas responsivas de Recharts
 * reinician su animación, lo que hace las capturas inestables. En su lugar se ajusta
 * el viewport a la altura del documento una vez, se espera a que todo se asiente y
 * después se captura solo el viewport.
 */
export async function settleForScreenshot(page, { resize = true } = {}) {
  const { width, height: originalHeight } = page.viewportSize();
  // La landing revela sus secciones con IntersectionObserver al hacer scroll: se recorre la
  // página entera para que todo el contenido esté visible en la captura.
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.7, 200);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  // 1) Altura natural del documento con el viewport original, esperando a que no cambie.
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 4; i++) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    stable = h === last ? stable + 1 : 0;
    last = h;
    await page.waitForTimeout(250);
  }
  if (!resize) {
    await page.waitForTimeout(500);
    return;
  }
  // 2) Un único ajuste (sin iterar: los elementos con alto en `vh` crecerían en cada vuelta).
  await page.setViewportSize({ width, height: Math.max(last, originalHeight) });
  await page.waitForTimeout(600);
  // Las gráficas de Recharts se animan por JS (no por CSS): se espera a que terminen.
  await page.waitForTimeout(3000);
  await page
    .waitForFunction(
      () => {
        const bars = [...document.querySelectorAll('.recharts-bar')].filter((b) => b.getBoundingClientRect().width > 0);
        return bars.every((b) => b.querySelectorAll('.recharts-bar-rectangle').length > 0);
      },
      null,
      { timeout: 6000 },
    )
    .catch(() => {});
  await page.waitForTimeout(500);
}
