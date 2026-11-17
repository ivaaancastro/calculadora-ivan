/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ActivityRouteWrapper } from '../../components/dashboard/ActivityRouteWrapper';
import { MAP_TILES } from '../../components/activity/mapTiles';

vi.mock('../../components/pages/ActivityDetailPage', () => ({
    ActivityDetailPage: ({ onBack, fetchStreams }) => (
        <button onClick={onBack} data-streams={typeof fetchStreams}>Volver</button>
    ),
}));

const Where = () => <p data-testid="where">{useLocation().pathname}</p>;
const activities = [{ id: 'a1', type: 'Run' }];

const renderAt = (entries, index) =>
    render(
        <MemoryRouter initialEntries={entries} initialIndex={index}>
            <Where />
            <Routes>
                <Route path="/history" element={<p>Actividades</p>} />
                <Route path="/calendar" element={<p>Calendario</p>} />
                <Route
                    path="/activity/:id"
                    element={<ActivityRouteWrapper activities={activities} settings={{}} fetchActivityStreams={() => {}} />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('ActivityRouteWrapper: Volver', () => {
    it('vuelve a la pantalla de origen del historial', async () => {
        renderAt(['/calendar', '/activity/a1'], 1);
        const btn = await screen.findByRole('button', { name: 'Volver' });
        expect(btn).toHaveAttribute('data-streams', 'function');
        await userEvent.click(btn);
        await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/calendar'));
    });

    it('sin historial (URL directa) va a Actividades', async () => {
        renderAt(['/activity/a1'], 0);
        await userEvent.click(await screen.findByRole('button', { name: 'Volver' }));
        await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/history'));
    });
});

describe('Mapa: capas', () => {
    it('Light y Dark no dependen de CARTO (exige clave)', () => {
        expect(MAP_TILES.light).not.toMatch(/cartocdn/);
        expect(MAP_TILES.dark).not.toMatch(/cartocdn/);
    });
});
