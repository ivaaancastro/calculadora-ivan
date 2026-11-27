// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let system;
const fakeSystem = (dark) => {
    const subs = new Set();
    const mq = {
        matches: dark,
        addEventListener: (_, fn) => subs.add(fn),
        removeEventListener: (_, fn) => subs.delete(fn),
    };
    window.matchMedia = () => mq;
    return {
        subs,
        set(next) {
            mq.matches = next;
            subs.forEach((fn) => fn({ matches: next }));
        },
    };
};

const load = async () => {
    vi.resetModules();
    return import('../../hooks/useTheme');
};
const isDark = () => document.documentElement.classList.contains('dark');
const render = async () => {
    const { useTheme } = await load();
    return renderHook(() => useTheme());
};

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';
        document.head.innerHTML = '<meta name="theme-color" content="">';
        system = fakeSystem(false);
    });
    afterEach(() => vi.restoreAllMocks());

    it('sin preferencia guardada sigue al sistema', async () => {
        system = fakeSystem(true);
        const { result } = await render();
        expect(result.current.preference).toBe('system');
        expect(result.current.theme).toBe('dark');
        expect(isDark()).toBe(true);
        expect(localStorage.getItem('theme')).toBeNull();
    });

    it('un valor desconocido equivale a Sistema', async () => {
        localStorage.setItem('theme', 'azul');
        const { result } = await render();
        expect(result.current.preference).toBe('system');
    });

    it('en Sistema cambia en vivo, con un solo oyente', async () => {
        const { useTheme } = await load();
        const a = renderHook(() => useTheme());
        const b = renderHook(() => useTheme());
        act(() => system.set(true));
        expect(a.result.current.theme).toBe('dark');
        expect(b.result.current.theme).toBe('dark');
        expect(isDark()).toBe(true);
        expect(system.subs.size).toBe(1);
    });

    it('respeta la preferencia guardada aunque el sistema cambie', async () => {
        localStorage.setItem('theme', 'light');
        const { result } = await render();
        act(() => system.set(true));
        expect(result.current.theme).toBe('light');
        expect(isDark()).toBe(false);
    });

    it('elegir Oscuro lo guarda y volver a Sistema borra la clave', async () => {
        const { result } = await render();
        act(() => result.current.setPreference('dark'));
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(isDark()).toBe(true);
        act(() => result.current.setPreference('system'));
        expect(localStorage.getItem('theme')).toBeNull();
        expect(isDark()).toBe(false);
    });

    it('el interruptor fija el contrario y al volver al del sistema queda en Sistema', async () => {
        const { result } = await render();
        act(() => result.current.toggleTheme());
        expect(result.current.preference).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        act(() => result.current.toggleTheme());
        expect(result.current.preference).toBe('system');
        expect(localStorage.getItem('theme')).toBeNull();
    });

    it('theme-color toma --canvas del tema activo', async () => {
        const real = window.getComputedStyle.bind(window);
        vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
            el === document.documentElement
                ? { getPropertyValue: () => (isDark() ? ' 0 0 0' : ' 242 242 247') }
                : real(el));
        const meta = () => document.querySelector('meta[name="theme-color"]').getAttribute('content');
        const { result } = await render();
        expect(meta()).toBe('rgb(242, 242, 247)');
        act(() => result.current.toggleTheme());
        expect(meta()).toBe('rgb(0, 0, 0)');
    });

    it('con el almacenamiento roto carga y el interruptor funciona', async () => {
        const boom = () => { throw new Error('SecurityError'); };
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
        const { result } = await render();
        expect(result.current.theme).toBe('light');
        act(() => result.current.toggleTheme());
        expect(result.current.theme).toBe('dark');
    });

    it('sin matchMedia carga en claro', async () => {
        window.matchMedia = undefined;
        const { result } = await render();
        expect(result.current.theme).toBe('light');
    });
});
