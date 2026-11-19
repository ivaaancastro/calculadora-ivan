#!/usr/bin/env node
/**
 * Clasifica un diff en carril `fast` o `visual` (spec-verificacion-rapida, RF1).
 *   node scripts/changed-lane.mjs [--base develop] [--files a,b,c] [--github-output]
 * Imprime `fast` o `visual` y, en `visual`, los ficheros que lo provocan (stderr).
 * Con --github-output añade `visual=true|false` a $GITHUB_OUTPUT (job `changes` del CI).
 * Regla conservadora: ante la duda, visual. Los tests y la documentación nunca lo son.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Rutas que nunca cambian lo que se ve (se evalúan primero). */
const NEVER_VISUAL = [/^docs\//, /^src\/__tests__\//, /\.test\.jsx?$/, /\.md$/, /^migrations\//, /^supabase\//];

/** Rutas que pueden cambiar estilos, clases Tailwind, tokens o la capa visual. */
const VISUAL = [
  /^src\/.*\.(jsx|css)$/, // las clases Tailwind viven en JSX
  /^src\/styles\//,
  /^src\/components\/.*\.js$/, // recetas de clases (buttonClasses.js…)
  /Classes\.js$/,
  /^src\/utils\/chartTheme/,
  /^(tailwind|postcss)\.config\.(js|cjs)$/,
  /^index\.html$/,
  /^public\//,
  /^e2e\/(support|tools|__screenshots__)\//,
  /^e2e\/.*(visual|layout|touch|gestures|shell)(-v2)?\.spec\.js$/,
  /^scripts\/style-diff\.mjs$/,
  /^playwright\.config\.js$/,
  /^\.github\/workflows\/ci\.yml$/, // los jobs de style-diff viven ahí: cambiarlos se prueba con el propio style-diff
  /^scripts\/(ci-style-dump|fetch-style-baseline|verify-layer)\.sh$/,
];

export function classify(files) {
  const visualFiles = files.filter((f) => !NEVER_VISUAL.some((r) => r.test(f)) && VISUAL.some((r) => r.test(f)));
  return { lane: visualFiles.length ? 'visual' : 'fast', visualFiles };
}

function changedFiles(base) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
  const ref = [`origin/${base}`, base].find((r) => {
    try { git('rev-parse', '--verify', '--quiet', r); return true; } catch { return false; }
  });
  if (!ref) throw new Error(`No existe la rama base ${base}`);
  const mergeBase = git('merge-base', ref, 'HEAD');
  const committed = git('diff', '--name-only', `${mergeBase}...HEAD`);
  const working = git('diff', '--name-only', 'HEAD'); // lo no commiteado también cuenta
  return [...new Set(`${committed}\n${working}`.split('\n').filter(Boolean))];
}

function main(argv) {
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const files = opt('--files') !== undefined ? opt('--files').split(',').filter(Boolean) : changedFiles(opt('--base') || 'develop');
  const { lane, visualFiles } = classify(files);
  if (visualFiles.length) console.error(`visual por: ${visualFiles.slice(0, 10).join(', ')}${visualFiles.length > 10 ? ` … (+${visualFiles.length - 10})` : ''}`);
  console.log(lane);
  if (argv.includes('--github-output') && process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `visual=${lane === 'visual'}\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main(process.argv.slice(2));
