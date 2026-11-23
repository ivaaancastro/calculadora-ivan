/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../hooks/useUiMode', () => ({ useUiMode: () => ({ isV2: true }) }));
import { HistoryList } from '../../components/dashboard/HistoryList';

const acts = [
    { id: 'a', name: 'Salida larga', type: 'Ride', date: '2026-03-11T10:00:00', duration: 120, distance: 60000, calories: 900, tss: 80 },
    { id: 'b', name: 'Rodaje', type: 'Run', date: '2026-03-10T10:00:00', duration: 45, distance: 8000, calories: 400, tss: 40 },
    { id: 'c', name: 'Fuerza', type: 'Gym', date: '2026-03-02T10:00:00', duration: 60, distance: 0, calories: 300, tss: 0 },
];

describe('HistoryList v2', () => {
    it('intercala una cabecera por semana con sus totales', () => {
        const { container } = render(<HistoryList activities={acts} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        const weeks = container.querySelectorAll('[data-history="week"]');
        expect(weeks).toHaveLength(2);
        expect(weeks[0].textContent).toContain('Semana del 9 mar');
        expect(weeks[0].textContent).toContain('2 act');
        expect(weeks[0].textContent).toContain('120 TSS');
        expect(weeks[1].textContent).toContain('Semana del 2 mar');
        expect(container.querySelectorAll('[data-history="row"]')).toHaveLength(3);
    });

    it('barra de carga solo en filas con TSS', () => {
        const { container } = render(<HistoryList activities={acts} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(container.querySelectorAll('[data-history="tss-bar"]')).toHaveLength(2);
        expect(screen.getByTitle('Fuerza')).toBeTruthy();
    });
});
