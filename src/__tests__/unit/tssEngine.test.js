import { describe, it, expect } from 'vitest';
import { calculatePMC, getSportCategory } from '../../../src/utils/tssEngine';

describe('tssEngine - PMC Calculations', () => {

  it('debería retornar métricas vacías si no hay actividades', () => {
    const result = calculatePMC([]);
    expect(result.fullSeries).toEqual([]);
    expect(result.metrics).toBeNull();
  });

  it('debería calcular el CTL correctamente para una sola actividad de 100 TSS', () => {
    // Simulamos que hoy es 2026-07-06 y la actividad fue ayer
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const activities = [
      { date: yesterday.toISOString(), tss: 100, type: 'Ciclismo' }
    ];

    const result = calculatePMC(activities, { ta: 42, tf: 7 });
    
    // K_CTL_GAIN para 42 días es (1 - exp(-1/42)) = ~0.0235...
    // El CTL del día 1 será 100 * 0.0235 = ~2.35
    
    // El test verifica que la serie temporal no está vacía
    expect(result.fullSeries.length).toBeGreaterThan(0);
    
    // Verificamos las métricas actuales (hasta +7 días)
    expect(result.metrics).not.toBeNull();
    // La fatiga baja rápidamente, el fitness baja lentamente.
    // El CTL del último punto debería ser > 0 y < 100
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
