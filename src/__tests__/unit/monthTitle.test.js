import { describe, it, expect } from 'vitest';
import { monthTitle } from '../../utils/monthTitle';

describe('monthTitle (BUG-8)', () => {
    it('pone en mayúscula solo la primera letra', () => {
        expect(monthTitle(2026, 5)).toBe('Junio de 2026');
    });
});
