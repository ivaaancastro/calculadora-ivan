import { describe, it, expect } from 'vitest';
import { loadDistribution, sessionFocus } from '../../utils/loadDistribution';
import { computeZoneTssPerHour } from '../../utils/tssEngine';

const zones = [[0, 119], [120, 139], [140, 149], [150, 159], [160, 169], [170, 179], [180, 190]]
    .map(([min, max]) => ({ min, max }));
const sport = { max: 190, lthr: 170, zones };
const settings = { gender: 'male', fcReposo: 50, run: sport, bike: { ...sport, ftp: 200 } };
const TODAY = '2026-06-15';

/** Streams con un tramo de 60 s por cada valor. */
const streams = (key, values) => ({
    time: { data: Array.from({ length: values.length + 1 }, (_, i) => i * 60) },
    [key]: { data: [values[0], ...values] },
});
const act = (extra) => ({ date: '2026-06-14T08:00:00Z', type: 'Run', duration: 60, tss: 100, ...extra });
const sumOf = (f) => f.low + f.high + f.anaerobic;

describe('sessionFocus', () => {
    it('reparte el TSS por potencia según tiempo × TSS/h de la zona', () => {
        // FTP 200 → 130 W (Z2), 196 W (Z4), 270 W (Z6), un minuto cada uno.
        // TSS/h = IF² × 100 con el IF central: 0,655 → 42,9025; 0,98 → 96,04; 1,355 → 183,6025.
        const f = sessionFocus(act({ type: 'Ride', streams_data: streams('watts', [130, 196, 270]) }), settings);
        const total = 42.9025 + 96.04 + 183.6025;
        expect(f.source).toBe('power');
        expect(f.low).toBeCloseTo((100 * 42.9025) / total, 6);
        expect(f.high).toBeCloseTo((100 * 96.04) / total, 6);
        expect(f.anaerobic).toBeCloseTo((100 * 183.6025) / total, 6);
        expect(sumOf(f)).toBeCloseTo(100, 9);
    });

    it('con FC en streams pondera por el TSS/h de cada zona', () => {
        const tph = computeZoneTssPerHour('Run', settings);
        const f = sessionFocus(act({ streams_data: streams('heartrate', [130, 155, 175]) }), settings);
        const total = tph.Z2 + tph.Z4 + tph.Z6;
        expect(f.source).toBe('hr');
        expect(f.low).toBeCloseTo((100 * tph.Z2) / total, 6);
        expect(f.high).toBeCloseTo((100 * tph.Z4) / total, 6);
        expect(f.anaerobic).toBeCloseTo((100 * tph.Z6) / total, 6);
    });

    it('la potencia manda solo en bici; sin vatios útiles se usa la FC', () => {
        const both = { ...streams('watts', [270, 270]), heartrate: { data: [130, 130, 130] } };
        expect(sessionFocus(act({ type: 'Ride', streams_data: both }), settings)).toMatchObject({ source: 'power', anaerobic: 100 });
        expect(sessionFocus(act({ type: 'Run', streams_data: both }), settings)).toMatchObject({ source: 'hr', low: 100 });
        const flat = { ...both, watts: { data: [0, 0, 0] } };
        expect(sessionFocus(act({ type: 'Ride', streams_data: flat }), settings)).toMatchObject({ source: 'hr', low: 100 });
    });

    it('no cuenta las pausas de más de 5 minutos', () => {
        const data = { time: { data: [0, 60, 4000, 4060] }, heartrate: { data: [130, 130, 175, 175] } };
        const tph = computeZoneTssPerHour('Run', settings);
        const f = sessionFocus(act({ streams_data: data }), settings);
        expect(f.low).toBeCloseTo((100 * tph.Z2) / (tph.Z2 + tph.Z6), 6);
        expect(f.high).toBe(0);
    });

    it('solo con FC media, la sesión entera va a una zona y es estimada', () => {
        expect(sessionFocus(act({ hr_avg: 155 }), settings)).toEqual({ low: 0, high: 100, anaerobic: 0, source: 'hr_avg' });
    });

    it('sin FC ni potencia, sin zonas o sin TSS, no se clasifica', () => {
        expect(sessionFocus(act({}), settings)).toBeNull();
        expect(sessionFocus(act({ hr_avg: 155 }), { ...settings, run: {} })).toBeNull();
        expect(sessionFocus(act({ hr_avg: 155, tss: 0 }), settings)).toBeNull();
    });
});

describe('loadDistribution', () => {
    it('las tres categorías suman el TSS de las sesiones clasificadas', () => {
        const three = ['100', '150', '175'].map((hr) => act({ hr_avg: Number(hr), tss: 33.4 }));
        const d = loadDistribution(three, settings, 28, TODAY);
        expect(d.total).toBe(100);
        expect(d.values.low + d.values.high + d.values.anaerobic).toBe(100);
        expect(d.pcts.low + d.pcts.high + d.pcts.anaerobic).toBe(100);
    });

    it('cuenta estimadas y fuera, sin rellenar el TSS que falta', () => {
        const d = loadDistribution([
            act({ streams_data: streams('heartrate', [130]) }),
            act({ hr_avg: 130, tss: 50 }),
            act({}),
            act({ hr_avg: 130, tss: undefined }),
        ], settings, 28, TODAY);
        expect(d).toMatchObject({ total: 150, sessions: 2, estimated: 1, unclassified: 2, empty: false });
    });

    it('entran carrera, bici, natación y otros; fuerza, yoga y caminata no', () => {
        const types = ['Run', 'Ride', 'Swim', 'Kayaking', 'WeightTraining', 'Yoga', 'Walk'];
        const d = loadDistribution(types.map((type) => act({ type, hr_avg: 130, tss: 10 })), settings, 28, TODAY);
        expect(d).toMatchObject({ total: 40, sessions: 4, unclassified: 0 });
    });

    it('el rango son N días contando hoy', () => {
        const days = ['2026-06-08', '2026-06-09', '2026-06-15', '2026-06-16'];
        const list = days.map((day) => act({ date: `${day}T23:30:00Z`, hr_avg: 130, tss: 10 }));
        expect(loadDistribution(list, settings, 7, TODAY).sessions).toBe(2);
        expect(loadDistribution(list, settings, 28, TODAY).sessions).toBe(3);
    });

    it('compara cada porcentaje con su objetivo y da el veredicto', () => {
        const mix = (low, high, anaerobic) => [[130, low], [155, high], [175, anaerobic]]
            .map(([hr_avg, tss]) => act({ hr_avg, tss }));
        const ok = loadDistribution(mix(70, 20, 10), settings, 28, TODAY);
        expect(ok.pcts).toEqual({ low: 70, high: 20, anaerobic: 10 });
        expect(ok.targets.low).toEqual({ pctMin: 60, pctMax: 80, min: 60, max: 80 });
        expect(ok.targets.high).toEqual({ pctMin: 10, pctMax: 25, min: 10, max: 25 });
        expect(ok.targets.anaerobic).toEqual({ pctMin: 5, pctMax: 15, min: 5, max: 15 });
        expect(ok.verdict).toBe('balanced');
        const verdict = (...args) => loadDistribution(mix(...args), settings, 28, TODAY).verdict;
        expect(verdict(50, 40, 10)).toBe('lowShort');
        expect(verdict(79, 6, 15)).toBe('highShort');
        expect(verdict(75, 23, 2)).toBe('anaerobicShort');
        expect(verdict(62, 18, 20)).toBe('anaerobicOver');
        expect(verdict(60, 32, 8)).toBe('highOver');
        expect(verdict(85, 10, 5)).toBe('lowOver');
    });

    it('sin sesiones clasificables queda vacío', () => {
        expect(loadDistribution([], settings, 28, TODAY)).toMatchObject({ empty: true, total: 0, unclassified: 0 });
        expect(loadDistribution([act({})], settings, 28, TODAY)).toMatchObject({ empty: true, unclassified: 1 });
    });
});
