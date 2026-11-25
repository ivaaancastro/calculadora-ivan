/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivityStreams } from '../../components/activity/detail/useActivityStreams';

const STREAMS = { latlng: { data: [[40.4, -3.7], [40.41, -3.69]] }, time: { data: [0, 30] } };
const base = { id: 'a-1', type: 'Run', strava_id: null, streams_data: null };

// BUG-13: el detalle guardaba el id en la primera pasada y no volvía a leer los streams.
describe('useActivityStreams', () => {
    it('usa los streams que llegan más tarde aunque la primera petición no traiga nada', async () => {
        const fetchStreams = vi.fn().mockResolvedValue(null);
        const { result, rerender } = renderHook(({ a }) => useActivityStreams(a, fetchStreams), {
            initialProps: { a: base },
        });
        await waitFor(() => expect(result.current.loadingStreams).toBe(false));
        expect(result.current.streams).toBeNull();
        expect(fetchStreams).toHaveBeenCalledWith('a-1', null);

        rerender({ a: { ...base, streams_data: STREAMS } });
        await waitFor(() => expect(result.current.streams).toBe(STREAMS));
        expect(fetchStreams).toHaveBeenCalledTimes(1);
    });

    it('pide solo los streams de esa actividad cuando faltan, una vez por clave', async () => {
        const fetchStreams = vi.fn().mockResolvedValue(STREAMS);
        const { result, rerender } = renderHook(({ a }) => useActivityStreams(a, fetchStreams), {
            initialProps: { a: { ...base, strava_id: 99 } },
        });
        await waitFor(() => expect(result.current.streams).toBe(STREAMS));
        // Un nuevo objeto con los mismos datos (p. ej. la caché se rehace) no repite la petición.
        rerender({ a: { ...base, strava_id: 99 } });
        expect(fetchStreams).toHaveBeenCalledTimes(1);
        expect(fetchStreams).toHaveBeenCalledWith('a-1', 99);
        expect(result.current.loadingStreams).toBe(false);
    });

    it('no pide nada si la actividad ya trae streams', () => {
        const fetchStreams = vi.fn();
        const { result } = renderHook(() => useActivityStreams({ ...base, streams_data: STREAMS }, fetchStreams));
        expect(result.current.streams).toBe(STREAMS);
        expect(result.current.loadingStreams).toBe(false);
        expect(fetchStreams).not.toHaveBeenCalled();
    });
});
