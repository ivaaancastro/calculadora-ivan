#!/usr/bin/env node
/**
 * Codemod de la familia BORDES (spec-rediseno-02-c1, PR 2).
 *
 *   node scripts/codemods/borders.mjs --inventory   pares claro/oscuro con usos y descartes
 *   node scripts/codemods/borders.mjs --tokens      escribe el bloque de tokens.css desde borders.json
 *   node scripts/codemods/borders.mjs --apply       sustituye los pares exactos por tokens
 *
 * Tabla de equivalencias: src/styles/tokens/borders.json ({ token: { light, dark } }).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, collectPairs, transform, tokensCss } from './lib.mjs';

export const FAMILY = 'borders';
export const PROPS = 'border(?:-[trblxyse])?|divide|ring(?:-offset)?|outline';
export const ENTRIES = ['src/components', 'src/App.jsx'];

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TABLE_FILE = join(ROOT, 'src/styles/tokens', `${FAMILY}.json`);
const TOKENS_CSS = join(ROOT, 'src/styles/tokens.css');

export const loadDefs = () => (existsSync(TABLE_FILE) ? JSON.parse(readFileSync(TABLE_FILE, 'utf8')) : {});
export const tableFrom = (defs) => Object.fromEntries(Object.entries(defs).map(([t, d]) => [`${d.light}|${d.dark}`, t]));

function inventory() {
  const files = listFiles(ROOT, ENTRIES);
  const pairs = collectPairs(ROOT, files, PROPS);
  const table = tableFrom(loadDefs());
  const byValue = new Map();
  for (const p of pairs) {
    const k = `${p.lightValue}|${p.darkValue}`;
    if (!byValue.has(k)) byValue.set(k, { uses: 0, files: new Set(), skipped: {} });
    const e = byValue.get(k);
    e.uses++;
    e.files.add(p.file);
    if (p.reason) e.skipped[p.reason] = (e.skipped[p.reason] || 0) + 1;
  }
  const rows = [...byValue.entries()].sort((a, b) => b[1].uses - a[1].uses);
  console.log('| Usos | Claro | Oscuro | Token | Archivos | Descartes |');
  console.log('|---|---|---|---|---|---|');
  for (const [k, e] of rows) {
    const [l, d] = k.split('|');
    const sk = Object.entries(e.skipped).map(([r, n]) => `${r} ${n}`).join(', ');
    console.log(`| ${e.uses} | \`${l}\` | \`${d}\` | ${table[k] ? `\`${table[k]}\`` : '—'} | ${e.files.size} | ${sk} |`);
  }
  const total = pairs.length;
  const withToken = pairs.filter((p) => table[`${p.lightValue}|${p.darkValue}`]).length;
  console.log(`\nPares: ${total} (${rows.length} distintos). Con token: ${withToken} (${Math.round((withToken * 100) / total)} %).`);
}

function writeTokens() {
  const css = readFileSync(TOKENS_CSS, 'utf8');
  const block = tokensCss(FAMILY, loadDefs());
  const re = new RegExp(`/\\* @tokens:${FAMILY}:start[\\s\\S]*?@tokens:${FAMILY}:end \\*/`);
  const next = re.test(css) ? css.replace(re, block) : `${css.trimEnd()}\n\n${block}\n`;
  writeFileSync(TOKENS_CSS, next);
  console.log(`tokens.css: bloque ${FAMILY} con ${Object.keys(loadDefs()).length} tokens.`);
}

function apply() {
  const table = tableFrom(loadDefs());
  let total = 0;
  const skipped = {};
  for (const file of listFiles(ROOT, ENTRIES)) {
    const path = join(ROOT, file);
    const src = readFileSync(path, 'utf8');
    const { code, replaced, skipped: sk } = transform(src, PROPS, table);
    for (const s of sk) skipped[`${s.reason}: ${s.pair}`] = (skipped[`${s.reason}: ${s.pair}`] || 0) + 1;
    if (replaced) {
      writeFileSync(path, code);
      console.log(`${file}: ${replaced}`);
      total += replaced;
    }
  }
  console.log(`\n${total} pares sustituidos.`);
  if (Object.keys(skipped).length) {
    console.log('Descartados (se quedan como están):');
    for (const [k, n] of Object.entries(skipped).sort((a, b) => b[1] - a[1])) console.log(`  ${n} × ${k}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv[2];
  if (arg === '--inventory') inventory();
  else if (arg === '--tokens') writeTokens();
  else if (arg === '--apply') apply();
  else {
    console.error('Uso: borders.mjs --inventory | --tokens | --apply');
    process.exit(2);
  }
}
