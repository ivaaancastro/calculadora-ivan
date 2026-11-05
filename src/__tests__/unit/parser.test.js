import { describe, it, expect } from 'vitest';
import { parseCSV, parseStravaDate } from '../../../src/utils/parser';

describe('parser - parseCSV', () => {
  it('debe parsear CSV simple con cabecera y una fila', () => {
    const result = parseCSV('Nombre,Fecha\nRodaje Easy,1 ene 2024');
    expect(result).toEqual([['Nombre', 'Fecha'], ['Rodaje Easy', '1 ene 2024']]);
  });

  it('debe manejar campos entrecomillados con comas internas', () => {
    const result = parseCSV('Actividad,Nota\n"Rodaje, fácil","Lluvia, viento"');
    expect(result).toEqual([['Actividad', 'Nota'], ['Rodaje, fácil', 'Lluvia, viento']]);
  });

  it('debe manejar comillas escapadas duplicadas dentro de campo', () => {
    const result = parseCSV('A,B\n"dato ""comillas""",x');
    expect(result).toEqual([['A', 'B'], ['dato "comillas"', 'x']]);
  });

  it('debe manejar saltos de línea CRLF, LF y CR', () => {
    const crlf = 'a,b\r\nc,d\r\n';
    const lf = 'a,b\nc,d\n';
    const cr = 'a,b\rc,d\r';
    expect(parseCSV(crlf)).toEqual([['a', 'b'], ['c', 'd']]);
    expect(parseCSV(lf)).toEqual([['a', 'b'], ['c', 'd']]);
    expect(parseCSV(cr)).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('debe devolver array vacío para string vacío', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('debe incluir última fila sin salto de línea final', () => {
    const result = parseCSV('x,y\n1,2');
    expect(result).toEqual([['x', 'y'], ['1', '2']]);
  });
});

describe('parser - parseStravaDate', () => {
  it('debe parsear formato corto "1 ene 2024"', () => {
    const result = parseStravaDate('1 ene 2024');
    expect(result).toContain('2024-01-01');
  });

  it('debe parsear mes completo "15 enero 2024 09:30:00"', () => {
    const result = parseStravaDate('15 enero 2024 09:30:00');
    expect(result).toContain('2024-01-15');
  });

  it('debe parsear abreviatura con punto "3 ago. 2023, 08:15:00"', () => {
    const result = parseStravaDate('3 ago. 2023, 08:15:00');
    expect(result).toContain('2023-08-03');
  });

  it('debe devolver null para entrada vacía o nula', () => {
    expect(parseStravaDate('')).toBeNull();
    expect(parseStravaDate(null)).toBeNull();
    expect(parseStravaDate(undefined)).toBeNull();
  });

  it('debe devolver null para fecha inválida', () => {
    expect(parseStravaDate('fecha inexistente')).toBeNull();
  });

  it('debe ignorar comillas alrededor de la fecha', () => {
    const result = parseStravaDate('"1 ene 2024"');
    expect(result).toContain('2024-01-01');
  });
});
