import { describe, it, expect } from 'vitest';
import { healthHeadline } from '../../components/health/healthHeadline';

describe('healthHeadline', () => {
    it('devuelve una frase por cada estado conocido', () => {
        for (const l of ['Óptima', 'Adaptándose', 'Fatiga Alta']) {
            const h = healthHeadline(l);
            expect(h.lead && h.accent && h.tail).toBeTruthy();
        }
        expect(healthHeadline('Óptima').accent).toBe('listo');
    });
    it('usa la frase genérica con estado desconocido', () => {
        expect(healthHeadline('Desconocida').accent).toBe('suficientes');
        expect(healthHeadline(undefined).accent).toBe('suficientes');
    });
});
