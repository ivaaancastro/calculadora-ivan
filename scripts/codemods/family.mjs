/**
 * CLI común de los codemods por familia (spec-rediseno-02-c1, RF6).
 *
 *   node scripts/codemods/<familia>.mjs --inventory   pares claro/oscuro con usos y descartes
 *   node scripts/codemods/<familia>.mjs --tokens      escribe el bloque de tokens.css desde <familia>.json
 *   node scripts/codemods/<familia>.mjs --apply       sustituye los pares exactos por tokens
 *
 * Cada familia solo declara su nombre, sus propiedades y su ámbito. La tabla de equivalencias
 * vive en src/styles/tokens/<familia>.json ({ token: { light, dark } }).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, collectPairs, transform, tokensCss, tokenFor, NEUTRALS } from './lib.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TOKENS_CSS = join(ROOT, 'src/styles/tokens.css');

export const tableFrom = (defs) => Object.fromEntries(Object.entries(defs).map(([t, d]) => [`${d.light}|${d.dark}`, t]));

export function defineFamily({ family, props, entries, colors = NEUTRALS, singles = false, skip = null }) {
  const opts = { singles, skip };
  const tableFile = join(ROOT, 'src/styles/tokens', `${family}.json`);
  const loadDefs = () => (existsSync(tableFile) ? JSON.parse(readFileSync(tableFile, 'utf8')) : {});

  function inventory() {
    const pairs = collectPairs(ROOT, listFiles(ROOT, entries), props, colors, opts);
    const table = tableFrom(loadDefs());
    const byValue = new Map();
    for (const p of pairs) {
      const k = `${p.lightValue}|${p.darkValue}`;
      if (!byValue.has(k)) byValue.set(k, { uses: 0, files: new Set(), skipped: {} });
      const e = byValue.get(k);
      e.uses++;
      e.files.add(p.file);
      if (p.reason) e.skipped[p.reason] = (e.skipped[p.reason] || 0) + 1;
      e.token ??= tokenFor(p, table);
    }
    const rows = [...byValue.entries()].sort((a, b) => b[1].uses - a[1].uses);
    console.log('| Usos | Claro | Oscuro | Token | Archivos | Descartes |');
    console.log('|---|---|---|---|---|---|');
    for (const [k, e] of rows) {
      const [l, d] = k.split('|');
      const sk = Object.entries(e.skipped).map(([r, n]) => `${r} ${n}`).join(', ');
      console.log(`| ${e.uses} | \`${l}\` | \`${d}\` | ${e.token ? `\`${e.token}\`` : '—'} | ${e.files.size} | ${sk} |`);
    }
    const total = pairs.length;
    const withToken = pairs.filter((p) => tokenFor(p, table)).length;
    console.log(`\nPares: ${total} (${rows.length} distintos). Con token: ${withToken} (${Math.round((withToken * 100) / total)} %).`);
  }

  function writeTokens() {
    const css = readFileSync(TOKENS_CSS, 'utf8');
    const block = tokensCss(family, loadDefs());
    const re = new RegExp(`/\\* @tokens:${family}:start[\\s\\S]*?@tokens:${family}:end \\*/`);
    const next = re.test(css) ? css.replace(re, block) : `${css.trimEnd()}\n\n${block}\n`;
    writeFileSync(TOKENS_CSS, next);
    console.log(`tokens.css: bloque ${family} con ${Object.keys(loadDefs()).length} tokens.`);
  }

  function apply() {
    const table = tableFrom(loadDefs());
    let total = 0;
    const skipped = {};
    for (const file of listFiles(ROOT, entries)) {
      const path = join(ROOT, file);
      const { code, replaced, skipped: sk } = transform(readFileSync(path, 'utf8'), props, table, colors, file, opts);
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

  /** Ejecuta la CLI si `metaUrl` es el script lanzado. */
  function cli(metaUrl) {
    if (!process.argv[1] || fileURLToPath(metaUrl) !== process.argv[1]) return;
    const arg = process.argv[2];
    if (arg === '--inventory') inventory();
    else if (arg === '--tokens') writeTokens();
    else if (arg === '--apply') apply();
    else {
      console.error(`Uso: ${family}.mjs --inventory | --tokens | --apply`);
      process.exit(2);
    }
  }

  return { loadDefs, inventory, writeTokens, apply, cli };
}
