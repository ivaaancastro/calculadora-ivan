#!/usr/bin/env node
/**
 * Codemod de la familia ACENTOS, parte 5b: CATEGORÍAS (spec-rediseno-02-c1, RF4).
 *
 *   node scripts/codemods/categories.mjs --inventory   pares por grupo, con su token (o "—")
 *   node scripts/codemods/categories.mjs --draft       propone en categories.json los pares sin token
 *   node scripts/codemods/categories.mjs --tokens      escribe el bloque de tokens.css
 *   node scripts/codemods/categories.mjs --apply       sustituye
 *
 * Un mismo color significa cosas distintas según dónde esté (`orange-500` es carrera en el
 * historial y "categoría 2" en un puerto), así que cada expresión de clases revisada se asigna
 * a un GRUPO en ASSIGN (archivo → línea → grupo). Cada grupo usa sus propios tokens
 * (`categories.json`, nombres `<grupo>` o `<grupo>-…`), y además los de estado (accents.json),
 * métricas y neutros (texto, bordes, superficies) para no dejar bloqueado un neutro que comparte
 * expresión con el acento. Lo que no figura en ASSIGN queda excluido y bloquea lo que coexista
 * con ello: escalas ordinales que reutilizan colores de estado (RPE, sueño, IF, puertos…) y
 * casos ambiguos, que se resuelven en la Capa 3.
 *
 * Donde otra pantalla pinta la misma categoría con otro color (carrera en verde en el
 * Calendario), el grupo es `legacy-<categoría>` y conserva su valor (D-09 en paridad.md).
 * ASSIGN usa números de línea de `develop` en `88b3fb9`; el codemod no cambia líneas.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineFamily, tableFrom } from './family.mjs';
import { listFiles, literalsOf, findPairs, transform, tokenFor, NEUTRALS } from './lib.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const FAMILY = 'categories';
export const PROPS =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|divide|outline|from|via|to|fill|stroke|shadow|accent|decoration|placeholder|caret';
export const ENTRIES = ['src/components', 'src/App.jsx'];
const ACCENTS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
export const COLORS = [...NEUTRALS, ...ACCENTS, '\\[#[0-9a-fA-F]{6}\\]'];

const r = (from, to, g) => Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [from + i, g]));

/** Grupo de cada expresión de clases revisada, por archivo y línea. */
export const ASSIGN = {
  'src/components/Dashboard.jsx': { 191: 'state' },
  'src/components/activity/ActivitySharedUI.jsx': { 63: 'state' },
  'src/components/auth/LoginPage.jsx': { 56: 'state', 143: 'state' },
  'src/components/common/InfoTooltip.jsx': { 7: 'state' },
  'src/components/common/StravaConnect.jsx': { 30: 'strava' },
  'src/components/dashboard/AdvancedAnalytics.jsx': { ...r(125, 128, 'form'), 264: 'vo2' },
  'src/components/dashboard/EvolutionChart.jsx': {
    97: 'metric', 109: 'metric', 111: 'metric', 116: 'metric', 118: 'metric', 123: 'metric', 126: 'legacy-tsb', 138: 'metric', 142: 'metric', 146: 'metric',
  },
  'src/components/dashboard/HistoryList.jsx': { 10: 'sport-run', 17: 'sport-bike', 24: 'sport-strength', 231: 'state', 236: 'state' },
  'src/components/dashboard/Navbar.jsx': {
    58: 'section', 59: 'section', 60: 'section', 61: 'section', 87: 'state', 110: 'state', 162: 'state', 239: 'state', 243: 'state',
  },
  'src/components/fitness/EstimatedFtpCard.jsx': { 32: 'power' },
  'src/components/fitness/MmpAndEfCard.jsx': {
    65: 'ef', 75: 'hr', 110: 'state', 131: 'sport-run', 140: 'state', 153: ['power', 'sport-run'], 253: 'state',
  },
  'src/components/fitness/PowerProfileCard.jsx': { 34: 'state', 82: 'state', 130: 'state' },
  'src/components/fitness/TrainingBalanceCard.jsx': { 60: 'state' },
  'src/components/pages/ActivityDetailPage.jsx': {
    76: 'hr', 79: 'power', 82: 'pace', 85: 'speed', 149: 'state', 189: 'state',
    222: 'load', 223: 'power', 225: 'hr', 226: 'speed', 227: 'power', 228: 'power',
    270: 'speed', 271: 'hr', 272: 'load', 273: 'power', 274: 'power', 277: 'power',
    300: 'hr', 301: 'hr', 314: 'power', 315: 'power', 328: 'speed', 329: 'speed',
    387: 'pace', 398: 'hr', 410: 'power', 439: 'cadence', 474: 'pace', 478: 'pace', 504: 'hr', 531: 'power', 592: 'cadence',
    764: 'power', 769: 'hr', 929: 'power', 932: 'power', 984: 'hr',
  },
  'src/components/pages/CalendarPage.jsx': {
    342: 'sport-run', 343: 'sport-bike', 344: 'sport-swim', 345: 'sport-strength',
    1194: 'state', 1416: 'state', 1423: 'today', 1430: 'state',
    1489: 'legacy-sport-run', 1490: 'sport-bike', 1491: 'legacy-sport-strength', 1492: 'sport-swim', 1493: 'sport-yoga', 1494: 'sport-walk',
    1685: 'state', 1719: 'state', 1848: 'legacy-hr', 1851: 'power', 1855: 'state', 1894: 'power', 1921: 'state',
    1977: 'legacy-hr', 1980: 'power', 1993: 'power', 1995: 'power', 2022: 'state',
    2113: 'sport-run', 2114: 'sport-bike', 2115: 'sport-swim', 2116: 'legacy-sport-strength', 2291: 'power', 2318: 'power',
  },
  'src/components/pages/EmailConfirmedPage.jsx': { 7: 'state' },
  'src/components/pages/HealthPage.jsx': {
    519: 'hr', 540: 'hrv', 563: 'sleep', 609: 'steps', 624: 'steps', 660: 'vo2', 833: 'sleep', 845: 'hrv', 857: 'hr', 869: 'steps', 895: 'sleep', 896: 'sleep',
  },
  'src/components/pages/LandingPage.jsx': { 236: 'state', 280: 'state' },
  'src/components/pages/ProfilePage.jsx': {
    152: 'sport-run', 181: 'hr', 224: 'sport-run', 256: 'power', 719: 'hr', 734: 'hr', 796: 'sport-run',
    823: 'section', 833: 'state', 849: 'section', 860: 'section',
  },
};

const groupsAt = (file, source, lit) => {
  const g = ASSIGN[file]?.[source.slice(0, lit.start).split('\n').length];
  return g == null ? null : [].concat(g);
};
export const skip = (file, lit, source) => !groupsAt(file, source, lit);

const family = defineFamily({ family: FAMILY, props: PROPS, entries: ENTRIES, colors: COLORS, singles: true, skip });
export const loadDefs = family.loadDefs;
export { tableFrom };

const readJson = (f) => {
  const p = join(ROOT, 'src/styles/tokens', `${f}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
};

/** Métricas escritas a mano en tokens.css (valor igual en ambos modos). */
const METRIC_HEX = { 'metric-ctl': '[#3b82f6]', 'metric-atl': '[#f43f5e]', 'metric-tsb': '[#eab308]' };
// `blue-500` es exactamente #3b82f6 (CTL): `bg-blue-500/10` junto al valor de CTL → `bg-metric-ctl/10`.
const METRIC_EXTRA = { 'blue-500|blue-500': 'metric-ctl' };

/** Tokens de un grupo dentro de categories.json. */
export const groupDefs = (defs, g) => Object.fromEntries(Object.entries(defs).filter(([n]) => n === g || n.startsWith(`${g}-`)));

/** Tabla de un literal: sus grupos (por orden) y después estado, métricas y neutros. */
export function tablesFor(defs = loadDefs()) {
  // Neutros solo como pares claro/oscuro: un neutro suelto (`text-slate-300`) no pasa a un token que
  // solo coincide en valor (`scrollbar-thumb`); se queda como está y bloquea su propiedad.
  const pairsOnly = (defs) => tableFrom(Object.fromEntries(Object.entries(defs).filter(([, d]) => d.light !== d.dark)));
  const shared = {
    ...pairsOnly(readJson('surfaces')),
    ...pairsOnly(readJson('borders')),
    ...pairsOnly(readJson('text')),
  };
  // Los estados (5a) solo valen para el grupo `state`: en otro grupo, `emerald-500` es cadencia, no "positivo".
  const states = tableFrom(readJson('accents'));
  const metric = { ...tableFrom(readJson('metrics')), ...Object.fromEntries(Object.entries(METRIC_HEX).map(([t, v]) => [`${v}|${v}`, t])), ...METRIC_EXTRA };
  const cache = new Map();
  return (groups) => {
    const k = groups.join(',');
    if (!cache.has(k)) {
      const own = {};
      for (const g of [...groups].reverse()) {
        Object.assign(own, tableFrom(groupDefs(defs, g)), g === 'metric' ? metric : {}, g === 'state' ? states : {});
      }
      cache.set(k, { ...shared, ...own });
    }
    return cache.get(k);
  };
}

function each(fn) {
  const tables = tablesFor();
  for (const file of listFiles(ROOT, ENTRIES)) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    fn(file, source, tables);
  }
}

function transformFile(file, source, tables) {
  return transform(source, PROPS, {}, COLORS, file, {
    singles: true,
    guardStates: true,
    skip,
    tableOf: (lit) => {
      const g = groupsAt(file, source, lit);
      return g ? tables(g) : {};
    },
  });
}

/** Tono principal de cada grupo (solo para --draft, en líneas con varios grupos). */
const HUE = { 'sport-run': 'orange', power: 'amber' };

/** Papel del token según su valor (solo para proponer nombres; se revisan a mano). */
function role(light, dark) {
  const m = (v) => v.match(/^(?:\[#[0-9a-fA-F]+\]|[a-z]+-(\d+))(?:\/(\d+))?$/) ?? [];
  const [, ls, la] = m(light);
  const [, ds] = m(dark);
  const l = Number(ls);
  if (la || l <= 100) return 'tint';
  if (l === 200) return 'edge';
  if (light === dark) return l === 500 || !ls ? '' : l > 500 ? 'strong' : 'soft';
  if (l >= 600 && Number(ds) <= 400) return 'ink';
  return 'alt';
}

function inventory(draft = false) {
  const rows = [];
  each((file, source, tables) => {
    for (const lit of literalsOf(file, source)) {
      const g = groupsAt(file, source, lit);
      if (!g) continue;
      for (const p of findPairs(lit, PROPS, COLORS, { singles: true })) {
        const token = tokenFor(p, tables(g));
        rows.push({ group: g[0], groups: g, value: `${p.lightValue}|${p.darkValue}`, token, at: `${file.replace('src/components/', '')}:${source.slice(0, lit.start).split('\n').length}`, prop: p.light.parsed.prop });
      }
    }
  });
  const missing = rows.filter((x) => !x.token);
  for (const x of rows) console.log(`${x.group}\t${x.prop}\t${x.value}\t${x.token ?? '—'}\t${x.at}`);
  console.log(`\nPares en ASSIGN: ${rows.length}. Sin token: ${missing.length}.`);
  if (!draft) return;
  const defs = loadDefs();
  const isNeutral = (v) => new RegExp(`^(${NEUTRALS.join('|')})\\b`).test(v);
  for (const x of missing) {
    let [light, dark] = x.value.split('|');
    // Una clase suelta con opacidad usa el token base con el mismo modificador (`bg-hr/10`).
    if (light === dark && light.includes('/')) light = dark = light.replace(/\/.*$/, '');
    if (x.group === 'state' || (isNeutral(light) && isNeutral(dark))) continue;
    const g = x.groups.find((c) => light.startsWith(HUE[c] ?? '·')) ?? x.groups[0];
    if (Object.values(groupDefs(defs, g)).some((d) => d.light === light && d.dark === dark)) continue;
    let name = `${g}-${role(light, dark)}`.replace(/-$/, '');
    for (let i = 2; defs[name]; i++) name = `${g}-${role(light, dark)}-${i}`.replace(/--/, '-');
    defs[name] = { light, dark };
  }
  writeFileSync(join(ROOT, 'src/styles/tokens/categories.json'), `${JSON.stringify(defs, null, 2)}\n`);
  console.log(`categories.json: ${Object.keys(defs).length} tokens.`);
}

function apply() {
  let total = 0;
  const skipped = {};
  each((file, source, tables) => {
    const { code, replaced, skipped: sk } = transformFile(file, source, tables);
    for (const s of sk) if (s.reason !== 'excluido') skipped[`${file}: ${s.reason}: ${s.pair}`] = (skipped[`${file}: ${s.reason}: ${s.pair}`] || 0) + 1;
    if (replaced) {
      writeFileSync(join(ROOT, file), code);
      console.log(`${file}: ${replaced}`);
      total += replaced;
    }
  });
  console.log(`\n${total} pares sustituidos.`);
  if (Object.keys(skipped).length) {
    console.log('Descartados en líneas asignadas:');
    for (const [k, n] of Object.entries(skipped)) console.log(`  ${n} × ${k}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv[2];
  if (arg === '--inventory') inventory();
  else if (arg === '--draft') inventory(true);
  else if (arg === '--tokens') family.writeTokens();
  else if (arg === '--apply') apply();
  else {
    console.error('Uso: categories.mjs --inventory | --draft | --tokens | --apply');
    process.exit(2);
  }
}
