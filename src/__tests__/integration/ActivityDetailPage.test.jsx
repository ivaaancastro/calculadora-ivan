/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ActivityDetailPage } from '../../components/pages/ActivityDetailPage';

// Leaflet y Recharts necesitan layout real: se sustituyen por marcadores.
vi.mock('../../components/activity/ActivityMap', () => ({
    InteractiveMap: () => <div data-testid="map" />,
}));
vi.mock('recharts', () => {
    const Box = ({ children }) => <div>{children}</div>;
    const Nada = () => null;
    return {
        ResponsiveContainer: Box, AreaChart: Box, BarChart: Box, Bar: Box,
        Area: Nada, Cell: Nada, XAxis: Nada, YAxis: Nada, CartesianGrid: Nada, Tooltip: Nada,
    };
});

const activity = {
    id: 'a1',
    name: 'Rodaje suave',
    type: 'Carrera',
    date: '2025-03-01T08:00:00Z',
    distance: 10000,
    duration: 55,
    elevation_gain: 80,
    tss: 60,
    hr_avg: 145,
    speed_avg: 3.03,
    map_polyline: 'encoded-polyline',
    streams_data: null,
};

describe('ActivityDetailPage (humo)', () => {
    it('renderiza cabecera y recorre las cuatro pestañas', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const onDelete = vi.fn();
        render(<ActivityDetailPage activity={activity} settings={{}} fetchStreams={vi.fn()} onBack={onBack} onDelete={onDelete} />);

        expect(screen.getAllByText('Rodaje suave').length).toBeGreaterThan(0);
        expect(screen.getByText('Sin datos de análisis')).toBeTruthy();

        await user.click(screen.getAllByRole('button', { name: 'Mapa' })[0]);
        expect(screen.getByText('Ruta Detallada')).toBeTruthy();

        await user.click(screen.getAllByRole('button', { name: 'Intervalos' })[0]);
        expect(screen.getByText('Análisis Técnico por Intervalos')).toBeTruthy();

        await user.click(screen.getAllByRole('button', { name: 'Detalle' })[0]);
        expect(screen.getByText('Hitos de la Sesión')).toBeTruthy();

        await user.click(screen.getAllByTitle('Eliminar actividad')[0]);
        expect(onDelete).toHaveBeenCalledWith('a1');
        await user.click(screen.getAllByTitle('Volver')[0]);
        expect(onBack).toHaveBeenCalled();
    });

    it('no renderiza nada sin actividad', () => {
        const { container } = render(<ActivityDetailPage activity={null} settings={{}} />);
        expect(container.firstChild).toBeNull();
    });
});
