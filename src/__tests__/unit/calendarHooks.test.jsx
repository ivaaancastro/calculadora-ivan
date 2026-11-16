/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarDate } from '../../hooks/useCalendarDate';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useWorkoutDragDrop } from '../../hooks/useWorkoutDragDrop';
import { usePlanEditor } from '../../hooks/usePlanEditor';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => sessionStorage.clear());

describe('useCalendarDate', () => {
    it('restaura y persiste la fecha, y navega por meses', () => {
        sessionStorage.setItem('forma_calendar_date', new Date(2026, 5, 10).toISOString());
        const { result } = renderHook(() => useCalendarDate());
        expect([result.current.year, result.current.month]).toEqual([2026, 5]);
        act(() => result.current.nextMonth());
        expect(result.current.month).toBe(6);
        expect(new Date(sessionStorage.getItem('forma_calendar_date')).getMonth()).toBe(6);
        act(() => result.current.prevMonth());
        act(() => result.current.prevMonth());
        expect(result.current.month).toBe(4);
    });
});

describe('useCalendarData', () => {
    it('deriva agrupación, PMC y cuadrícula', () => {
        const { result } = renderHook(() => useCalendarData({
            activities: [{ id: 1, date: '2026-06-15T08:00:00' }], plannedWorkouts: [],
            chartData: [{ date: '2026-06-14', ctl: 1, atl: 1 }], year: 2026, month: 5,
        }));
        expect(result.current.activitiesByDate['2026-06-15']).toHaveLength(1);
        expect(result.current.pmcByDate['2026-06-14'].ctl).toBe(1);
        expect(result.current.calendarGrid).toHaveLength(5);
        expect(result.current.fullPmcByDate['2026-06-14']).toBeDefined();
    });
});

describe('useWorkoutDragDrop', () => {
    const ev = () => ({ preventDefault: vi.fn(), dataTransfer: { setData: vi.fn() } });
    it('mueve el entreno a otro día y no hace nada si es el mismo', async () => {
        const update = vi.fn().mockResolvedValue();
        const { result } = renderHook(() => useWorkoutDragDrop(update));
        act(() => result.current.handleDragStart(ev(), { id: 7, date: new Date(2026, 5, 15, 9).toISOString() }));
        act(() => result.current.handleDragOver(ev(), '2026-06-16'));
        expect(result.current.dragOverDate).toBe('2026-06-16');
        await act(() => result.current.handleDrop(ev(), new Date(2026, 5, 15, 12)));
        expect(update).not.toHaveBeenCalled();
        act(() => result.current.handleDragStart(ev(), { id: 7, date: new Date(2026, 5, 15, 9).toISOString() }));
        const target = new Date(2026, 5, 16);
        await act(() => result.current.handleDrop(ev(), target));
        expect(update).toHaveBeenCalledWith(7, { date: target.toISOString() });
        expect(result.current.dragOverDate).toBeNull();
    });
});

describe('usePlanEditor', () => {
    const setup = (over = {}) => {
        const fns = { addPlannedWorkout: vi.fn().mockResolvedValue(), updatePlannedWorkout: vi.fn().mockResolvedValue(), deletePlannedWorkout: vi.fn().mockResolvedValue() };
        return { fns, ...renderHook(() => usePlanEditor({ settings: {}, ...fns, ...over })) };
    };
    it('abre el modal, añade bloques, recalcula TSS/duración y guarda', async () => {
        const { result, fns } = setup();
        const date = new Date(2026, 5, 15);
        act(() => result.current.handleOpenPlanModal({ stopPropagation: () => { } }, date));
        expect(result.current.isModalOpen).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
        act(() => result.current.addBlock('main'));
        expect(result.current.newPlan.blocks).toHaveLength(1);
        expect(result.current.newPlan.duration).toBe(10); // auto-estimado
        await act(() => result.current.handleSavePlan());
        expect(fns.addPlannedWorkout).toHaveBeenCalledTimes(1);
        expect(fns.addPlannedWorkout.mock.calls[0][0]).toMatchObject({ type: 'Run', name: 'Plan Run' });
        expect(result.current.isModalOpen).toBe(false);
        expect(document.body.style.overflow).toBe('');
        expect(result.current.newPlan.blocks).toEqual([]);
    });
    it('edita un plan existente y llama a update', async () => {
        const { result, fns } = setup();
        act(() => result.current.handleEditPlan({ id: 5, date: '2026-06-15T10:00:00', type: 'Ride', name: 'N', description: JSON.stringify({ blocks: [] }) }));
        expect(result.current.editingPlanId).toBe(5);
        await act(() => result.current.handleSavePlan());
        expect(fns.updatePlannedWorkout).toHaveBeenCalledWith(5, expect.objectContaining({ type: 'Ride', name: 'N' }));
    });
    it('pega texto, aplica plantilla y reordena', () => {
        const { result } = setup();
        act(() => result.current.setPasteText('10m calentamiento\n30m z3'));
        act(() => result.current.handleMagicPaste());
        expect(result.current.newPlan.blocks.map(b => b.type)).toEqual(['warmup', 'main']);
        expect(result.current.pasteText).toBe('');
        act(() => result.current.handleDragBlockStart({ dataTransfer: {} }, 0));
        act(() => result.current.handleDropBlock({ preventDefault: () => { } }, 1));
        expect(result.current.newPlan.blocks.map(b => b.type)).toEqual(['main', 'warmup']);
        act(() => result.current.applyTemplate({ name: 'T', tss: 30, duration: 20, blocks: [{ id: 1, type: 'main', duration: 20, zone: 'Z2', unit: 'time' }] }));
        expect(result.current.newPlan.name).toBe('T');
    });
    it('borra con confirmación', async () => {
        const { result, fns } = setup();
        vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
        await act(() => result.current.handleDeletePlan({ stopPropagation: () => { } }, 3));
        expect(fns.deletePlannedWorkout).not.toHaveBeenCalled();
        await act(() => result.current.handleDeletePlan({ stopPropagation: () => { } }, 3));
        expect(fns.deletePlannedWorkout).toHaveBeenCalledWith(3);
    });
});
