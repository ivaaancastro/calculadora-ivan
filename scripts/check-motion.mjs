#!/usr/bin/env node
/**
 * Trinquete de `transition-all` (Fase B premium, MOV-1). `npm run lint:motion`.
 *
 * Cuenta en src/ (sin tests) las apariciones de `transition-all` / `transition: all`. Falla si
 * superan la línea base de scripts/motion-baseline.json. `--update` baja la línea base (nunca la
 * sube). En v2 la piel ya limita las propiedades animadas (tema `transition-paint`); el objetivo es migrar
 * las clases a `transition-[…]` explícito y llegar a 0 al retirar v1.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASELINE = join(ROOT, 'scripts', 'motion-baseline.json');
const RE = /transition-all|transition:\s*all\b/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?|css)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

let count = 0;
for (const f of walk(join(ROOT, 'src'))) count += (readFileSync(f, 'utf8').match(RE) || []).length;

const base = JSON.parse(readFileSync(BASELINE, 'utf8')).transitionAll;
if (process.argv.includes('--update')) {
  if (count < base) writeFileSync(BASELINE, JSON.stringify({ transitionAll: count }, null, 2) + '\n');
  console.log(`transition-all: ${count} (línea base ${Math.min(base, count)})`);
} else if (count > base) {
  console.error(`✗ transition-all subió: ${count} > ${base}. Usa transition-[propiedades] explícito.`);
  process.exit(1);
} else {
  console.log(`✓ transition-all: ${count} (línea base ${base})${count < base ? ' — baja la base con --update' : ''}`);
}
