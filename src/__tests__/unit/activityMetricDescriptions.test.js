import { describe, it, expect } from 'vitest';
import { ACTIVITY_METRIC_DESCRIPTIONS, getActivityMetricDescription } from '../../utils/activityMetricDescriptions.js';

describe('utils/activityMetricDescriptions', () => {
  const expectedIds = [
    'tss', 'if', 'np', 'work', 'hrAvg', 'pace', 'speed', 'distance', 'duration',
    'elevation', 'cadence', 'wattsAvg', 'ef', 'decoupling',
  ];

  it('todas las métricas esperadas existen con id, label y description no vacíos', () => {
    for (const id of expectedIds) {
      const entry = ACTIVITY_METRIC_DESCRIPTIONS[id];
      expect(entry).toBeDefined();
      expect(entry.id).toBe(id);
      expect(typeof entry.label).toBe('string');
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('getActivityMetricDescription devuelve null para ids desconocidos', () => {
    expect(getActivityMetricDescription('no-existe')).toBeNull();
  });

  it('getActivityMetricDescription devuelve la entrada correcta para un id válido', () => {
    const entry = getActivityMetricDescription('tss');
    expect(entry.id).toBe('tss');
    expect(entry.label).toBe('Carga (TSS)');
    expect(entry.description).toContain('TSS');
  });

  it('los ids son únicos', () => {
    const ids = Object.keys(ACTIVITY_METRIC_DESCRIPTIONS);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
