// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractiveMap } from '../../components/activity/ActivityMap';
import { MAP_TILES } from '../../components/activity/mapTiles';
import { useTheme } from '../../hooks/useTheme';

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div>{children}</div>,
    TileLayer: ({ url }) => <div data-testid="tiles" data-url={url} />,
    Polyline: () => null,
    CircleMarker: () => null,
    useMap: () => ({ invalidateSize: () => {}, fitBounds: () => {} }),
}));

const tiles = () => screen.getByTestId('tiles').getAttribute('data-url');
const pick = (name) => userEvent.click(screen.getByRole('button', { name }));
const coords = [[40.4, -3.7], [40.41, -3.71]];

describe('Mapa: teselas según el tema', () => {
    let theme;
    const setApp = (value) => act(() => theme.current.setPreference(value));

    beforeEach(() => {
        theme = renderHook(() => useTheme()).result;
        setApp('light');
    });

    it('empieza en el tema activo', () => {
        setApp('dark');
        render(<InteractiveMap highResCoords={coords} />);
        expect(tiles()).toBe(MAP_TILES.dark);
        expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('sigue al tema en vivo', () => {
        render(<InteractiveMap highResCoords={coords} />);
        expect(tiles()).toBe(MAP_TILES.light);
        setApp('dark');
        expect(tiles()).toBe(MAP_TILES.dark);
    });

    it('una elección distinta del tema se mantiene aunque cambie el tema', async () => {
        render(<InteractiveMap highResCoords={coords} />);
        await pick('Satélite');
        setApp('dark');
        expect(tiles()).toMatch(/World_Imagery/);
    });

    it('elegir la del tema activo vuelve a seguirlo', async () => {
        render(<InteractiveMap highResCoords={coords} />);
        await pick('Satélite');
        await pick('Claro');
        setApp('dark');
        expect(tiles()).toBe(MAP_TILES.dark);
    });
});
