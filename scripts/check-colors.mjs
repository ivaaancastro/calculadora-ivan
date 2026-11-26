#!/usr/bin/env node
/**
 * Trinquete de colores sueltos (spec-rediseno-02-c1, RF7).
 *
 * Cuenta por archivo de src/ los colores que no salen de los tokens:
 *   palette   clases de la paleta de Tailwind (bg-slate-100, text-white, border-blue-500/10…)
 *   arbitrary clases arbitrarias con hex (bg-[#2c2c2e])
 *   hex       literales hex fuera de clases ('#3b82f6', stroke="#fff")
 *   rgb       rgb()/rgba() con valores numéricos
 *   dark      clases `dark:` de color (pares claro/oscuro escritos a mano)
 *
 * Uso:
 *   node scripts/check-colors.mjs            falla si algún archivo supera su línea base
 *   node scripts/check-colors.mjs --update   baja la línea base a los valores actuales (nunca la sube)
 *   node scripts/check-colors.mjs --report   totales por categoría y uso de tokens
 *
 * La línea base (scripts/color-baseline.json) solo sube editándola a mano, y eso se ve en el diff.
 * Las carpetas protegidas (RF3: hooks, utils, services, store) se cuentan aparte: no pueden crecer,
 * pero esta capa no las migra.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASELINE = join(ROOT, 'scripts', 'color-baseline.json');
const EXTS = /\.(jsx?|tsx?|css)$/;
// Fuentes de los tokens: aquí los valores sueltos son la definición, no una fuga.
const SOURCES = new Set(['src/styles/tokens.css', 'src/styles/tailwindTokens.cjs', 'src/components/charts/chartTheme.js']);
const PROTECTED = /^src\/(hooks|utils|services|store)\/|^src\/supabase\.js$/;
const CATEGORIES = ['palette', 'arbitrary', 'hex', 'rgb', 'dark'];

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const PROPS =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|divide|from|via|to|fill|stroke|outline|placeholder|caret|accent|decoration|shadow';
const VARIANTS = '(?:[\\w-]+(?:\\[[^\\]]*\\])?:)*';
const PALETTE_RE = new RegExp(`(?<![\\w-])${VARIANTS}(?:${PROPS})-(?:${PALETTE})(?:-\\d{2,3})?(?:\\/[\\w.\\[\\]]+)?(?![\\w-])`, 'g');
const ARBITRARY_RE = new RegExp(`(?<![\\w-])${VARIANTS}(?:${PROPS})-\\[#[0-9a-fA-F]{3,8}\\](?:\\/[\\w.\\[\\]]+)?`, 'g');
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const RGB_RE = /rgba?\(\s*\d/g;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : walk(p);
    return EXTS.test(name) ? [p] : [];
  });

const toRel = (p) => relative(ROOT, p).split(sep).join('/');

/** Cuenta los colores sueltos de un texto. */
export function countColors(text) {
  const palette = text.match(PALETTE_RE) || [];
  const arbitrary = text.match(ARBITRARY_RE) || [];
  const withoutArbitrary = text.replace(ARBITRARY_RE, '');
  return {
    palette: palette.length,
    arbitrary: arbitrary.length,
    hex: (withoutArbitrary.match(HEX_RE) || []).length,
    rgb: (text.match(RGB_RE) || []).length,
    dark: [...palette, ...arbitrary].filter((c) => /(^|:)dark:/.test(c)).length,
  };
}

/** Clases que usan tokens del tema (para medir la cobertura de la migración). */
function tokenNames() {
  const require = createRequire(import.meta.url);
  const { colors } = require(join(ROOT, 'src/styles/tailwindTokens.cjs'));
  const names = [];
  const visit = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = k === 'DEFAULT' ? prefix : prefix ? `${prefix}-${k}` : k;
      if (typeof v === 'string') names.push(name);
      else visit(v, name);
    }
  };
  visit(colors, '');
  return names;
}

function scan() {
  const files = {};
  for (const abs of walk(join(ROOT, 'src'))) {
    const rel = toRel(abs);
    if (SOURCES.has(rel)) continue;
    const counts = countColors(readFileSync(abs, 'utf8'));
    if (CATEGORIES.some((c) => counts[c] > 0)) files[rel] = counts;
  }
  return files;
}

const sum = (files, filter = () => true) => {
  const t = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const [f, counts] of Object.entries(files)) if (filter(f)) for (const c of CATEGORIES) t[c] += counts[c];
  return t;
};

function main() {
  const args = new Set(process.argv.slice(2));
  const current = scan();
  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')).files : null;

  if (args.has('--report')) {
    const names = tokenNames();
    const tokenRe = new RegExp(`(?<![\\w-])${VARIANTS}(?:${PROPS})-(?:${names.join('|')})(?:\\/[\\w.\\[\\]]+)?(?![\\w-])`, 'g');
    let tokenUses = 0;
    for (const abs of walk(join(ROOT, 'src'))) if (!SOURCES.has(toRel(abs))) tokenUses += (readFileSync(abs, 'utf8').match(tokenRe) || []).length;
    console.log('Migrable (src sin carpetas protegidas):', sum(current, (f) => !PROTECTED.test(f)));
    console.log('Protegido (hooks, utils, services, store):', sum(current, (f) => PROTECTED.test(f)));
    console.log(`Clases con tokens: ${tokenUses} (${names.length} tokens definidos)`);
    return;
  }

  if (args.has('--init')) {
    if (baseline) {
      console.error('Ya existe scripts/color-baseline.json: usa --update (solo baja).');
      process.exit(1);
    }
    write(current);
    console.log(`Línea base creada con ${Object.keys(current).length} archivos.`);
    return;
  }
  if (!baseline) {
    console.error('Falta scripts/color-baseline.json (créala una sola vez con --init).');
    process.exit(1);
  }

  const problems = [];
  const lowered = [];
  for (const [file, counts] of Object.entries(current)) {
    const base = baseline[file];
    for (const c of CATEGORIES) {
      const allowed = base?.[c] ?? 0;
      if (counts[c] > allowed) problems.push(`${file}: ${c} ${counts[c]} > ${allowed}`);
      else if (counts[c] < allowed) lowered.push(file);
    }
  }
  for (const file of Object.keys(baseline)) if (!current[file]) lowered.push(file);

  if (args.has('--update')) {
    if (problems.length) {
      console.error('No se actualiza: hay archivos por encima de la línea base.\n  ' + problems.join('\n  '));
      process.exit(1);
    }
    write(current);
    console.log(`Línea base actualizada (${new Set(lowered).size} archivos bajan).`);
    return;
  }

  if (problems.length) {
    console.error(
      'Colores sueltos nuevos (usa tokens de src/styles/tokens.css o chartTheme):\n  ' + problems.join('\n  '),
    );
    process.exit(1);
  }
  const t = sum(current);
  console.log(`Colores sueltos sin aumentos (${CATEGORIES.map((c) => `${c} ${t[c]}`).join(', ')}).`);
  if (lowered.length) console.log(`${new Set(lowered).size} archivos han bajado: ejecuta \`npm run lint:colors -- --update\`.`);
}

function write(files) {
  const sorted = Object.fromEntries(Object.keys(files).sort().map((k) => [k, files[k]]));
  const doc = {
    $comment:
      'Línea base de scripts/check-colors.mjs. Solo debe bajar (npm run lint:colors -- --update). Subirla a mano exige justificarlo en el PR.',
    totals: sum(files),
    files: sorted,
  };
  writeFileSync(BASELINE, JSON.stringify(doc, null, 2) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
