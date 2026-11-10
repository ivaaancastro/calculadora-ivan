import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// spec-rediseno-02-c3 (Capa 3). La shell tiene un solo sitio para sus números: tokens.css.
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const tokensPath = join(ROOT, 'src/styles/tokens.css');
const css = readFileSync(tokensPath, 'utf8');
const token = (name) => css.match(new RegExp(`${name}:\\s*([^;\\n]+);`))?.[1]?.trim();

describe('tokens de la shell', () => {
  it('declara la altura de las barras en un solo sitio', () => {
    expect(token('--nav-h')).toBe('3.75rem');
    expect(token('--nav-h-total')).toBe('calc(var(--nav-h) + env(safe-area-inset-top, 0px))');
    expect(token('--bottom-nav-h')).toBe('3.375rem');
    expect(token('--bottom-nav-gap')).toBe('0.75rem');
    expect(token('--bottom-nav-reserve')).toBe('8rem');
  });

  it('declara la escala de capas completa y ordenada', () => {
    expect(token('--z-sticky')).toBe('20');
    expect(token('--z-nav')).toBe('30');
    expect(token('--z-nav-menu')).toBe('40');
    expect(token('--z-sheet')).toBe('50');
    expect(token('--z-tooltip')).toBe('55');
    expect(token('--z-modal')).toBe('60');
    expect(token('--z-floating')).toBe('80');
    expect(token('--z-map')).toBe('400');

    // Los modales ganan a los tooltips y el panel flotante del Calendario, a los dos.
    const order = ['sticky', 'nav', 'nav-menu', 'sheet', 'tooltip', 'modal', 'floating', 'map'].map((n) =>
      Number(token(`--z-${n}`)),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('conserva el ganador de cada pareja que de verdad se solapa', () => {
    // La renumeración de D5 cambia los números; el que gana tiene que ser el mismo de antes.
    // Cada fila: [el que queda debajo, el que queda encima, valor anterior de ambos].
    const pairs = [
      ['sticky', 'nav', 'banner de subida (30) bajo la cabecera (40)'],
      ['nav', 'nav-menu', 'menú de la cabecera (50) sobre la cabecera (40)'],
      ['nav', 'sheet', 'modales (50) sobre la cabecera (40)'],
      ['nav', 'floating', 'panel del Calendario (100) sobre la cabecera (40)'],
      ['tooltip', 'modal', 'visor del Calendario (60) sobre los tooltips (50)'],
      ['sheet', 'tooltip', 'tooltip sobre la hoja: antes empataban y ganaba por orden del DOM'],
      ['floating', 'map', 'controles del mapa (400) sobre todo lo de la app'],
    ];
    for (const [below, above, why] of pairs) {
      expect(Number(token(`--z-${below}`)), why).toBeLessThan(Number(token(`--z-${above}`)));
    }
  });

  it('Tailwind expone un nombre por token de capa', () => {
    const config = readFileSync(join(ROOT, 'tailwind.config.js'), 'utf8');
    for (const name of ['sticky', 'nav', 'nav-menu', 'sheet', 'tooltip', 'modal', 'floating', 'map', 'toast']) {
      const key = name.includes('-') ? `'${name}'` : name;
      expect(config).toContain(`${key}: 'var(--z-${name})'`);
    }
  });

  it('ninguna pantalla vuelve a escribir el alto de las barras', () => {
    const offenders = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (entry !== '__tests__') walk(full);
        } else if (/\.(jsx?|css)$/.test(entry) && full !== tokensPath) {
          const lines = readFileSync(full, 'utf8').split('\n');
          lines.forEach((line, i) => {
            if (/100dvh-56px|top-\[52px\]|h-\[54px\]|\b56px\b|\b52px\b/.test(line)) {
              offenders.push(`${relative(ROOT, full)}:${i + 1}`);
            }
          });
        }
      }
    };
    walk(join(ROOT, 'src'));
    expect(offenders).toEqual([]);
  });
});
