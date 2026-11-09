/* global process */
/**
 * Volcado de estilos calculados (spec-rediseno-02-c1, 6.6).
 *
 * Guarda, para cada pantalla, estado extra y tema, los colores CALCULADOS de todos los
 * elementos renderizados. Sirve para demostrar que una migración de tokens no cambia nada,
 * incluido lo que las capturas no ven (rejilla de Recharts, mapa, vista "Forma" del
 * Calendario, menús y modales) y diferencias por debajo de la tolerancia de las capturas.
 * Al comparar valores y no píxeles, no depende del sistema operativo.
 *
 * Solo se ejecuta si se define STYLE_DUMP_DIR:
 *   STYLE_DUMP_DIR=/ruta/antes npx playwright test e2e/tools/style-dump.spec.js
 *   node scripts/style-diff.mjs /ruta/antes /ruta/despues
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { setupApp } from '../support/mockApp.js';
import { SCREENS, THEMES, openScreen, gotoReady, settleForScreenshot } from '../support/ui.js';

const OUT = process.env.STYLE_DUMP_DIR;
test.skip(!OUT, 'Herramienta manual: define STYLE_DUMP_DIR para volcar los estilos.');

const visible = (locator) => locator.filter({ visible: true }).first();

/** Estados que las capturas no cubren. `only` limita el proyecto donde existe el control. */
const EXTRA_STATES = [
  {
    name: 'detalle-mapa',
    screen: 'detalle',
    act: (page) => visible(page.getByRole('button', { name: 'Mapa', exact: true })).click(),
  },
  {
    name: 'calendario-forma',
    screen: 'calendario',
    only: ['desktop', 'tablet'],
    act: (page) => visible(page.getByRole('button', { name: 'Forma', exact: true })).click(),
  },
  {
    name: 'menu-perfil',
    screen: 'dashboard',
    act: (page) => visible(page.getByRole('button', { name: 'Menú de configuración y perfil' })).click(),
  },
  {
    name: 'modal-anadir',
    screen: 'actividades',
    act: (page) => visible(page.getByRole('button', { name: 'Añadir Manual' })).click(),
  },
  {
    name: 'modal-acceso',
    screen: 'landing',
    act: (page) => visible(page.getByRole('button', { name: 'Iniciar Sesión' })).click(),
  },
  {
    name: 'dashboard-punto-activo',
    screen: 'dashboard',
    act: async (page) => {
      const chart = visible(page.locator('.recharts-wrapper'));
      const box = await chart.boundingBox();
      await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
    },
  },
];

const PROPS = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'box-shadow',
  'text-decoration-color',
  'caret-color',
  'fill',
  'stroke',
  'stop-color',
  'opacity',
];

function dumpStyles(page, only = null) {
  return page.evaluate(({ props, only }) => {
    const out = {};
    const path = (el) => {
      const parts = [];
      for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
        let i = 1;
        for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
        parts.unshift(`${n.tagName.toLowerCase()}:${i}`);
      }
      return parts.join('>');
    };
    // Dentro de un <svg>, Recharts añade o quita grupos <g> según el punto de su animación:
    // se ignoran los <g> (sus hijos ya reflejan el color heredado) y cada elemento se identifica
    // por su <svg> y su orden entre los de su misma etiqueta.
    const svgOrdinal = new Map();
    const key = (el) => {
      const svg = el.ownerSVGElement;
      if (!svg) return path(el);
      const base = path(svg);
      const tag = el.tagName.toLowerCase();
      const counter = `${base}|${tag}`;
      const n = (svgOrdinal.get(counter) || 0) + 1;
      svgOrdinal.set(counter, n);
      return `${base}>${tag}#${n}`;
    };
    for (const el of document.querySelectorAll('body *')) {
      const selected = !only || el.matches(only);
      if (/^(SCRIPT|STYLE|LINK|META|NOSCRIPT)$/.test(el.tagName)) continue;
      if (el.tagName.toLowerCase() === 'g' && el.ownerSVGElement) continue;
      const s = getComputedStyle(el);
      const inDefs = !!el.closest('defs');
      if (!inDefs) {
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
      }
      const k = key(el); // siempre se calcula, para que los ordinales del SVG no dependan del filtro
      if (selected) out[k] = Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)]));
    }
    return out;
  }, { props: PROPS, only });
}

/**
 * Estilos con `:hover`, `:focus` y `:focus-visible` forzados (CDP) en los elementos con esas
 * variantes: ahí es donde una migración puede cambiar qué clase gana (p. ej. `dark:` frente a `hover:`).
 */
async function dumpPseudoStates(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const states = [['hover'], ['focus'], ['focus', 'focus-visible'], ['active']];
  const out = {};
  for (const forced of states) {
    const sel = `[class*="${forced[forced.length - 1]}:"]`;
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
    for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: forced });
    const dump = await dumpStyles(page, sel);
    for (const [k, v] of Object.entries(dump)) out[`${k}::${forced.join('+')}`] = v;
    for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  }
  await cdp.detach();
  return out;
}

/** Espera a que terminen las transiciones y animaciones finitas (no las infinitas, p. ej. `animate-spin`). */
async function settle(page) {
  await settleForScreenshot(page, { resize: false });
  await page.waitForTimeout(2500); // animaciones de Recharts (JS)
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}

const save = (project, name, data) => {
  const dir = join(OUT, project);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 1) + '\n');
};

for (const theme of THEMES) {
  test.describe(`Volcado de estilos · tema ${theme}`, () => {
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }, info) => {
        await setupApp(page, { authenticated: screen.auth, theme });
        await openScreen(page, screen);
        await settle(page);
        save(info.project.name, `${screen.name}-${theme}`, { ...(await dumpStyles(page)), ...(await dumpPseudoStates(page)) });
      });
    }
    for (const state of EXTRA_STATES) {
      test(state.name, async ({ page }, info) => {
        test.skip(state.only && !state.only.includes(info.project.name), 'Control no disponible en este tamaño');
        const screen = SCREENS.find((s) => s.name === state.screen);
        await setupApp(page, { authenticated: screen.auth, theme });
        if (screen.via) await gotoReady(page, screen.path, screen.via);
        else await openScreen(page, screen);
        await settle(page);
        await state.act(page);
        await settle(page);
        save(info.project.name, `${state.name}-${theme}`, { ...(await dumpStyles(page)), ...(await dumpPseudoStates(page)) });
      });
    }
  });
}
