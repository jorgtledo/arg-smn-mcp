import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logRequest,
  logSuccess,
  logError,
  logDebugHttp,
  logDebugResponse,
} from '../../utils/logger.js';

describe('logger (nivel INFO por defecto)', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  describe('logRequest', () => {
    it('escribe al stderr con etiqueta INFO y REQUEST', () => {
      logRequest('search_location', { name: 'Buenos Aires' });

      expect(stderrSpy).toHaveBeenCalledOnce();
      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('[INFO ]');
      expect(output).toContain('[REQUEST]');
      expect(output).toContain('search_location');
      expect(output).toContain('Buenos Aires');
    });

    it('omite los parámetros cuando no se pasan', () => {
      logRequest('health');

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('health');
      expect(output).not.toContain('{');
    });

    it('omite los parámetros cuando el objeto está vacío', () => {
      logRequest('health', {});

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).not.toContain('{');
    });
  });

  describe('logSuccess', () => {
    it('incluye el nombre de la herramienta y la duración en ms', () => {
      logSuccess('get_location', 42);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('[INFO ]');
      expect(output).toContain('get_location');
      expect(output).toContain('42ms');
    });
  });

  describe('logError', () => {
    it('escribe con nivel ERROR e incluye el mensaje del Error', () => {
      logError('get_weather_by_location', new Error('timeout'), 123);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('[ERROR]');
      expect(output).toContain('get_weather_by_location');
      expect(output).toContain('timeout');
      expect(output).toContain('123ms');
    });

    it('convierte a string valores no-Error', () => {
      logError('tool', 'algo salió mal', 0);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('[ERROR]');
      expect(output).toContain('algo salió mal');
    });

    it('convierte a string errores de tipo objeto', () => {
      logError('tool', { code: 500 }, 0);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toContain('[ERROR]');
    });
  });

  describe('funciones DEBUG con nivel INFO configurado', () => {
    it('logDebugHttp no escribe nada', () => {
      logDebugHttp('GET', 'https://ws1.smn.gob.ar/v1/georef/location/search');

      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('logDebugHttp con params y body no escribe nada', () => {
      logDebugHttp('GET', 'https://ejemplo.com', { name: 'test' }, { key: 'value' });

      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('logDebugResponse no escribe nada', () => {
      logDebugResponse('https://ws1.smn.gob.ar', 200, 50);

      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('logDebugResponse con body no escribe nada', () => {
      logDebugResponse('https://ws1.smn.gob.ar', 200, 50, { data: 'test' });

      expect(stderrSpy).not.toHaveBeenCalled();
    });
  });

  describe('formato de línea de log', () => {
    it('incluye timestamp ISO en el mensaje', () => {
      logSuccess('tool', 1);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('termina con salto de línea', () => {
      logSuccess('tool', 1);

      const output = String(stderrSpy.mock.calls[0][0]);
      expect(output.endsWith('\n')).toBe(true);
    });
  });
});
