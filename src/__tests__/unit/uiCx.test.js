import { describe, it, expect } from 'vitest';
import { cx } from '../../components/ui/cx.js';

describe('ui/cx: unión de clases', () => {
  it('une en orden y descarta falsos, vacíos y no cadenas', () => {
    expect(cx('a', false, null, undefined, '', '  ', 0, 'b')).toBe('a b');
  });

  it('aplana listas y recorta espacios', () => {
    expect(cx([' a ', ['b', false]], 'c')).toBe('a b c');
  });

  it('no deduplica ni reordena: el CSS decide como en el JSX original', () => {
    expect(cx('p-2', 'p-4', 'p-2')).toBe('p-2 p-4 p-2');
  });
});
