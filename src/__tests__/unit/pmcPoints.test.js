import { describe, it, expect } from 'vitest';
import { pickTodayPoint, pmcTodayKey, projectionLabelText } from '../../utils/pmcPoints';

const serie = [
    { date: '2026-06-13', ctl: 38, tsb: 18 },
    { date: '2026-06-14', ctl: 40, tsb: 20 }, // hoy
    { date: '2026-06-15', ctl: 37, tsb: 23 },
    { date: '2026-06-21', ctl: 34, tsb: 26 }, // último proyectado
];

describe('pmcPoints', () => {
    it('BUG-1: el punto de hoy es el de hoy, no el último proyectado', () => {
        expect(pickTodayPoint(serie, '2026-06-14')).toMatchObject({ ctl: 40, tsb: 20 });
    });

    it('si hoy no está en la serie usa el último anterior', () => {
        expect(pickTodayPoint(serie.filter((p) => p.date !== '2026-06-14'), '2026-06-14').ctl).toBe(38);
    });

    it('sin datos o todo futuro', () => {
        expect(pickTodayPoint([], '2026-06-14')).toBeNull();
        expect(pickTodayPoint(null)).toBeNull();
        expect(pickTodayPoint(serie, '2026-01-01').ctl).toBe(38);
    });

    it('la clave de hoy sigue el criterio de calculatePMC (día UTC)', () => {
        expect(pmcTodayKey(new Date('2026-06-14T10:00:00Z'))).toBe('2026-06-14');
    });

    it('BUG-10: la etiqueta de proyección se abrevia u oculta si no cabe', () => {
        expect(projectionLabelText(120)).toBe('PROYECCIÓN');
        expect(projectionLabelText(40)).toBe('PROY.');
        expect(projectionLabelText(12)).toBeNull();
    });
});
