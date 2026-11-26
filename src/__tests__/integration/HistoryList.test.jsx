/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryList } from '../../components/dashboard/HistoryList';

/** Único recuento de la pantalla (RF-D1): la cifra del resumen; `data-count` es su valor final. */
const count = () => document.querySelector('[data-history="summary-count"]')?.getAttribute('data-count');

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
        expect(count()).toBeUndefined();
    });

    it('renderiza el resumen de actividades correctamente', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(count()).toBe('3');
        expect(screen.queryByText(/^\d+ Actividades$/i)).toBeNull();
    });

    it('filtra por término de búsqueda en tiempo real', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        
        const searchInput = screen.getByPlaceholderText('Buscar por título...');
        fireEvent.change(searchInput, { target: { value: 'Pista' } });

        expect(count()).toBe('1');
        expect(screen.getByText('Series en Pista')).toBeTruthy();
        expect(screen.queryByText('Rodaje Suave Bici')).toBeNull();
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

    it('A11Y-4: la fila es un botón enfocable que se abre con Enter o Espacio', () => {
        const onSelect = vi.fn();
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={onSelect} />);
        const row = screen.getByRole('button', { name: /^Abrir Rodaje Suave Bici/ });
        expect(row).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(row, { key: 'Enter' });
        fireEvent.keyDown(row, { key: ' ' });
        expect(onSelect).toHaveBeenCalledTimes(2);
        // Las teclas sobre el botón «Más acciones» no abren la actividad.
        const menu = row.querySelector('[data-history="menu"]');
        fireEvent.keyDown(menu, { key: 'Enter' });
        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(menu).toHaveAttribute('aria-label', 'Más acciones de Rodaje Suave Bici');
        expect(menu).toHaveAttribute('aria-haspopup', 'menu');
        // La fila ya no lleva papelera: borrar vive en el menú (RF-D8).
        expect(row.querySelector('[data-history="delete"]')).toBeNull();
    });

    it('COP-1: el deporte se muestra en español', () => {
        render(<HistoryList activities={mockActivities} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(screen.getAllByText('Ciclismo').length).toBeGreaterThan(0);
        expect(screen.queryByText('Ride')).toBeNull();
    });

    it('pide confirmación antes de onDelete y no propaga el clic a onSelectActivity', async () => {
        const onSelect = vi.fn();
        const onDelete = vi.fn().mockResolvedValue(true);
        render(<HistoryList activities={mockActivities} onDelete={onDelete} onSelectActivity={onSelect} />);

        const menus = screen.getAllByRole('button', { name: /^Más acciones/ });
        expect(menus.length).toBeGreaterThan(0);
        fireEvent.click(menus[0]);
        expect(menus[0]).toHaveAttribute('aria-expanded', 'true');
        const item = screen.getByRole('menuitem', { name: 'Eliminar actividad' });
        expect(item).toHaveFocus();
        fireEvent.click(item);

        expect(onDelete).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
        await waitFor(() => expect(onDelete).toHaveBeenCalledWith('act-3'));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(onSelect).not.toHaveBeenCalled();
    });
});

const weekActs = [
    { id: 'a', name: 'Salida larga', type: 'Ride', date: '2026-03-11T10:00:00', duration: 120, distance: 60000, calories: 900, tss: 80 },
    { id: 'b', name: 'Rodaje', type: 'Run', date: '2026-03-10T10:00:00', duration: 45, distance: 8000, calories: 400, tss: 40 },
    { id: 'c', name: 'Fuerza', type: 'Gym', date: '2026-03-02T10:00:00', duration: 60, distance: 0, calories: 300, tss: 0 },
];

describe('HistoryList: semanas, chips y panel', () => {
    it('intercala una cabecera por semana con sus totales', () => {
        const { container } = render(<HistoryList activities={weekActs} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        const weeks = container.querySelectorAll('[data-history="week"]');
        expect(weeks).toHaveLength(2);
        expect(weeks[0].textContent).toContain('Semana del 9 mar');
        expect(weeks[0].textContent).toContain('2 act');
        expect(weeks[0].textContent).toContain('120 TSS');
        expect(weeks[1].textContent).toContain('Semana del 2 mar');
        expect(container.querySelectorAll('[data-history="row"]')).toHaveLength(3);
    });

    it('barra de carga solo en filas con TSS', () => {
        const { container } = render(<HistoryList activities={weekActs} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(container.querySelectorAll('[data-history="tss-bar"]')).toHaveLength(2);
        expect(screen.getByTitle('Fuerza')).toBeTruthy();
    });

    it('los chips filtran por deporte y el panel reparte el tiempo', () => {
        const { container } = render(<HistoryList activities={weekActs} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        expect(container.querySelector('[data-history="breakdown"]').textContent).toContain('Ciclismo');
        fireEvent.click(screen.getByRole('button', { name: 'Carrera' }));
        expect(container.querySelectorAll('[data-history="row"]')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Carrera' }).getAttribute('aria-pressed')).toBe('true');
    });

    it('sin resultados ofrece quitar filtros', () => {
        render(<HistoryList activities={weekActs} onDelete={vi.fn()} onSelectActivity={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Natación' }));
        expect(screen.getByText('No hay resultados')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
        expect(screen.queryByText('No hay resultados')).toBeNull();
    });
});
