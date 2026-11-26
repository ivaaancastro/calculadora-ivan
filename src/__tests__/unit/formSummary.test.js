import { describe, it, expect } from 'vitest';
import { buildFormSummary, formStateKey } from '../../utils/formSummary';

describe('formStateKey', () => {
  it.each([
    [{ ctl: 0, tsb: 0 }, 'insufficient'],
    [{ ctl: 50, tsb: 30 }, 'transition'],
    [{ ctl: 50, tsb: 10 }, 'peak'],
    [{ ctl: 50, tsb: -5 }, 'productive'],
    [{ ctl: 50, tsb: -20 }, 'overload'],
    [{ ctl: 50, tsb: -40 }, 'critical'],
  ])('%j → %s', (input, expected) => expect(formStateKey(input)).toBe(expected));
});

describe('buildFormSummary', () => {
  it('sin carga explica qué falta', () => {
    const r = buildFormSummary({});
    expect(r.state).toBe('insufficient');
    expect(r.sentence).toMatch(/Aún no hay carga/);
  });
  it('incluye tendencia al alza con coma decimal', () => {
    const r = buildFormSummary({ ctl: 60, tsb: -3, loadTrend: 4.25 });
    expect(r.sentence).toContain('sube un 4,3 % en 28 días');
    expect(r.tone).toBe('productive');
  });
  it('tendencia estable dentro de ±2 %', () => {
    expect(buildFormSummary({ ctl: 60, tsb: 8, loadTrend: 1 }).sentence).toContain('se mantiene estable');
  });
  it('avisa de ACWR alto y bajo, y de rampa alta', () => {
    expect(buildFormSummary({ ctl: 60, tsb: -3, acwr: 1.7 }).sentence).toMatch(/Ojo/);
    expect(buildFormSummary({ ctl: 60, tsb: -3, acwr: 0.5 }).sentence).toMatch(/baja respecto/);
    expect(buildFormSummary({ ctl: 60, tsb: -3, acwr: 1, rampRate: 9 }).sentence).toMatch(/rampa/);
  });
});
