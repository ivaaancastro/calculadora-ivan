#!/usr/bin/env node
/**
 * Tokens de GRÁFICAS (spec-rediseno-02-c1, RF5, PR 6).
 *
 *   node scripts/codemods/charts.mjs --tokens   escribe el bloque de tokens.css desde charts.json
 *   node scripts/codemods/charts.mjs --apply    sustituye cada color asignado en ASSIGN por su rol
 *
 * Los colores de las gráficas son atributos de Recharts, del SVG de la PMC y de Leaflet, no
 * clases: no hay pares claro/oscuro que sustituir por valor. Cada uso se asignó a mano a un
 * rol de src/components/charts/chartTheme.js (el mismo hex significa cosas distintas según
 * la gráfica) en ASSIGN, por archivo y línea (números de línea en 5516160). `--apply` cambia
 * cada literal por `ct.<rol>` y falla si el valor del literal no es el del rol. Lo
 * estructural (declarar `const ct = useChartTheme()`, mover constantes de módulo al
 * componente, listas de zonas, el tooltip de las tarjetas) se hizo a mano después. La prueba
 * src/__tests__/unit/chartTheme.test.js comprueba que cada rol coincide con su token.
 *
 * charts.json solo declara los tokens nuevos; las series reutilizan los de métricas y
 * categorías (`metric-ctl`, `hr`, `power`, `pace`, `cadence`, `ef`, `sleep`, `sport-*`…), y
 * `chart-grid`, `chart-axis`, `chart-cursor` y `chart-dot-ring` están en tokens.css desde el PR 1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineFamily } from './family.mjs';
import { getChartTheme } from '../../src/components/charts/chartTheme.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const FAMILY = 'charts';

/** archivo → línea → roles de los literales de color de esa línea, de izquierda a derecha ('keep' = no tocar). */
export const ASSIGN = {
  'src/components/dashboard/EvolutionChart.jsx': {
    167: ['series.ctl'], 168: ['series.ctl'], 171: ['series.tsb'], 172: ['series.tsb'],
    176: ['anatomy.grid'], 180: ['anatomy.axis'], 189: ['anatomy.axis'], 194: ['anatomy.cursor'],
    201: ['anatomy.cursor'], 204: ['anatomy.axis'],
    211: ['series.tsb'], 215: ['anatomy.dotRing', 'series.tsb'],
    223: ['series.ctl'], 227: ['anatomy.dotRing', 'series.ctl'],
    235: ['series.atl'], 239: ['anatomy.dotRing', 'series.atl'],
  },
  'src/components/dashboard/ChartsSection.jsx': {
    5: ['distribution.bike', 'distribution.run', 'distribution.strength', 'distribution.walk', 'distribution.workout'],
    17: ['series.ctl', 'series.ctl'], 18: ['anatomy.gridSoft'], 22: ['series.ctl'], 23: ['series.atlOrange'],
    35: ['distribution.other'],
  },
  'src/components/fitness/PowerProfileCard.jsx': {
    98: ['anatomy.grid2'], 99: ['anatomy.tick'], 100: ['anatomy.tick'],
    103: ['series.profileTop', 'series.profileOther'],
    105: ['series.profileUser', 'series.profileUser', 'anatomy.dotRing'],
  },
  'src/components/fitness/MmpAndEfCard.jsx': {
    163: ['series.ef'], 164: ['series.ef'], 167: ['anatomy.gridZinc'],
    171: ['series.ef', 'series.ef', 'anatomy.dotRing'],
    195: ['anatomy.grid2'], 196: ['anatomy.tick'],
  },
  'src/components/fitness/WeeklyVolumeAndFocusCard.jsx': {
    29: ['anatomy.gridZinc'], 30: ['anatomy.tick'], 31: ['series.tss'],
    32: ['tooltip.ink', 'anatomy.cursorZinc'], 33: ['series.tss'], 34: ['series.hours'],
  },
  'src/components/fitness/EstimatedFtpCard.jsx': {
    50: ['series.power'], 51: ['series.power'], 54: ['anatomy.grid2'], 55: ['anatomy.tick'],
    58: ['series.power', 'series.power', 'anatomy.dotRing'],
  },
  'src/components/pages/HealthPage.jsx': {
    395: ['series.readiness'], 424: ['series.strain'], 451: ['series.sleep'],
    // `dark:stroke` no es un atributo SVG y no tiene efecto (D-10): se deja como está.
    904: ['anatomy.gridSoft', 'keep'], 905: ['anatomy.tickZinc'], 906: ['anatomy.tickZinc'],
    908: ['anatomy.cursorZinc'], 910: ['series.readiness'],
    911: ['series.sleep', 'series.sleep', 'anatomy.dotRing'],
  },
  'src/components/pages/ActivityDetailPage.jsx': {
    108: ['sports.run'], 109: ['sports.walk'], 110: ['sports.bike'], 111: ['sports.strength'], 112: ['sports.other'],
    490: ['anatomy.gridSoft'], 493: ['series.pace'], 494: ['series.pace', 'series.pace', 'anatomy.dotRing', 'series.pace'],
    516: ['anatomy.gridSoft'], 519: ['series.hr'], 520: ['series.hr', 'series.hr', 'anatomy.dotRing', 'series.hr'],
    543: ['anatomy.gridSoft'], 546: ['series.power'], 547: ['series.power', 'series.power', 'anatomy.dotRing', 'series.power'],
    577: ['anatomy.gridSoft'], 580: ['series.altitude'], 581: ['series.altitude', 'series.altitude', 'anatomy.dotRing', 'series.altitude'],
    604: ['anatomy.gridSoft'], 607: ['series.cadence'], 608: ['series.cadence', 'series.cadence', 'anatomy.dotRing', 'series.cadence'],
    711: ['sports.fallback'], 798: ['anatomy.gridSoft'], 799: ['anatomy.tick'], 801: ['anatomy.cursorFill'],
  },
  'src/components/activity/ActivityMap.jsx': {
    104: ['map.haloLight', 'map.haloDark'], 105: ['map.route'],
    106: ['map.ring', 'map.start'], 107: ['map.ring', 'map.end'],
    114: ['map.route'], 119: ['map.ring', 'map.route'],
  },
  'src/components/pages/CalendarPage.jsx': {
    216: ['pmc.bandUp'], 217: ['pmc.bandDown'], 222: ['anatomy.grid'], 223: ['anatomy.grid'],
    228: ['anatomy.grid2'], 229: ['anatomy.tick'], 234: ['anatomy.grid'], 235: ['pmc.band'],
    236: ['pmc.bandUp'], 237: ['pmc.bandDown'], 239: ['anatomy.tick'], 243: ['anatomy.grid'], 245: ['anatomy.tick'],
    250: ['pmc.today'], 254: ['pmc.atl'], 255: ['pmc.ctl'], 257: ['pmc.atl'], 258: ['pmc.ctl'],
    262: ['pmc.tsb'], 264: ['pmc.tsb'], 268: ['pmc.ramp'], 270: ['pmc.rampProj'],
    276: ['pmc.ctlInk'], 277: ['pmc.atlInk'], 278: ['pmc.tsbInk'], 279: ['pmc.rampInk'],
    285: ['anatomy.cursor'], 286: ['pmc.ctl', 'anatomy.dotRing'], 287: ['pmc.atl', 'anatomy.dotRing'],
    288: ['pmc.tsb', 'anatomy.dotRing'], 289: ['pmc.rampInk'], 293: ['anatomy.grid'], 297: ['anatomy.axis'],
  },
};

const LITERAL = /(=)?(["'])(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?|white)\2/g;
const norm = (v) => {
  const s = v.toLowerCase();
  if (s === 'white') return '#ffffff';
  return s.length === 4 ? `#${[...s.slice(1)].map((x) => x + x).join('')}` : s;
};
const roleColor = (role) => role.split('.').reduce((o, k) => o?.[k], getChartTheme('light'));

/** Sustituye los literales de las líneas asignadas de un fuente. Falla ante cualquier discrepancia. */
export function transformSource(src, lines, file = '') {
  const out = src.split('\n');
  for (const [ln, roles] of Object.entries(lines)) {
    let i = 0;
    out[ln - 1] = out[ln - 1].replace(LITERAL, (m, eq, _q, val) => {
      const role = roles[i++];
      if (role === undefined) throw new Error(`${file}:${ln}: literal ${val} sin rol asignado`);
      if (role === 'keep') return m;
      const want = roleColor(role);
      if (typeof want !== 'string') throw new Error(`${file}:${ln}: rol desconocido ${role}`);
      if (norm(want) !== norm(val)) throw new Error(`${file}:${ln}: ${val} no es ${role} (${want})`);
      return eq ? `={ct.${role}}` : `ct.${role}`;
    });
    if (i !== roles.length) throw new Error(`${file}:${ln}: ${roles.length} roles para ${i} literales`);
  }
  return out.join('\n');
}

function apply() {
  for (const [file, lines] of Object.entries(ASSIGN)) {
    const path = join(ROOT, file);
    writeFileSync(path, transformSource(readFileSync(path, 'utf8'), lines, file));
    console.log(`${file}: ${Object.values(lines).flat().filter((r) => r !== 'keep').length} colores`);
  }
}

const family = defineFamily({ family: FAMILY, props: 'text', entries: [] });
export const loadDefs = family.loadDefs;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--apply')) apply();
  else family.cli(import.meta.url);
}
