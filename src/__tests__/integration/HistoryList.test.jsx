/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryList } from '../../components/dashboard/HistoryList';

const mockActivities = [
    {
        id: 'act-1',
        name: 'Rodaje Suave Bici',
        type: 'Ride',
        date: '2026-03-01T10:00:00Z',
        duration: 90,
        distance: 45000,
        calories: 800,
        tss: 65,
    },
    {
        id: 'act-2',
        name: 'Series en Pista',
        type: 'Run',
        date: '2026-03-02T18:00:00Z',
        duration: 50,
        distance: 10000,
        calories: 600,
        tss: 75,
    },
    {
        id: 'act-3',
        name: 'Gimnasio Fuerza Piernas',
        type: 'Gym',
        date: '2026-03-03T09:00:00Z',
        duration: 60,
        distance: 0,
        calories: 350,
        tss: 30,
    }
];

describe('HistoryList Component', () => {
    it('muestra el estado vacío cuando no hay actividades', () => {
        render(<HistoryList activities={[]} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(screen.getByText('No hay resultados')).toBeTruthy();
        expect(screen.getByText('0 Actividades')).toBeTruthy();
    });

    it('renderiza el resumen de actividades correctamente', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(screen.getByText('3 Actividades')).toBeTruthy();
    });

    it('filtra por término de búsqueda en tiempo real', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        
        const searchInput = screen.getByPlaceholderText('Buscar por título...');
        fireEvent.change(searchInput, { target: { value: 'Pista' } });

        expect(screen.getByText('1 Actividades')).toBeTruthy();
        expect(screen.getByText('Series en Pista')).toBeTruthy();
        expect(screen.queryByText('Rodaje Suave Bici')).toBeNull();
    });

    it('filtra por deporte mediante el selector', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        
        const selectInputs = screen.getAllByRole('combobox');
        const sportSelect = selectInputs[0]; // Primer selector es el deporte
        
        fireEvent.change(sportSelect, { target: { value: 'bike' } });

        expect(screen.getByText('1 Actividades')).toBeTruthy();
        expect(screen.getByText('Rodaje Suave Bici')).toBeTruthy();
        expect(screen.queryByText('Series en Pista')).toBeNull();
    });

    it('ejecuta onSelectActivity al hacer clic en una actividad', () => {
        const onSelect = vi.fn();
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={onSelect} />);

        const activityRow = screen.getByText('Rodaje Suave Bici').closest('div[data-index]');
        expect(activityRow).toBeTruthy();
        fireEvent.click(activityRow);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'act-1' }));
    });

    it('ejecuta onDelete sin propagar el clic a onSelectActivity', () => {
        const onSelect = vi.fn();
        const onDelete = vi.fn();
        render(<HistoryList activities={mockActivities} onDelete={onDelete} onSelectActivity={onSelect} />);

        const deleteButtons = screen.getAllByTitle('Eliminar actividad');
        expect(deleteButtons.length).toBeGreaterThan(0);
        
        fireEvent.click(deleteButtons[0]);

        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();
    });
});
