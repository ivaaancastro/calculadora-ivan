// @vitest-environment jsdom
/**
 * `useUiMode` (spec-rediseno-02-c3-skin, RF9): la piel v2 se enciende y se apaga
 * escribiendo un atributo, sin recargar. El módulo guarda estado global, así que
 * cada prueba lo importa de nuevo con `vi.resetModules()`.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadHook = async () => {
  vi.resetModules();
  const { useUiMode } = await import('../../hooks/useUiMode.js');
  return useUiMode;
};

beforeEach(() => {
  document.documentElement.removeAttribute('data-ui');
  localStorage.clear();
});

afterEach(() => {
  document.documentElement.removeAttribute('data-ui');
  localStorage.clear();
});

describe('useUiMode', () => {
  it('arranca en v1 y sin atributo', async () => {
    const useUiMode = await loadHook();
    const { result } = renderHook(() => useUiMode());

    expect(result.current.ui).toBe('v1');
    expect(result.current.isV2).toBe(false);
    expect(document.documentElement.hasAttribute('data-ui')).toBe(false);
  });

  it('lee el atributo que index.html ya aplicó antes del primer pintado', async () => {
    document.documentElement.dataset.ui = 'v2';

    const useUiMode = await loadHook();
    const { result } = renderHook(() => useUiMode());

    expect(result.current.ui).toBe('v2');
    expect(result.current.isV2).toBe(true);
  });

  it('setUi("v2") escribe atributo y localStorage; setUi("v1") los retira', async () => {
    const useUiMode = await loadHook();
    const { result } = renderHook(() => useUiMode());

    act(() => result.current.setUi('v2'));
    expect(document.documentElement.dataset.ui).toBe('v2');
    expect(localStorage.getItem('ui')).toBe('v2');

    act(() => result.current.setUi('v1'));
    expect(document.documentElement.hasAttribute('data-ui')).toBe(false);
    expect(localStorage.getItem('ui')).toBe('v1');
  });

  it('toggleUi alterna y sincroniza a todos los suscriptores', async () => {
    const useUiMode = await loadHook();
    const first = renderHook(() => useUiMode());
    const second = renderHook(() => useUiMode());

    act(() => first.result.current.toggleUi());
    expect(first.result.current.isV2).toBe(true);
    expect(second.result.current.isV2).toBe(true);
    expect(document.documentElement.dataset.ui).toBe('v2');

    act(() => second.result.current.toggleUi());
    expect(first.result.current.isV2).toBe(false);
    expect(second.result.current.isV2).toBe(false);
    expect(localStorage.getItem('ui')).toBe('v1');
  });

  it('un valor desconocido cae en v1 y deja el atributo ausente (M2)', async () => {
    const useUiMode = await loadHook();
    const { result } = renderHook(() => useUiMode());

    act(() => result.current.setUi('v3'));
    expect(result.current.isV2).toBe(false);
    expect(document.documentElement.hasAttribute('data-ui')).toBe(false);
    expect(localStorage.getItem('ui')).toBe('v1');
  });
});
