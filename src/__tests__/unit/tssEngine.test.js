import { describe, it, expect } from 'vitest';
import {
  calculatePMC,
  getSportCategory,
  calcZonesFromLTHR,
  calculateActivityTSS,
  computeZoneTssPerHour,
  estimateTssFromBlocks,
  getEffectiveTSS,
} from '../../../src/utils/tssEngine';

const settings = {
  gender: 'male',
  fcReposo: 50,
  bike: { ftp: 250, max: 190, lthr: 170 },
  run: { max: 190, lthr: 170 },
};

describe('tssEngine - PMC Calculations', () => {
  it('debería retornar métricas vacías si no hay actividades', () => {
    const result = calculatePMC([]);
    expect(result.fullSeries).toEqual([]);
    expect(result.metrics).toBeNull();
  });

  it('debería calcular el CTL correctamente para una sola actividad de 100 TSS', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const activities = [
      { date: yesterday.toISOString(), tss: 100, type: 'Ciclismo' }
    ];

    const result = calculatePMC(activities, { ta: 42, tf: 7 });

    expect(result.fullSeries.length).toBeGreaterThan(0);
    expect(result.metrics).not.toBeNull();
    expect(result.metrics.ctl).toBeGreaterThan(0);
    expect(result.metrics.ctl).toBeLessThan(100);
  });

  it('debería categorizar correctamente los deportes', () => {
    expect(getSportCategory('Carrera')).toBe('run');
    expect(getSportCategory('Run')).toBe('run');
    expect(getSportCategory('Ciclismo')).toBe('ride');
    expect(getSportCategory('Ride')).toBe('ride');
    expect(getSportCategory('Natación')).toBe('swim');
    expect(getSportCategory('Fuerza')).toBe('strength');
    expect(getSportCategory('Yoga')).toBe('yoga');
    expect(getSportCategory('Crossfit')).toBe('strength');
    expect(getSportCategory('Desconocido')).toBe('other');
  });
});

describe('tssEngine - calcZonesFromLTHR', () => {
  it('debe generar 7 zonas de FC a partir del LTHR', () => {
    const zones = calcZonesFromLTHR(170, 190);
    expect(zones).toHaveLength(7);
    expect(zones[0].min).toBe(0);
    expect(zones[6].max).toBe(190);
  });

  it('debe usar maxHr proporcionado en la última zona', () => {
    const zones = calcZonesFromLTHR(160, 185);
    expect(zones[6].max).toBe(185);
  });
});

describe('tssEngine - calculateActivityTSS', () => {
  it('debe retornar tss 0 y método none sin datos', () => {
    const result = calculateActivityTSS({ duration: 0, type: 'Ride' }, settings);
    expect(result.tss).toBe(0);
    expect(result.method).toBe('none');
  });

  it('debe estimar TSS por duración para actividad sin datos fisiológicos', () => {
    const result = calculateActivityTSS(
      { duration: 60, type: 'Carrera', hr_avg: 0 },
      settings
    );
    expect(result.tss).toBeGreaterThan(0);
    expect(result.method).toBe('duration');
  });

  it('debe calcular TSS por potencia media para ciclismo', () => {
    const result = calculateActivityTSS(
      { duration: 60, type: 'Ride', watts_avg: 200 },
      settings
    );
    expect(result.tss).toBeGreaterThan(0);
    expect(result.method).toBe('power_avg');
  });
});

describe('tssEngine - computeZoneTssPerHour', () => {
  it('debe retornar TSS por hora para cada zona', () => {
    const result = computeZoneTssPerHour('Ride', settings);
    expect(result.Z1).toBeGreaterThan(0);
    expect(result.Z7).toBeGreaterThan(result.Z1);
    expect(result.R12).toBeDefined();
  });

  it('debe retornar fallback cuando no hay rango de FC válido', () => {
    const badSettings = { gender: 'male', fcReposo: 50, bike: { max: 50, lthr: 50 } };
    const result = computeZoneTssPerHour('Ride', badSettings);
    expect(result.Z1).toBe(20);
    expect(result.Z7).toBe(140);
  });
});

describe('tssEngine - estimateTssFromBlocks', () => {
  it('debe retornar null para array de bloques vacío', () => {
    expect(estimateTssFromBlocks([], 'Ride', settings)).toBeNull();
    expect(estimateTssFromBlocks(null, 'Ride', settings)).toBeNull();
  });

  it('debe estimar TSS de bloques simples de ciclismo', () => {
    const blocks = [
      { type: 'steady', zone: 'Z2', duration: 30, unit: 'min' },
      { type: 'steady', zone: 'Z4', duration: 20, unit: 'min' },
    ];
    const result = estimateTssFromBlocks(blocks, 'Ride', settings);
    expect(result).toBeGreaterThan(0);
  });

  it('debe manejar bloques con repeticiones', () => {
    const blocks = [
      { type: 'repeat', repeats: 2, steps: [
        { type: 'steady', zone: 'Z3', duration: 5, unit: 'min' },
      ] },
    ];
    const result = estimateTssFromBlocks(blocks, 'Run', settings);
    expect(result).toBeGreaterThan(0);
  });
});

describe('tssEngine - getEffectiveTSS', () => {
  it('debe aplicar factor de fatiga del deporte', () => {
    const ride = { tss: 100, type: 'Ride' };
    const walk = { tss: 100, type: 'Walk' };
    expect(getEffectiveTSS(ride)).toBe(100);
    expect(getEffectiveTSS(walk)).toBe(50);
  });

  it('debe usar sportCategory si está disponible', () => {
    const act = { tss: 100, sportCategory: 'strength' };
    expect(getEffectiveTSS(act)).toBe(100);
  });
});
