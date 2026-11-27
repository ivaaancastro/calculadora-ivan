// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const read = (p) => readFileSync(`${process.cwd()}/${p}`, 'utf8');
const html = read('index.html');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const run = () => new Function(script)();
const meta = () => document.querySelector('meta[name="theme-color"]').getAttribute('content');
const system = (dark) => { window.matchMedia = () => ({ matches: dark }); };

/** `--canvas` de tokens.css en :root o .dark, como hex. */
const canvas = (selector) => {
    const css = read('src/styles/tokens.css');
    const blocks = css.match(new RegExp(`^${selector.replace('.', '\\.')} \\{[^}]*\\}`, 'gm'));
    const [, rgb] = blocks.join('\n').match(/--canvas: (\d+ \d+ \d+);/);
    return `#${rgb.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
};

describe('index.html: primera pintura', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';
        document.head.innerHTML = '<meta name="theme-color" content="">';
    });
    afterEach(() => vi.restoreAllMocks());

    it.each([
        [null, false, false],
        [null, true, true],
        ['light', true, false],
        ['dark', false, true],
        ['azul', true, true],
    ])('guardado %s y sistema oscuro %s', (stored, systemDark, expected) => {
        if (stored) localStorage.setItem('theme', stored);
        system(systemDark);
        run();
        expect(document.documentElement.classList.contains('dark')).toBe(expected);
        expect(meta()).toBe(canvas(expected ? '.dark' : ':root'));
    });

    it('no falla si el almacenamiento lanza', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
        system(true);
        expect(run).not.toThrow();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('la meta theme-color va antes del script que la usa', () => {
        expect(html.indexOf('name="theme-color"')).toBeLessThan(html.indexOf('<script>'));
    });
});
