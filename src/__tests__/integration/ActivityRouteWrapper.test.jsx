/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ActivityRouteWrapper } from '../../components/dashboard/ActivityRouteWrapper';
import { MAP_TILES } from '../../components/activity/mapTiles';

vi.mock('../../components/pages/ActivityDetailPage', () => ({
    ActivityDetailPage: ({ onBack, onDelete, fetchStreams }) => (
        <>
            <button onClick={onBack} data-streams={typeof fetchStreams}>Volver</button>
            <button onClick={async () => { if (await onDelete('a1')) onBack(); }}>Borrar</button>
        </>
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

function Harness({ onDelete }) {
    const [list, setList] = React.useState(activities);
    const deleteActivity = async (id) => { const ok = await onDelete(id); if (ok) setList((l) => l.filter((a) => a.id !== id)); return ok; };
    return (
        <MemoryRouter initialEntries={['/calendar', '/activity/a1']} initialIndex={1}>
            <Where />
            <Routes>
                <Route path="/calendar" element={<p>Calendario</p>} />
                <Route path="/activity/:id" element={<ActivityRouteWrapper activities={list} settings={{}} fetchActivityStreams={() => {}} deleteActivity={deleteActivity} />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ActivityRouteWrapper: borrar', () => {
    it('pasa onDelete y, al borrar, vuelve al origen sin dejar de pintar el detalle antes', async () => {
        const onDelete = vi.fn().mockResolvedValue(true);
        render(<Harness onDelete={onDelete} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Borrar' }));
        await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/calendar'));
        expect(onDelete).toHaveBeenCalledWith('a1');
    });

    it('si falla, sigue en el detalle', async () => {
        render(<Harness onDelete={vi.fn().mockResolvedValue(false)} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Borrar' }));
        expect(screen.getByTestId('where')).toHaveTextContent('/activity/a1');
        expect(screen.getByRole('button', { name: 'Borrar' })).toBeTruthy();
    });
});

describe('Mapa: capas', () => {
    it('Light y Dark no dependen de CARTO (exige clave)', () => {
        expect(MAP_TILES.light).not.toMatch(/cartocdn/);
        expect(MAP_TILES.dark).not.toMatch(/cartocdn/);
    });
});
