/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmDeleteActivity } from '../../hooks/useConfirmDeleteActivity';

const act1 = { id: 'a1', name: 'Rodaje' };

describe('useConfirmDeleteActivity', () => {
  it('request abre y cancel cierra sin borrar', () => {
    const del = vi.fn();
    const { result } = renderHook(() => useConfirmDeleteActivity(del));
    act(() => result.current.request(act1));
    expect(result.current.pending).toBe(act1);
    act(() => result.current.cancel());
    expect(result.current.pending).toBeNull();
    expect(del).not.toHaveBeenCalled();
  });

  it('éxito: borra, cierra y llama a onDeleted', async () => {
    const del = vi.fn().mockResolvedValue(true);
    const done = vi.fn();
    const { result } = renderHook(() => useConfirmDeleteActivity(del, done));
    act(() => result.current.request(act1));
    await act(() => result.current.confirm());
    expect(del).toHaveBeenCalledWith('a1');
    expect(done).toHaveBeenCalledWith(act1);
    expect(result.current.pending).toBeNull();
    expect(result.current.busy).toBe(false);
  });

  it('fallo (false o excepción): sigue abierto y no llama a onDeleted', async () => {
    for (const del of [vi.fn().mockResolvedValue(false), vi.fn().mockRejectedValue(new Error('red'))]) {
      const done = vi.fn();
      const { result } = renderHook(() => useConfirmDeleteActivity(del, done));
      act(() => result.current.request(act1));
      await act(() => result.current.confirm());
      expect(result.current.pending).toBe(act1);
      expect(result.current.busy).toBe(false);
      expect(done).not.toHaveBeenCalled();
    }
  });

  it('un segundo confirm mientras borra se ignora y cancel no cierra', async () => {
    let resolve;
    const del = vi.fn(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useConfirmDeleteActivity(del));
    act(() => result.current.request(act1));
    let p1;
    act(() => { p1 = result.current.confirm(); });
    await act(() => result.current.confirm());
    act(() => result.current.cancel());
    expect(del).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(act1);
    await act(async () => { resolve(true); await p1; });
    expect(result.current.pending).toBeNull();
  });
});
