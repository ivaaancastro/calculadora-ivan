/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mutateAsync, toast } = vi.hoisted(() => ({ mutateAsync: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: toast }));
vi.mock('../../store/useAppStore', () => ({
  useAppStore: () => ({ timeRange: 'all', setTimeRange: vi.fn(), settings: {} }),
}));
vi.mock('../../hooks/queries/useProfileQuery', () => ({
  useProfileQuery: () => ({ query: { isLoading: false }, updateProfileMutation: {} }),
}));
vi.mock('../../hooks/queries/usePlannedWorkoutsQuery', () => ({
  usePlannedWorkoutsQuery: () => ({ query: { isLoading: false }, addWorkoutMutation: {}, updateWorkoutMutation: {}, deleteWorkoutMutation: {} }),
}));
vi.mock('../../hooks/queries/useActivitiesQuery', () => ({
  useActivitiesQuery: () => ({ query: { isLoading: false, data: [] }, deleteActivityMutation: { mutateAsync }, clearDbMutation: {} }),
}));

import { useActivitiesData } from '../../hooks/useActivitiesData';

describe('useActivitiesData.deleteActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve true y avisa si sale bien', async () => {
    mutateAsync.mockResolvedValue('a1');
    const { result } = renderHook(() => useActivitiesData());
    expect(await result.current.deleteActivity('a1')).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Actividad borrada.');
  });

  it('devuelve false y avisa del error si falla', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mutateAsync.mockRejectedValue(new Error('red'));
    const { result } = renderHook(() => useActivitiesData());
    expect(await result.current.deleteActivity('a1')).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('No se pudo borrar la actividad.');
  });
});
