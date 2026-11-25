#!/usr/bin/env node
/**
 * Verificación local (spec-capa6-v2-premium, RF-A4). `npm run verify`.
 *   node scripts/verify.mjs [--e2e <spec> [--project <p>]]
 * lint, lint:ui, lint:colors, lint:motion, lint:orphans, vitest y build, en silencio: solo el resumen con la
 * duración de cada paso o, si falla, la cola de su salida. `--e2e <spec>` añade ese E2E en local.
 * El E2E completo lo ejecuta el CI en cada PR.
 */
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const e2eSpec = opt('--e2e');
const project = opt('--project');

const steps = [
  ['lint', 'npm', ['run', '-s', 'lint']],
  ['lint:ui', 'npm', ['run', '-s', 'lint:ui']],
  ['lint:colors', 'npm', ['run', '-s', 'lint:colors']],
  ['lint:motion', 'npm', ['run', '-s', 'lint:motion']],
  ['lint:orphans', 'npm', ['run', '-s', 'lint:orphans']],
  ['vitest', 'npx', ['vitest', 'run', '--reporter=dot']],
  ['build', 'npm', ['run', '-s', 'build']],
];
if (e2eSpec) {
  steps.push([
    `e2e ${e2eSpec}${project ? ` (${project})` : ''}`,
    'npx',
    ['playwright', 'test', e2eSpec, ...(project ? [`--project=${project}`] : []), '--reporter=dot'],
  ]);
}

console.log(`verify · loadavg ${os.loadavg()[0].toFixed(1)}`);
const t0 = Date.now();
const rows = [];
let failed = false;
for (const [name, cmd, args] of steps) {
  const s = Date.now();
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const secs = ((Date.now() - s) / 1000).toFixed(1);
  const ok = r.status === 0;
  rows.push(`${ok ? '✓' : '✗'} ${name.padEnd(28)} ${secs.padStart(6)} s`);
  if (!ok) {
    console.log(rows.join('\n'));
    console.log(`\n--- salida de «${name}» (últimas 40 líneas) ---`);
    console.log(`${r.stdout}${r.stderr}`.trim().split('\n').slice(-40).join('\n'));
    failed = true;
    break;
  }
}
if (!failed) console.log(rows.join('\n'));
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)} s${failed ? ' — FALLÓ' : ' — OK'}`);
process.exit(failed ? 1 : 0);
