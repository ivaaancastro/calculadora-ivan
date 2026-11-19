#!/usr/bin/env node
/**
 * Compara dos volcados de e2e/tools/style-dump.spec.js (spec-rediseno-02-c1, 6.6).
 *   node scripts/style-diff.mjs <antes> <después> [--only dashboard,detalle-mapa]
 * `--only` limita la comparación a esas pantallas/estados (nombre sin tema ni extensión).
 * Sale con código 1 si hay cualquier diferencia de color o si falta un volcado.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? (args[onlyAt + 1] || '').split(',').filter(Boolean) : null;
if (onlyAt >= 0) args.splice(onlyAt, 2);
const [a, b] = args;
if (!a || !b || (onlyAt >= 0 && !only.length)) {
  console.error('Uso: node scripts/style-diff.mjs <antes> <después> [--only a,b]');
  process.exit(2);
}

const list = (dir) =>
  readdirSync(dir).flatMap((p) =>
    statSync(join(dir, p)).isDirectory() ? readdirSync(join(dir, p)).map((f) => `${p}/${f}`) : [],
  );

// `proyecto/nombre-tema.json` → nombre
const screenOf = (f) => f.split('/').pop().replace(/-(light|dark)\.json$/, '');
const files = [...new Set([...list(a), ...list(b)])].filter((f) => !only || only.includes(screenOf(f))).sort();
if (only && !files.length) {
  console.error(`--only ${only.join(',')}: ningún volcado coincide.`);
  process.exit(2);
}
let diffs = 0;
let elements = 0;
for (const f of files) {
  if (!existsSync(join(a, f)) || !existsSync(join(b, f))) {
    console.log(`FALTA ${f} en ${existsSync(join(a, f)) ? b : a}`);
    diffs++;
    continue;
  }
  const A = JSON.parse(readFileSync(join(a, f), 'utf8'));
  const B = JSON.parse(readFileSync(join(b, f), 'utf8'));
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  elements += keys.size;
  const local = [];
  for (const k of keys) {
    if (!A[k] || !B[k]) {
      local.push(`  ${A[k] ? '-' : '+'} ${k}`);
      continue;
    }
    for (const p of Object.keys(A[k])) if (A[k][p] !== B[k][p]) local.push(`  ${k}\n     ${p}: ${A[k][p]}  →  ${B[k][p]}`);
  }
  if (local.length) {
    console.log(`DIFERENTE ${f} (${local.length})`);
    console.log(local.slice(0, 20).join('\n'));
    if (local.length > 20) console.log(`  … y ${local.length - 20} más`);
    diffs += local.length;
  }
}
console.log(`${files.length} volcados, ${elements} elementos comparados, ${diffs} diferencias.`);
process.exit(diffs ? 1 : 0);
