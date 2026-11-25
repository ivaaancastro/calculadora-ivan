/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivitiesSummary } from '../../components/dashboard/history/ActivitiesSummary';

describe('ActivitiesSummary', () => {
    // Sin animación del contador (useCountUp respeta `prefers-reduced-motion`): cifras finales al instante.
    beforeEach(() => { vi.stubGlobal('matchMedia', (q) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} })); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('muestra sesiones, tiempo, distancia y TSS', () => {
        render(<ActivitiesSummary totals={{ count: 3, minutes: 200, meters: 55000, tss: 170 }} weekly={[10, 20, 30]} />);
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('sesiones')).toBeTruthy();
        expect(screen.getByText('3h 20m')).toBeTruthy();
        expect(screen.getByText('55,0')).toBeTruthy();
        expect(screen.getByText('170')).toBeTruthy();
    });

    it('no renderiza nada sin actividades', () => {
        const { container } = render(<ActivitiesSummary totals={{ count: 0, minutes: 0, meters: 0, tss: 0 }} />);
        expect(container.firstChild).toBeNull();
    });
});
