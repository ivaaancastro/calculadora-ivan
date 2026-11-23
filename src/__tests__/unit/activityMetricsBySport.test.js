import { describe, it, expect } from 'vitest';
import {
    detectSportType, SPORTS, SPORT_BLOCKS, getTabsForSport, getZoneOptions,
    getMetricsForSport, getMetabolicIntensity, applyChartBlocks,
} from '../../utils/activityMetricsBySport';

const act = { type: 'Ciclismo', distance: 10000, duration: 60, elevation_gain: 200, hr_avg: 140, tss: 50, calories: 300 };
const pro = {
    ifFactor: 0.8, workKj: 250, avgWatts: 200, npWatts: 220,
    efObj: { value: '1.25', unit: 'w/bpm' }, decouplingObj: { value: '3.5', color: 'text-ok' }, cadenceAvg: 85,
};
const pace = { value: '5:00', unit: '/km', label: 'Ritmo Medio' };
const speed = { value: '30.0', unit: 'km/h', label: 'Vel. Media' };
const ids = (sport, a = act, p = pro, sm = speed) => getMetricsForSport(sport, a, p, sm).map((m) => m.id);

describe('detectSportType', () => {
    it.each([
        ['Ciclismo', 'bike'], ['Ride', 'bike'], ['VirtualRide', 'bike'], ['EBikeRide', 'bike'], ['Bici', 'bike'],
        ['Carrera', 'run'], ['Run', 'run'], ['TrailRun', 'run'], ['Correr', 'run'],
        ['Senderismo', 'hike'], ['Hike', 'hike'], ['Montaña', 'hike'], ['Caminata', 'hike'], ['Walk', 'hike'],
        ['Fuerza', 'strength'], ['WeightTraining', 'strength'], ['Gym', 'strength'], ['Crossfit', 'strength'],
        ['Natación', 'generic'], ['Swim', 'generic'], ['Yoga', 'generic'], ['Workout', 'generic'], ['', 'generic'], [null, 'generic'], [undefined, 'generic'],
    ])('%s → %s', (type, sport) => expect(detectSportType(type)).toBe(sport));
    it('todas las claves de la matriz existen', () => expect(Object.keys(SPORT_BLOCKS).sort()).toEqual([...SPORTS].sort()));
});

describe('resumen por deporte', () => {
    it('bici: bloque completo de potencia', () => {
        expect(ids('bike')).toEqual(['kcal', 'tss', 'if', 'np', 'work', 'wattsAvg', 'hrAvg', 'speed', 'cadence', 'distance', 'duration', 'elevation', 'ef', 'decoupling']);
    });
    it('carrera: sin EF ni potencia, con Drift y ritmo', () => {
        const r = ids('run', act, pro, pace);
        expect(r).toEqual(['kcal', 'hrAvg', 'pace', 'cadence', 'distance', 'duration', 'elevation', 'tss', 'decoupling']);
        expect(r).not.toContain('ef');
    });
    it('senderismo: ritmo, sin cadencia ni Drift', () => {
        expect(ids('hike', act, pro, pace)).toEqual(['kcal', 'hrAvg', 'pace', 'distance', 'duration', 'elevation', 'tss']);
    });
    it('fuerza: kcal, tiempo, FC y carga; sin series', () => {
        expect(ids('strength')).toEqual(['kcal', 'duration', 'hrAvg', 'tss']);
    });
    it('genérico: simplificado', () => {
        expect(ids('generic')).toEqual(['kcal', 'distance', 'duration', 'elevation', 'hrAvg', 'speed', 'tss']);
    });
    it('kcal 0 y métricas sin dato no se muestran', () => {
        const r = ids('bike', { ...act, calories: 0, hr_avg: 0, tss: 0, elevation_gain: 0 }, { cadenceAvg: 0, ifFactor: 0, workKj: 0, avgWatts: 0, npWatts: 0 }, null);
        expect(r).toEqual(['distance', 'duration']);
    });
    it('cadencia en ppm en carrera y rpm en bici', () => {
        expect(getMetricsForSport('run', act, pro, pace).find((m) => m.id === 'cadence').unit).toBe('ppm');
        expect(getMetricsForSport('bike', act, pro, speed).find((m) => m.id === 'cadence').unit).toBe('rpm');
    });
});

describe('pestañas, zonas y bloques', () => {
    const labels = (s, o) => getTabsForSport(s, o).map((t) => t.id);
    it('fuerza: sin Mapa ni Intervalos aunque haya GPS', () => expect(labels('strength', { hasGps: true, hasLaps: true })).toEqual(['analyze', 'data']));
    it('sin GPS se oculta Mapa en cualquier deporte', () => expect(labels('bike', { hasGps: false })).toEqual(['analyze', 'laps', 'data']));
    it('con GPS: bici/carrera/senderismo tienen 4 pestañas', () => {
        for (const s of ['bike', 'run', 'hike']) expect(labels(s, { hasGps: true })).toEqual(['analyze', 'map', 'laps', 'data']);
    });
    it('genérico: Intervalos solo con datos', () => {
        expect(labels('generic', { hasGps: true })).toEqual(['analyze', 'map', 'data']);
        expect(labels('generic', { hasGps: true, hasLaps: true })).toEqual(['analyze', 'map', 'laps', 'data']);
    });
    it('ClimbPro solo en bici', () => {
        expect(Object.fromEntries(SPORTS.map((s) => [s, SPORT_BLOCKS[s].detail.climbPro]))).toEqual({ bike: true, run: false, hike: false, strength: false, generic: false });
    });
    it('selector de zonas por deporte', () => {
        const all = { hasHr: true, hasPace: true, hasPower: true };
        expect(getZoneOptions('bike', all).map((z) => z.value)).toEqual(['hr', 'power']);
        expect(getZoneOptions('run', all).map((z) => z.value)).toEqual(['hr', 'pace']);
        expect(getZoneOptions('hike', all).map((z) => z.value)).toEqual(['hr']);
        expect(getZoneOptions('run', { hasHr: true })).toHaveLength(1);
    });
    it('intensidad metabólica: IF en bici, % FC en carrera, nada en fuerza/genérico', () => {
        expect(getMetabolicIntensity('bike', act, pro, 180)).toBe(0.8);
        expect(getMetabolicIntensity('run', act, pro, 200)).toBeCloseTo(0.7);
        expect(getMetabolicIntensity('run', act, pro, null)).toBeNull();
        expect(getMetabolicIntensity('strength', act, pro, 180)).toBeNull();
        expect(getMetabolicIntensity('generic', act, pro, 180)).toBeNull();
    });
    it('applyChartBlocks anula potencia en carrera y todo en fuerza', () => {
        const d = [{ speed: 10, pace: 5, watts: 200, cadence: 80, alt: 100, hr: 140 }];
        expect(applyChartBlocks(d, 'run')[0]).toMatchObject({ watts: null, cadence: 80, alt: 100 });
        expect(applyChartBlocks(d, 'strength')[0]).toMatchObject({ speed: null, pace: null, watts: null, cadence: null, alt: null, hr: 140 });
        expect(applyChartBlocks(d, 'bike')).toBe(d);
    });
});

import { pickHeroMetrics as _pick } from '../../utils/activityMetricsBySport';
describe('pickHeroMetrics', () => {
    const mk = (...ids) => ids.map((id) => ({ id }));
    it('elige distancia, tiempo y velocidad en bici', () => {
        const r = _pick('bike', mk('kcal', 'speed', 'duration', 'distance', 'hrAvg'));
        expect(r.hero.map((m) => m.id)).toEqual(['distance', 'duration', 'speed']);
        expect(r.rest.map((m) => m.id)).toEqual(['kcal', 'hrAvg']);
    });
    it('completa con las siguientes si falta una preferida', () => {
        const r = _pick('strength', mk('duration', 'kcal'));
        expect(r.hero.map((m) => m.id)).toEqual(['duration', 'kcal']);
        const r2 = _pick('run', mk('duration', 'hrAvg', 'kcal', 'cadence'));
        expect(r2.hero.map((m) => m.id)).toEqual(['duration', 'hrAvg', 'kcal']);
        expect(r2.rest.map((m) => m.id)).toEqual(['cadence']);
    });
    it('tolera lista vacía', () => {
        expect(_pick('generic', undefined)).toEqual({ hero: [], rest: [] });
    });
});
