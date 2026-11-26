/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarPage } from '../../components/pages/CalendarPage';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

const base = {
    activities: [{ id: 'a1', name: 'Rodaje', type: 'Run', date: new Date(2026, 5, 15, 8).toISOString(), tss: 50, duration: 40, distance: 8000 }],
    plannedWorkouts: [{ id: 'p1', name: 'Series', type: 'Run', date: new Date(2026, 5, 16, 8).toISOString(), tss: 70, duration: 50, description: JSON.stringify({ blocks: [] }) }],
    addPlannedWorkout: vi.fn(), updatePlannedWorkout: vi.fn(), deletePlannedWorkout: vi.fn(),
    currentMetrics: {}, settings: {}, chartData: [],
};

beforeEach(() => sessionStorage.setItem('forma_calendar_date', new Date(2026, 5, 10).toISOString()));

describe('CalendarPage (vista de mes)', () => {
    it('muestra el mes, actividades y planes, y navega', () => {
        render(<CalendarPage {...base} />);
        expect(screen.getByText(/junio de 2026/i)).toBeTruthy();
        expect(screen.getAllByText(/Rodaje/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Series/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByLabelText('Mes siguiente'));
        expect(screen.getByText(/julio de 2026/i)).toBeTruthy();
    });
    it('abre el visor al pulsar un entreno planificado', () => {
        render(<CalendarPage {...base} />);
        fireEvent.click(screen.getAllByText(/Series/)[0]);
        expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });
});
