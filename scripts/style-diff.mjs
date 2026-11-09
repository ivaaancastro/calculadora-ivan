#!/usr/bin/env node
/**
 * Compara dos volcados de e2e/tools/style-dump.spec.js (spec-rediseno-02-c1, 6.6).
 *   node scripts/style-diff.mjs <antes> <después>
 * Sale con código 1 si hay cualquier diferencia de color o si falta un volcado.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('Uso: node scripts/style-diff.mjs <antes> <después>');
  process.exit(2);
}

const list = (dir) =>
  readdirSync(dir).flatMap((p) =>
    statSync(join(dir, p)).isDirectory() ? readdirSync(join(dir, p)).map((f) => `${p}/${f}`) : [],
  );

const files = [...new Set([...list(a), ...list(b)])].sort();
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
