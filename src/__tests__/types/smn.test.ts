import { describe, it, expect } from 'vitest';
import { WARNING_EVENT_NAMES, WARNING_LEVEL_NAMES } from '../../types/smn.js';

describe('WARNING_EVENT_NAMES', () => {
  it('define exactamente 9 fenómenos meteorológicos', () => {
    expect(Object.keys(WARNING_EVENT_NAMES)).toHaveLength(9);
  });

  it('contiene todos los fenómenos esperados', () => {
    expect(WARNING_EVENT_NAMES[37]).toBe('lluvia');
    expect(WARNING_EVENT_NAMES[39]).toBe('viento');
    expect(WARNING_EVENT_NAMES[40]).toBe('niebla');
    expect(WARNING_EVENT_NAMES[41]).toBe('tormenta');
    expect(WARNING_EVENT_NAMES[42]).toBe('nevada');
    expect(WARNING_EVENT_NAMES[45]).toBe('ceniza volcánica');
    expect(WARNING_EVENT_NAMES[46]).toBe('polvo');
    expect(WARNING_EVENT_NAMES[47]).toBe('viento zonda');
    expect(WARNING_EVENT_NAMES[54]).toBe('humo');
  });

  it('devuelve undefined para IDs desconocidos', () => {
    expect(WARNING_EVENT_NAMES[0]).toBeUndefined();
    expect(WARNING_EVENT_NAMES[99]).toBeUndefined();
  });
});

describe('WARNING_LEVEL_NAMES', () => {
  it('define exactamente 5 niveles de alerta', () => {
    expect(Object.keys(WARNING_LEVEL_NAMES)).toHaveLength(5);
  });

  it('define los nombres de nivel correctamente', () => {
    expect(WARNING_LEVEL_NAMES[1]).toContain('verde');
    expect(WARNING_LEVEL_NAMES[2]).toContain('violeta');
    expect(WARNING_LEVEL_NAMES[3]).toBe('amarillo');
    expect(WARNING_LEVEL_NAMES[4]).toBe('naranja');
    expect(WARNING_LEVEL_NAMES[5]).toBe('rojo');
  });

  it('los niveles 1 y 2 incluyen descripción entre paréntesis', () => {
    expect(WARNING_LEVEL_NAMES[1]).toMatch(/\(.+\)/);
    expect(WARNING_LEVEL_NAMES[2]).toMatch(/\(.+\)/);
  });

  it('devuelve undefined para niveles fuera de rango', () => {
    expect(WARNING_LEVEL_NAMES[0]).toBeUndefined();
    expect(WARNING_LEVEL_NAMES[6]).toBeUndefined();
  });
});
