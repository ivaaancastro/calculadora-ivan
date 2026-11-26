/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildCoachInsights } from '../../utils/coachInsights';
import { AnalysisSidebar } from '../../components/activity/detail/AnalysisSidebar';

vi.mock('../../components/activity/ActivityMap', () => ({ InteractiveMap: () => null }));

describe('buildCoachInsights', () => {
    it('bici con IF 0,70–0,85: frase de intensidad moderada', () => {
        for (const iff of [0.71, 0.78, 0.84]) {
            const { insights } = buildCoachInsights({ sport: 'bike', ifFactor: iff });
            expect(insights).toHaveLength(1);
            expect(insights[0]).toMatch(/Intensidad moderada/);
        }
    });

    it('límites existentes intactos: ≤0,70 control, ≥0,85 sólida, ≥0,95 altísima', () => {
        expect(buildCoachInsights({ sport: 'bike', ifFactor: 0.7 }).insights[0]).toMatch(/Buen control/);
        expect(buildCoachInsights({ sport: 'bike', ifFactor: 0.85 }).insights[0]).toMatch(/intensidad sólida/);
        expect(buildCoachInsights({ sport: 'bike', ifFactor: 0.95 }).insights[0]).toMatch(/altísima/);
    });

    it('«Mantenimiento» genera frase; otros beneficios siguen igual', () => {
        expect(buildCoachInsights({ sport: 'run', primaryBenefit: 'Mantenimiento' }).insights[0]).toMatch(/mantenimiento/);
        expect(buildCoachInsights({ sport: 'run', primaryBenefit: 'Umbral' }).insights[0]).toMatch(/Umbral/);
    });

    it('sin potencia en carrera, senderismo y fuerza: ni IF ni pico de 5 min', () => {
        for (const sport of ['run', 'hike', 'strength']) {
            const { insights } = buildCoachInsights({ sport, ifFactor: 0.9, npWatts: 100, powerCurve: [{ label: '5m', value: 400 }] });
            expect(insights).toEqual([]);
        }
    });

    it('bici conserva el pico de 5 min', () => {
        const { insights } = buildCoachInsights({ sport: 'bike', powerCurve: [{ label: '5m', value: 400 }], npWatts: 200 });
        expect(insights.some((i) => /pico de 5 minutos/.test(i))).toBe(true);
    });
});

describe('AnalysisSidebar · Coach Insights', () => {
    const base = { showMap: false, activity: {}, streams: null, themeColor: '#000', activePayload: null };
    const te = { primaryBenefit: 'Mantenimiento', benefitColor: 'text-slate-500', aerobic: 1, anaerobic: 0, aerobicLabel: 'a', anaerobicLabel: 'b', description: 'd', peakEpoc: 0 };

    it('no pinta la tarjeta sin frases', () => {
        render(<AnalysisSidebar {...base} trainingEffect={te} fitnessAnalysis={{ insights: [] }} />);
        expect(screen.queryByText('Coach Insights')).toBeNull();
    });

    it('pinta la tarjeta con frases', () => {
        render(<AnalysisSidebar {...base} trainingEffect={te} fitnessAnalysis={{ insights: ['Hola coach'] }} />);
        expect(screen.getByText('Coach Insights')).toBeTruthy();
        expect(screen.getByText('Hola coach')).toBeTruthy();
    });
});
