#!/usr/bin/env node
/**
 * Tamaño mínimo de texto (spec-capa6-v2-premium, RF-C4). `npm run lint:type`.
 *
 * Falla si en src/ (sin tests) hay algún texto por debajo de 11 px:
 *   - clases arbitrarias de Tailwind: `text-[10px]`, `sm:text-[0.6rem]`…;
 *   - `fontSize` en línea (`style={{ fontSize: 9 }}`, `fontSize={10}`, `fontSize: '10px'`),
 *     que incluye los `tick` de Recharts y el texto SVG;
 *   - `font-size` en los CSS de src/.
 * La escala del tema (`text-2xs` = 11 px) ya respeta el mínimo.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MIN = 11;

const toPx = (n, unit) => (unit === 'rem' || unit === 'em' ? Number(n) * 16 : Number(n));
const RULES = [
  // Clase arbitraria: text-[10px], text-[0.6rem]
  { re: /(?<![\w-])text-\[(\d*\.?\d+)(px|rem|em)\]/g, src: /\.(jsx?|tsx?)$/ },
  // fontSize en JS: fontSize: 9 / fontSize={10} / fontSize: '10px' / fontSize="9"
  { re: /fontSize\s*[:=]\s*\{?\s*['"`]?(\d*\.?\d+)(px|rem|em)?\b/g, src: /\.(jsx?|tsx?)$/ },
  // CSS: font-size: 10px
  { re: /font-size:\s*(\d*\.?\d+)(px|rem|em)\b/g, src: /\.css$/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== '__tests__') walk(p, out);
    } else if (/\.(jsx?|tsx?|css)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

const problems = [];
for (const file of walk(join(ROOT, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const { re, src } of RULES) {
      if (!src.test(file)) continue;
      for (const m of line.matchAll(re)) {
        const px = toPx(m[1], m[2] ?? 'px');
        if (px < MIN) problems.push(`${relative(ROOT, file)}:${i + 1}  ${m[0].trim()}  (${px} px)`);
      }
    }
  });
}

if (problems.length) {
  console.error(`✗ ${problems.length} texto(s) por debajo de ${MIN} px (usa text-2xs o ${MIN}):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`✓ lint:type: ningún texto por debajo de ${MIN} px`);
