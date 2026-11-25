/** @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HealthPage } from '../../components/pages/HealthPage';

const DAYS = Array.from({ length: 10 }, (_, i) => ({
    date: `2025-03-${String(i + 1).padStart(2, '0')}`,
    hrv: 60 + i, rhr: 50 + (i % 3), sleep: 7 + (i % 2) * 0.5, sleepScore: 70 + i,
    baselineBottom: 55, baselineTop: 75, readiness: 40 + i * 5,
}));

const metrics = {
    chartData: DAYS,
    baselineRhr: 50,
    todayReadiness: 85,
    latestSleepScore: 78,
    effort: { score: 4.2 },
    isSimulated: false,
    insights: [
        { type: 'danger', label: 'Alerta de prueba', desc: 'Descripción A' },
        { type: 'warning', label: 'Aviso de prueba', desc: 'Descripción B' },
        { type: 'ok', label: 'Bien de prueba', desc: 'Descripción C' },
    ],
};

const state = { value: { wellnessMetrics: metrics, loading: false, error: null } };
vi.mock('../../hooks/useWellnessInfo', () => ({ useWellnessInfo: () => state.value }));
vi.mock('recharts', async () => {
    const R = await import('react');
    const Stub = ({ children }) => R.createElement('div', { 'data-chart': true }, children);
    const actual = await vi.importActual('recharts');
    return Object.fromEntries(Object.keys(actual).map((name) => [name, Stub]));
});

describe('HealthPage - humo', { timeout: 30000 }, () => {
    it('muestra la vista Hoy con anillos, biomarcadores e insights', () => {
        state.value = { wellnessMetrics: metrics, loading: false, error: null };
        render(<HealthPage activities={[]} settings={{}} chartData={[]} />);
        expect(screen.getByRole('heading', { name: 'Salud' })).toBeTruthy();
        expect(screen.getByText('Biomarcadores Clave')).toBeTruthy();
        expect(screen.getByText('Aspectos Destacados')).toBeTruthy();
        expect(screen.getByText('Alerta de prueba')).toBeTruthy();
    });

    it('cambia a Historial y muestra el registro diario', async () => {
        state.value = { wellnessMetrics: metrics, loading: false, error: null };
        render(<HealthPage activities={[]} settings={{}} chartData={[]} />);
        await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
        expect(screen.getByText('Registros Diarios Detallados')).toBeTruthy();
        expect(screen.queryByText('Biomarcadores Clave')).toBeNull();
    });

    it('muestra el error de sincronización', () => {
        state.value = { wellnessMetrics: metrics, loading: false, error: 'x' };
        render(<HealthPage activities={[]} settings={{}} chartData={[]} />);
        expect(screen.getByText(/Error al sincronizar datos biom/)).toBeTruthy();
    });

    it('muestra el estado vacío sin métricas', () => {
        state.value = { wellnessMetrics: null, loading: false, error: null };
        render(<HealthPage activities={[]} settings={{}} chartData={[]} />);
        expect(screen.getByText('Sin datos de salud')).toBeTruthy();
    });
});
