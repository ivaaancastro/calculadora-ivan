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
 *
 * Con STYLE_DUMP_PROPS=full (Capa 2, spec-rediseno-02-c2, 6.5) vuelca también tipografía,
 * caja (relleno, margen, bordes, radios, tamaño), disposición y efectos: lo que una primitiva
 * puede cambiar sin tocar un color. Solo se comparan volcados hechos en el mismo modo.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { setupApp } from '../support/mockApp.js';
import { SCREENS, THEMES, openScreen, gotoReady, settleForScreenshot } from '../support/ui.js';

const OUT = process.env.STYLE_DUMP_DIR;
const FULL = process.env.STYLE_DUMP_PROPS === 'full';
test.skip(!OUT, 'Herramienta manual: define STYLE_DUMP_DIR para volcar los estilos.');

const visible = (locator) => locator.filter({ visible: true }).first();

/**
 * Pasa el ratón por la primera gráfica de la pantalla activa (al 60 % del ancho), para activar
 * su tooltip. En móvil `MobileSwipePager` monta las demás pestañas fuera de la pantalla, a la
 * izquierda o a la derecha: se descartan por su posición horizontal.
 */
async function hoverChart(page) {
  const index = await page.evaluate(() =>
    [...document.querySelectorAll('.recharts-wrapper')].findIndex((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left >= 0 && r.right <= window.innerWidth;
    }),
  );
  if (index < 0) throw new Error('No hay ninguna gráfica en la pantalla activa');
  const chart = page.locator('.recharts-wrapper').nth(index);
  await chart.scrollIntoViewIfNeeded();
  const box = await chart.boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
}

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
    name: 'calendario-planificador',
    screen: 'calendario',
    act: (page) => visible(page.getByRole('button', { name: 'Planificar sesión' })).click({ force: true }),
  },
  {
    name: 'calendario-visor',
    screen: 'calendario',
    // Sesiones planificadas (MOCK_PLANNED): son las únicas tarjetas arrastrables del mes.
    act: (page) => visible(page.locator('[draggable="true"]')).click(),
  },
  {
    name: 'salud-historial-punto-activo',
    screen: 'salud',
    act: async (page) => {
      await visible(page.getByRole('button', { name: 'Historial', exact: true })).click();
      await page.waitForTimeout(1500); // animación de entrada de la gráfica
      await hoverChart(page);
    },
  },
  {
    name: 'rendimiento-punto-activo',
    screen: 'rendimiento',
    only: ['desktop', 'tablet'], // en móvil la sección inicial (Fisiología) no tiene gráficas
    act: (page) => hoverChart(page),
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

/** Propiedades extra del modo `full`: lo que define una receta de UI además del color. */
const FULL_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant-numeric',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'white-space',
  'text-overflow',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'position',
  'z-index',
  'overflow-x',
  'overflow-y',
  'transform',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'backdrop-filter',
  'cursor',
  'user-select',
  'touch-action',
  'pointer-events',
];

function dumpStyles(page, only = null) {
  return page.evaluate(({ props, full, only }) => {
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
      if (!selected) continue;
      out[k] = Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)]));
      // Tamaño de la caja (fuera de los SVG, que dependen de la animación de Recharts).
      if (full && !el.ownerSVGElement && el.tagName.toLowerCase() !== 'svg') {
        const r = el.getBoundingClientRect();
        out[k].size = `${Math.round(r.width)}x${Math.round(r.height)}`;
      }
    }
    return out;
  }, { props: FULL ? [...PROPS, ...FULL_PROPS] : PROPS, full: FULL, only });
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
  // [estado forzado, dónde se fuerza, qué se vuelca, etiqueta]. `group-hover:` depende del
  // `:hover` del ancestro `.group`, no del propio elemento (único group-*/peer-* en uso).
  const states = [
    [['hover'], '[class*="hover:"]', '[class*="hover:"]', 'hover'],
    [['focus'], '[class*="focus:"]', '[class*="focus:"]', 'focus'],
    [['focus', 'focus-visible'], '[class*="focus-visible:"]', '[class*="focus-visible:"]', 'focus+focus-visible'],
    [['active'], '[class*="active:"]', '[class*="active:"]', 'active'],
    [['hover'], '.group', '[class*="group-hover:"]', 'group-hover'],
  ];
  const out = {};
  for (const [forced, target, sel, label] of states) {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: target });
    for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: forced });
    const dump = await dumpStyles(page, sel);
    for (const [k, v] of Object.entries(dump)) out[`${k}::${label}`] = v;
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
