/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityDetailPage } from '../../components/pages/ActivityDetailPage';

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

const base = {
    id: 'a', name: 'Sesión', date: '2025-03-01T08:00:00Z', distance: 10000, duration: 55,
    elevation_gain: 80, tss: 60, hr_avg: 145, speed_avg: 3.03, calories: 480,
    map_polyline: 'poly', streams_data: null,
};
const renderAct = (over) => render(<ActivityDetailPage activity={{ ...base, ...over }} settings={{}} fetchStreams={vi.fn()} onBack={vi.fn()} onDelete={vi.fn()} />);
const hasTab = (name) => screen.queryAllByRole('button', { name }).length > 0;

describe('detalle por deporte (integración)', () => {
    it('bici: 4 pestañas, Kcal y velocidad', () => {
        renderAct({ type: 'Ciclismo' });
        for (const t of ['Análisis', 'Mapa', 'Intervalos', 'Detalle']) expect(hasTab(t)).toBe(true);
        expect(screen.getAllByText('Kcal totales').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Vel. Media').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('Ritmo Medio')).toHaveLength(0);
    });

    it('carrera: ritmo y sin EF/IF', () => {
        renderAct({ type: 'Carrera' });
        expect(screen.getAllByText('Ritmo Medio').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('EF')).toHaveLength(0);
        expect(screen.queryAllByText('IF')).toHaveLength(0);
    });

    it('senderismo (Hike de Strava): ritmo y sin velocidad', () => {
        renderAct({ type: 'Hike' });
        expect(screen.getAllByText('Ritmo Medio').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('Vel. Media')).toHaveLength(0);
    });

    it('fuerza: sin Mapa ni Intervalos, sin mapa y sin distancia', () => {
        renderAct({ type: 'Fuerza' });
        expect(hasTab('Mapa')).toBe(false);
        expect(hasTab('Intervalos')).toBe(false);
        expect(hasTab('Análisis')).toBe(true);
        expect(hasTab('Detalle')).toBe(true);
        expect(screen.queryAllByTestId('map')).toHaveLength(0);
        expect(screen.queryAllByText('Distancia')).toHaveLength(0);
        expect(screen.getAllByText('Kcal totales').length).toBeGreaterThan(0);
    });

    it('genérico (natación): sin Intervalos y sin bloques de potencia; sin GPS no hay Mapa', () => {
        renderAct({ type: 'Natación', map_polyline: '' });
        expect(hasTab('Mapa')).toBe(false);
        expect(hasTab('Intervalos')).toBe(false);
        expect(screen.queryAllByText('NP')).toHaveLength(0);
    });

    it('sin calorías no se muestra Kcal', () => {
        renderAct({ type: 'Carrera', calories: 0 });
        expect(screen.queryAllByText('Kcal totales')).toHaveLength(0);
    });
});
