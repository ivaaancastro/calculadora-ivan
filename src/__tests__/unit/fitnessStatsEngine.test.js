import { describe, it, expect } from 'vitest';
import {
  estimateFTP,
  estimateCyclingVO2max,
  estimateRunningVO2max,
  predictRaceTimes,
} from '../../../src/utils/fitnessStatsEngine';

const settings = {
  weight: 70,
  fcReposo: 50,
  bike: { ftp: 250, max: 190, lthr: 170 },
  run: { max: 190 },
};

describe('fitnessStatsEngine - estimateFTP', () => {
  it('debe retornar eFTP null cuando no hay actividades de ciclismo con potencia', () => {
    const result = estimateFTP([], settings);
    expect(result.eFTP).toBeNull();
    expect(result.method).toBe('none');
  });

  it('debe calcular eFTP a partir de actividad con stream de vatios suficiente', () => {
    const today = new Date().toISOString();
    // 10 minutos de vatios constantes (600 segundos) para superar el mínimo de eFTP (300s)
    const n = 600;
    const watts = Array(n).fill(250);
    const time = Array.from({ length: n }, (_, i) => i);

    const activities = [
      {
        id: 1,
        name: 'Rodaje',
        type: 'Ride',
        date: today,
        streams_data: { watts: { data: watts }, time: { data: time } },
      },
    ];

    const result = estimateFTP(activities, settings, { days: 90 });
    expect(result.eFTP).toBeGreaterThan(0);
    expect(result.method).toBe('ratio');
  });
});

describe('fitnessStatsEngine - estimateCyclingVO2max', () => {
  it('debe retornar error cuando no hay rango de FC válido', () => {
    const result = estimateCyclingVO2max([], { fcReposo: 50, bike: { max: 50 } });
    expect(result.vo2max).toBe(0);
    expect(result.method).toBe('error');
  });

  it('debe estimar VO2max fisiológico cuando no hay actividades pero hay FC configurada', () => {
    const result = estimateCyclingVO2max([], settings);
    expect(result.vo2max).toBeGreaterThan(0);
    expect(result.method).toBe('physiological_fallback');
  });

  it('debe estimar VO2max con actividad de ciclismo con streams de potencia y FC', () => {
    const today = new Date().toISOString();
    const n = 200;
    const watts = Array(n).fill(200);
    const hr = Array(n).fill(150);
    const time = Array.from({ length: n }, (_, i) => i);

    const activities = [
      {
        id: 1,
        name: 'Rodaje',
        type: 'Ride',
        date: today,
        streams_data: { watts: { data: watts }, heartrate: { data: hr }, time: { data: time } },
      },
    ];

    const result = estimateCyclingVO2max(activities, settings);
    expect(result.vo2max).toBeGreaterThan(0);
    expect(result.method).not.toBe('none');
  });
});

describe('fitnessStatsEngine - estimateRunningVO2max', () => {
  it('debe retornar 0 cuando no hay rango de FC válido', () => {
    const result = estimateRunningVO2max([], { fcReposo: 50, run: { max: 50 } });
    expect(result.vo2max).toBe(0);
  });

  it('debe estimar VO2max fisiológico cuando no hay actividades pero hay FC configurada', () => {
    const result = estimateRunningVO2max([], settings);
    expect(result.vo2max).toBeGreaterThan(0);
    expect(result.method).toBe('physiological_fallback');
  });
});

describe('fitnessStatsEngine - predictRaceTimes', () => {
  it('debe retornar null para VO2max inválido', () => {
    expect(predictRaceTimes(0)).toBeNull();
    expect(predictRaceTimes(-10)).toBeNull();
    expect(predictRaceTimes(null)).toBeNull();
  });

  it('debe retornar pronósticos para 5K, 10K, Media y Maratón', () => {
    const result = predictRaceTimes(50, []);
    expect(result).toHaveLength(4);
    const names = result.map(r => r.name);
    expect(names).toContain('5K');
    expect(names).toContain('10K');
    expect(names).toContain('Media');
    expect(names).toContain('Maratón');
    result.forEach(r => {
      expect(r).toHaveProperty('time');
      expect(r).toHaveProperty('pace');
      expect(r).toHaveProperty('preparation');
    });
  });
});
