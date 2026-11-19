#!/usr/bin/env node
/**
 * Verificación local por carriles (spec-verificacion-rapida, RF2). `npm run verify`.
 *   node scripts/verify.mjs [--lane fast|visual] [--e2e <spec> [--project <p>]]
 * Carril rápido (también el visual en local, spec v0.2/D7): lint, lint:ui, lint:colors, vitest, build.
 * Todo en silencio: solo resumen con la duración de cada paso o, si falla, la cola de su salida.
 * `--e2e <spec>` añade ese E2E en Docker (bajo el mutex, 2 workers); solo hace falta si hay que
 * regenerar capturas. El E2E completo y el style-diff los hace el CI en cada PR.
 */
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const e2eSpec = opt('--e2e');
const project = opt('--project');

const lane = opt('--lane') || spawnSync('node', ['scripts/changed-lane.mjs'], { encoding: 'utf8' }).stdout.trim() || 'fast';

const steps = [
  ['lint', 'npm', ['run', '-s', 'lint']],
  ['lint:ui', 'npm', ['run', '-s', 'lint:ui']],
  ['lint:colors', 'npm', ['run', '-s', 'lint:colors']],
  ['lint:motion', 'npm', ['run', '-s', 'lint:motion']],
  ['vitest', 'npx', ['vitest', 'run', '--reporter=dot']],
  ['build', 'npm', ['run', '-s', 'build']],
];
if (e2eSpec) {
  steps.push([
    `e2e ${e2eSpec}${project ? ` (${project})` : ''}`,
    'bash',
    ['scripts/e2e-docker.sh', e2eSpec, ...(project ? [`--project=${project}`] : []), '--reporter=dot'],
  ]);
}

console.log(`verify · carril ${lane} · loadavg ${os.loadavg()[0].toFixed(1)}`);
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
if (lane === 'visual' && !failed) {
  console.log('Carril visual: el CI ejecutará E2E completo y style-diff. Al cerrar la capa: npm run verify:layer.');
}
process.exit(failed ? 1 : 0);
