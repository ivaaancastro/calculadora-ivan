/**
 * Utilidades compartidas por las pruebas de interfaz (layout, móvil y funcionales).
 * Los datos simulados viven en mockApp.js; aquí solo hay rutas y sondas del DOM.
 */
import { expect } from '@playwright/test';
import { DETAIL_ACTIVITY_ID } from './mockApp.js';

/** Abre una pantalla de SCREENS y espera a que esté estable. */
export const openScreen = (page, screen) => gotoReady(page, screen.path, screen.via);

/** Pantallas cubiertas por la red de seguridad. `auth: false` = sin sesión. */
export const SCREENS = [
  { name: 'landing', path: '/', auth: false },
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
    // Ritmo del gesto (~60 Hz), no una espera de estado: sin él, el navegador lo ve como un salto.
    await new Promise((r) => setTimeout(r, 16));
  }
  await touch('touchEnd', startX + dx);
  await cdp.detach();
}

/**
 * Bloques hermanos que se solapan (PRO-1): dentro de `main`, dos hijos en flujo normal del mismo
 * padre no deberían ocupar el mismo sitio. Ignora capas posicionadas, gráficas, mapas e iconos.
 */
export function overlappingBlocks(page, tolerance = 4) {
  return page.evaluate((tol) => {
    const root = document.querySelector('main') || document.body;
    const SKIP = '.recharts-wrapper, .leaflet-container, svg, [aria-hidden=true]';
    const inFlow = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.display === 'contents' || s.visibility === 'hidden') return false;
      if (s.position === 'absolute' || s.position === 'fixed' || s.position === 'sticky') return false;
      if (s.display.startsWith('inline') && s.display !== 'inline-flex' && s.display !== 'inline-grid') return false;
      const r = el.getBoundingClientRect();
      return r.width > tol && r.height > tol && r.right > 0 && r.left < window.innerWidth;
    };
    const label = (el) =>
      `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} "${(el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
    const out = [];
    for (const parent of root.querySelectorAll('*')) {
      if (parent.closest(SKIP)) continue;
      const kids = [...parent.children].filter((k) => !k.matches(SKIP) && inFlow(k));
      if (kids.length < 2) continue;
      const rects = kids.map((k) => k.getBoundingClientRect());
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > tol && h > tol) out.push(`${label(kids[i])} ⨯ ${label(kids[j])}`);
        }
      }
    }
    return out;
  }, tolerance);
}
