import { describe, it, expect } from 'vitest';
import { pickPrimaryVo2, vo2SourceText, VO2_SOURCES } from '../../utils/vo2Source';
import { activityTypeLabel } from '../../utils/sport';

describe('COP-2: origen de cada VO₂max', () => {
    it('cada valor dice de dónde sale', () => {
        expect(vo2SourceText('run')).toBe('VO₂max carrera (estimado de ritmo y FC)');
        expect(vo2SourceText('bike')).toBe('VO₂max ciclismo (estimado de potencia)');
        expect(vo2SourceText('device')).toMatch(/dispositivo.*Intervals/);
        expect(vo2SourceText('x')).toBe('VO₂max');
    });

    it('el principal lleva el origen del valor que se muestra (no «Sincronizado» si es el de bici)', () => {
        expect(pickPrimaryVo2({ bike: 53.8, device: 52, run: 65.2 })).toEqual({ value: 53.8, source: 'bike' });
        expect(pickPrimaryVo2({ device: 52, run: 65.2 })).toEqual({ value: 52, source: 'device' });
        expect(pickPrimaryVo2({ run: 65.2 })).toEqual({ value: 65.2, source: 'run' });
        expect(pickPrimaryVo2({})).toEqual({ value: null, source: null });
        expect(Object.keys(VO2_SOURCES)).toEqual(['run', 'bike', 'device']);
    });
});

describe('COP-1: tipo de actividad en español', () => {
    it.each([
        ['Ride', 'Ciclismo'], ['VirtualRide', 'Ciclismo'], ['Run', 'Carrera'], ['Swim', 'Natación'],
        ['Walk', 'Caminata'], ['WeightTraining', 'Fuerza'], ['Kayaking', 'Kayaking'], ['', 'Otros'], [null, 'Otros'],
    ])('%s → %s', (type, label) => expect(activityTypeLabel(type)).toBe(label));
});
