import { test } from '@playwright/test';
import fs from 'node:fs';
import { setupApp, DETAIL_ACTIVITY_ID } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

const PAL = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-ivan-Documents-proyects-rendimiento-calculadora-ivan--claude-worktrees-capa6-ejecucion-bee015/8ad45ad5-9ef4-43a5-8a5f-86aeaa1fbc84/scratchpad/paleta/palettes.json', 'utf8'));
const RECOLOR = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-ivan-Documents-proyects-rendimiento-calculadora-ivan--claude-worktrees-capa6-ejecucion-bee015/8ad45ad5-9ef4-43a5-8a5f-86aeaa1fbc84/scratchpad/paleta/recolor.json', 'utf8'));
const OUT = '/private/tmp/claude-501/-Users-ivan-Documents-proyects-rendimiento-calculadora-ivan--claude-worktrees-capa6-ejecucion-bee015/8ad45ad5-9ef4-43a5-8a5f-86aeaa1fbc84/scratchpad/paleta/shots';
const DIRS = ['actual', ...Object.keys(PAL)];
const SCREENS = [
  { name: 'dashboard', path: '/' },
  { name: 'detalle', path: `/activity/${DETAIL_ACTIVITY_ID}`, via: '/history' },
  { name: 'salud', path: '/health' },
];
test.describe.configure({ mode: 'parallel' });
for (const dir of DIRS) for (const theme of ['light', 'dark']) for (const w of [1440, 390]) for (const s of SCREENS) {
  test(`${dir}-${theme}-${w}-${s.name}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 });
    await setupApp(page, { authenticated: true, theme });
    if (dir !== 'actual') {
      await page.addInitScript((css) => {
        document.addEventListener('DOMContentLoaded', () => {
          const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
        });
      }, PAL[dir]);
    }
    await gotoReady(page, s.path, s.via);
    if (dir !== 'actual') {
      await page.evaluate((map) => {
        const hex = (c) => {
          const m = c && c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
          return m ? '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('') : (c || '').toLowerCase();
        };
        for (const el of document.querySelectorAll('body *')) {
          for (const a of ['stroke', 'fill', 'stop-color', 'color']) {
            const v = el.getAttribute(a);
            if (v && map[hex(v)]) el.setAttribute(a, map[hex(v)]);
          }
          const cs = getComputedStyle(el);
          for (const [prop, css] of [['backgroundColor', 'background-color'], ['color', 'color'], ['stroke', 'stroke'], ['fill', 'fill'], ['stopColor', 'stop-color']]) {
            const n = map[hex(cs[prop])];
            if (n && el.style[prop] && map[hex(el.style[prop])]) el.style.setProperty(css, n);
            else if (n && (el.closest('svg') || el.style[prop])) el.style.setProperty(css, n);
          }
        }
      }, RECOLOR[dir][theme]);
    }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: `${OUT}/${dir}-${theme}-${w}-${s.name}.jpg`, type: 'jpeg', quality: 82 });
  });
}
