#!/usr/bin/env node
/**
 * Ficheros huérfanos en src/ (spec-capa6-v2-premium, RF-E3). `npm run lint:orphans`.
 *
 * Recorre el grafo de imports desde src/main.jsx (import/export ... from, import() y
 * import de CSS) y lista los ficheros de src/ a los que no llega nadie. Los tests y sus
 * utilidades no cuentan como raíz: un fichero que solo usan sus tests es huérfano.
 * Sale con código 1 si hay alguno.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const ENTRY = join(SRC, 'main.jsx');
const EXTS = ['', '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.cjs', '.mjs'];
const IGNORE = /(__tests__|\.test\.|\.d\.ts$|\/test\/|setupTests)/;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const resolveImport = (from, spec) => {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null; // paquete npm
  const base = resolve(dirname(from), spec.split('?')[0]);
  for (const ext of EXTS) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext;
  for (const ext of EXTS.slice(1)) if (existsSync(join(base, 'index' + ext))) return join(base, 'index' + ext);
  return null;
};

const IMPORT_RE = /(?:import|export)\s[^'"`]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|@import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

const seen = new Set();
const stack = [ENTRY];
while (stack.length) {
  const file = stack.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3] || m[4] || m[5];
    const target = resolveImport(file, spec);
    if (target && target.startsWith(SRC)) stack.push(target);
  }
}

// Ficheros que carga algo fuera del grafo de JS (Tailwind lee tailwindTokens.cjs; index.html, main.jsx).
const EXTERNAL = new Set(['styles/tailwindTokens.cjs', 'styles/tokens']);
const orphans = walk(SRC)
  .filter((f) => !IGNORE.test(f) && !seen.has(f))
  .map((f) => relative(SRC, f))
  .filter((f) => ![...EXTERNAL].some((e) => f.startsWith(e)));

if (orphans.length) {
  console.log(`❌ ${orphans.length} fichero(s) de src/ sin importar desde main.jsx:`);
  for (const f of orphans.sort()) console.log(`   src/${f}`);
  process.exit(1);
}
console.log(`✅ lint:orphans: 0 huérfanos (${seen.size} ficheros alcanzables)`);
