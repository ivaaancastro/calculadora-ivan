import { describe, it, expect } from 'vitest';
import { projectionLabelText } from '../../utils/pmcPoints';

describe('pmcPoints', () => {
    it('BUG-10: la etiqueta de proyección se abrevia u oculta si no cabe', () => {
        expect(projectionLabelText(120)).toBe('PROYECCIÓN');
        expect(projectionLabelText(40)).toBe('PROY.');
        expect(projectionLabelText(12)).toBeNull();
    });
});
