import { describe, it, expect } from 'vitest';
import {
    LTHR_ZONE_PCT, FCMAX_PCT, POWER_ZONES, PACE_ZONES, ZONE_PACE,
    calcZonesFromLTHR, calcZonesFromFCMax, calcPaceZones, paceToSec, secToPace,
    zoneIndex, secondsInZones, hrSettingsFor, hrZoneMins, powerZoneMins, paceZoneMins,
} from '../../utils/zones';

describe('zones — definiciones', () => {
    it('hay 7 zonas de FC, potencia y ritmo', () => {
        for (const z of [LTHR_ZONE_PCT, FCMAX_PCT, POWER_ZONES, PACE_ZONES]) expect(z).toHaveLength(7);
    });

    it('zonas desde LTHR 168 (valores a mano)', () => {
        const z = calcZonesFromLTHR(168, 190);
        expect(z[0]).toEqual({ min: 0, max: 136 });
        expect(z[2]).toEqual({ min: 151, max: 156 });
        expect(z[3]).toEqual({ min: 158, max: 166 });
        expect(z[6]).toEqual({ min: 178, max: 190 });
    });

    it('zonas desde FC máxima 200', () => {
        const z = calcZonesFromFCMax(200);
        expect(z[1]).toEqual({ min: 118, max: 148 });
        expect(z[6]).toEqual({ min: 194, max: 200 });
    });

    it('ritmos: 4:30 son 270 s y la zona 4 llega al umbral', () => {
        expect(paceToSec('4:30')).toBe(270);
        expect(paceToSec('')).toBe(270);
        expect(secToPace(270)).toBe('4:30');
        expect(calcPaceZones('4:30')[3]).toMatchObject({ min: '4:30', max: '4:43' });
    });

    it('el ritmo estimado por zona incluye todas las rampas', () => {
        for (const sport of ['Run', 'Ride', 'Swim']) {
            for (const z of ['Z1', 'R12', 'Z2', 'R23', 'Z3', 'R34', 'Z4', 'R45', 'Z5', 'Z6']) {
                expect(ZONE_PACE[sport][z]).toBeGreaterThan(0);
            }
        }
    });
});

describe('zones — clasificación contigua', () => {
    const mins = hrZoneMins(calcZonesFromLTHR(168, 190));

    it('zoneIndex: última zona cuyo mínimo no supera el valor', () => {
        expect(zoneIndex(120, mins)).toBe(0);
        expect(zoneIndex(156, mins)).toBe(2);
        expect(zoneIndex(157, mins)).toBe(2); // hueco entre Z3 (…156) y Z4 (158…)
        expect(zoneIndex(158, mins)).toBe(3);
        expect(zoneIndex(250, mins)).toBe(6);
    });

    it('por debajo del primer mínimo cuenta como Z1', () => {
        expect(zoneIndex(40, [90, 120, 140])).toBe(0);
    });

    it('secondsInZones reparte todos los segundos, también los de los huecos', () => {
        const time = [0, 10, 20, 30, 45];
        const hr = [100, 157, 158, 190, 0];
        // intervalos: 157→Z3 (10 s), 158→Z4 (10 s), 190→Z7 (10 s), 0 = sin dato
        expect(secondsInZones(hr, time, mins, { ignore: (v) => !(v > 0) })).toEqual([0, 0, 10, 10, 0, 0, 10]);
    });

    it('potencia: 0,555 × FTP ya no se pierde', () => {
        const watts = powerZoneMins(200);
        expect(zoneIndex(111, watts)).toBe(0);
        expect(zoneIndex(112, watts)).toBe(1);
        expect(zoneIndex(301, watts)).toBe(5);
        expect(zoneIndex(302, watts)).toBe(6);
    });

    it('ritmo: los mínimos son velocidades en m/s', () => {
        const speeds = paceZoneMins('5:00'); // umbral 3,333 m/s
        expect(zoneIndex(1000 / 300, speeds)).toBe(3);
        expect(zoneIndex((1000 / 300) * 0.78, speeds)).toBe(0); // hueco Z1–Z2
    });
});

describe('zones — deporte', () => {
    const settings = { run: { max: 200 }, bike: { max: 190 } };

    it('una actividad de ciclismo usa los ajustes de bici en inglés y en español', () => {
        for (const type of ['Ride', 'VirtualRide', 'Ciclismo', 'Bici']) {
            expect(hrSettingsFor(type, settings)).toBe(settings.bike);
        }
        for (const type of ['Run', 'Carrera', 'Swim', 'Hike']) {
            expect(hrSettingsFor(type, settings)).toBe(settings.run);
        }
    });
});
