/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityDetailPage } from '../../components/pages/ActivityDetailPage';

// RF-C5 (PERF-1): mover el cursor por las gráficas no vuelve a pintar el mapa ni la página;
// solo el marcador del mapa y las lecturas de cada pista.
const counts = vi.hoisted(() => ({ map: 0, markers: [] }));

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => {
        counts.map += 1;
        return <div data-testid="map">{children}</div>;
    },
    TileLayer: () => null,
    Polyline: () => null,
    CircleMarker: ({ center, radius }) => {
        if (radius === 5) counts.markers.push(center);
        return null;
    },
    useMap: () => ({ invalidateSize() {}, fitBounds() {} }),
}));
vi.mock('recharts', () => {
    const Box = ({ children }) => <div>{children}</div>;
    const Nada = () => null;
    const AreaChart = ({ onMouseMove }) => <div data-testid="track" onMouseMove={() => onMouseMove({ activeTooltipIndex: 2 })} />;
    return {
        ResponsiveContainer: Box, AreaChart, BarChart: Box, Bar: Box,
        Area: Nada, Cell: Nada, XAxis: Nada, YAxis: Nada, CartesianGrid: Nada, Tooltip: Nada,
    };
});

const N = 40;
const streams = {
    time: { data: Array.from({ length: N }, (_, i) => i * 10) },
    distance: { data: Array.from({ length: N }, (_, i) => i * 30) },
    altitude: { data: Array.from({ length: N }, (_, i) => 100 + i) },
    velocity_smooth: { data: Array.from({ length: N }, () => 3) },
    latlng: { data: Array.from({ length: N }, (_, i) => [40 + i / 1000, -3]) },
};
const activity = {
    id: 'c1', name: 'Rodaje', type: 'Carrera', date: '2025-03-01T08:00:00Z', distance: 1200,
    duration: 7, speed_avg: 3, map_polyline: 'poly', streams_data: streams,
};

describe('detalle: cursor compartido (RF-C5)', () => {
    beforeEach(() => {
        counts.map = 0;
        counts.markers = [];
    });

    it('el hover mueve el marcador y las lecturas sin repintar el mapa', async () => {
        render(<ActivityDetailPage activity={activity} settings={{}} fetchStreams={vi.fn()} onBack={vi.fn()} onDelete={vi.fn()} />);
        const tracks = await screen.findAllByTestId('track');
        const before = counts.map;
        expect(before).toBeGreaterThan(0);
        counts.markers = [];

        fireEvent.mouseMove(tracks[0]);
        fireEvent.mouseMove(tracks[1]);
        await waitFor(() => expect(screen.getAllByText(/^102 m/).length).toBeGreaterThan(0));

        expect(counts.map).toBe(before);
        expect(counts.markers).toContainEqual(streams.latlng.data[2]);
    });
});
