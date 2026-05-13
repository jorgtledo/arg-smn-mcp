import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  LocationSearchTuple,
  LocationV1,
  WeatherV1,
  ForecastV1,
  WarningAlertV1,
} from '../../types/smn.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('../../services/smnClient.js', () => ({
  smn1Client: { get: mockGet },
}));

vi.mock('../../utils/logger.js', () => ({
  logRequest: vi.fn(),
  logSuccess: vi.fn(),
  logError: vi.fn(),
}));

import { registerLocationTools } from '../../tools/location.js';

// ── Captura de handlers registrados ──────────────────────────────────────────

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};
type Handler = (params: Record<string, unknown>) => Promise<ToolResult>;

const handlers = new Map<string, Handler>();

const mockServer = {
  tool: vi.fn((name: string, _desc: string, _schema: unknown, handler: Handler) => {
    handlers.set(name, handler);
  }),
} as unknown as McpServer;

beforeAll(() => {
  registerLocationTools(mockServer);
});

beforeEach(() => {
  mockGet.mockReset();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const sampleTuple: LocationSearchTuple[] = [
  [87, 'Córdoba', 'Capital', 'Córdoba', 87003, 0, -64.18, -31.41, 2.3, 'Estación Córdoba Aeropuerto'],
];

const sampleLocation: LocationV1 = {
  id: 87,
  name: 'Córdoba',
  department: 'Capital',
  province: 'Córdoba',
  type: 'city',
  coord: { lon: -64.18, lat: -31.41 },
};

const sampleWeather: WeatherV1 = {
  date: '2026-05-13T20:00:00Z',
  humidity: 65,
  pressure: 1012,
  feels_like: 18,
  temperature: 20,
  visibility: 10000,
  weather: { description: 'Despejado', id: 800 },
  wind: { direction: 'NO', deg: 315, speed: 15 },
  station_id: 87003,
  location: { ...sampleLocation, distance: 2.3 },
};

const sampleForecast: ForecastV1 = {
  updated: '2026-05-13T18:00:00Z',
  location: sampleLocation,
  type: 'daily',
  forecast: [],
};

const sampleWarning: WarningAlertV1 = {
  area_id: 10,
  updated: '2026-05-13T12:00:00Z',
  warnings: [
    {
      date: '2026-05-13',
      max_level: 3,
      events: [
        {
          id: 41,
          max_level: 3,
          levels: { early_morning: 1, morning: 3, afternoon: 2, night: 1 },
        },
      ],
    },
  ],
};

// ── Registro de las 7 herramientas ────────────────────────────────────────────

describe('registerLocationTools', () => {
  it('registra exactamente 7 herramientas', () => {
    expect(mockServer.tool).toHaveBeenCalledTimes(7);
  });

  it('registra todas las herramientas esperadas', () => {
    const names = [
      'search_location',
      'get_location',
      'get_weather_by_location',
      'get_forecast_by_location',
      'get_warnings_by_location',
      'get_warnings_by_name',
      'get_weather_by_name',
    ];
    for (const name of names) {
      expect(handlers.has(name)).toBe(true);
    }
  });
});

// ── search_location ───────────────────────────────────────────────────────────

describe('search_location', () => {
  it('devuelve lista de localidades con campos mapeados', async () => {
    mockGet.mockResolvedValueOnce({ data: sampleTuple });

    const result = await handlers.get('search_location')!({ name: 'Córdoba' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as Record<string, unknown>[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      id: 87,
      name: 'Córdoba',
      department: 'Capital',
      province: 'Córdoba',
      lon: -64.18,
      lat: -31.41,
      distance_to_station_km: 2.3,
      nearest_station: 'Estación Córdoba Aeropuerto',
    });
  });

  it('devuelve lista vacía cuando no hay resultados', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const result = await handlers.get('search_location')!({ name: 'XyzNoExiste' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as unknown[];
    expect(parsed).toHaveLength(0);
  });

  it('devuelve isError con mensaje descriptivo ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const result = await handlers.get('search_location')!({ name: 'Córdoba' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al buscar localidad "Córdoba"');
    expect(result.content[0].text).toContain('Network error');
  });
});

// ── get_location ──────────────────────────────────────────────────────────────

describe('get_location', () => {
  it('devuelve los detalles de la localidad como JSON', async () => {
    mockGet.mockResolvedValueOnce({ data: sampleLocation });

    const result = await handlers.get('get_location')!({ id: 87 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as LocationV1;
    expect(parsed.id).toBe(87);
    expect(parsed.name).toBe('Córdoba');
    expect(parsed.coord).toMatchObject({ lon: -64.18, lat: -31.41 });
  });

  it('devuelve isError con ID en el mensaje ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('404 Not Found'));

    const result = await handlers.get('get_location')!({ id: 9999 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('ID 9999');
  });
});

// ── get_weather_by_location ───────────────────────────────────────────────────

describe('get_weather_by_location', () => {
  it('devuelve el clima actual con todos los campos', async () => {
    mockGet.mockResolvedValueOnce({ data: sampleWeather });

    const result = await handlers.get('get_weather_by_location')!({ id: 87 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as WeatherV1;
    expect(parsed.temperature).toBe(20);
    expect(parsed.humidity).toBe(65);
    expect(parsed.wind.direction).toBe('NO');
  });

  it('devuelve isError ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('timeout'));

    const result = await handlers.get('get_weather_by_location')!({ id: 87 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al obtener clima');
  });
});

// ── get_forecast_by_location ──────────────────────────────────────────────────

describe('get_forecast_by_location', () => {
  it('devuelve el pronóstico extendido', async () => {
    mockGet.mockResolvedValueOnce({ data: sampleForecast });

    const result = await handlers.get('get_forecast_by_location')!({ id: 87 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as ForecastV1;
    expect(parsed.updated).toBe('2026-05-13T18:00:00Z');
    expect(parsed.location.name).toBe('Córdoba');
  });

  it('devuelve isError ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('service unavailable'));

    const result = await handlers.get('get_forecast_by_location')!({ id: 87 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al obtener pronóstico');
  });
});

// ── get_warnings_by_location ──────────────────────────────────────────────────

describe('get_warnings_by_location', () => {
  it('enriquece alertas con nombres de fenómeno y nivel', async () => {
    mockGet.mockResolvedValueOnce({ data: sampleWarning });

    const result = await handlers.get('get_warnings_by_location')!({ id: 87 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      warnings: Array<{
        max_level_name: string;
        events: Array<{ event: string; max_level_name: string; levels: object }>;
      }>;
    };
    expect(parsed.warnings[0].max_level_name).toBe('amarillo');
    expect(parsed.warnings[0].events[0].event).toBe('tormenta');
    expect(parsed.warnings[0].events[0].max_level_name).toBe('amarillo');
    expect(parsed.warnings[0].events[0].levels).toMatchObject({
      morning: 3,
      afternoon: 2,
    });
  });

  it('usa "evento_N" para IDs de fenómeno desconocidos', async () => {
    const warningUnknownEvent: WarningAlertV1 = {
      ...sampleWarning,
      warnings: [
        {
          date: '2026-05-13',
          max_level: 2,
          events: [{ id: 999, max_level: 2 }],
        },
      ],
    };
    mockGet.mockResolvedValueOnce({ data: warningUnknownEvent });

    const result = await handlers.get('get_warnings_by_location')!({ id: 87 });
    const parsed = JSON.parse(result.content[0].text) as {
      warnings: Array<{ events: Array<{ event: string }> }>;
    };

    expect(parsed.warnings[0].events[0].event).toBe('evento_999');
  });

  it('incluye reports cuando están presentes', async () => {
    const warningWithReports: WarningAlertV1 = {
      ...sampleWarning,
      reports: [
        {
          event_id: 41,
          levels: [
            { level: 3, description: 'Lluvias intensas', instruction: 'Evitar zonas bajas' },
          ],
        },
      ],
    };
    mockGet.mockResolvedValueOnce({ data: warningWithReports });

    const result = await handlers.get('get_warnings_by_location')!({ id: 87 });
    const parsed = JSON.parse(result.content[0].text) as {
      reports: Array<{ event: string; levels: Array<{ description: string }> }>;
    };

    expect(parsed.reports).toHaveLength(1);
    expect(parsed.reports[0].event).toBe('tormenta');
    expect(parsed.reports[0].levels[0].description).toBe('Lluvias intensas');
  });

  it('devuelve isError ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('error de red'));

    const result = await handlers.get('get_warnings_by_location')!({ id: 87 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al obtener alertas');
  });
});

// ── get_warnings_by_name ──────────────────────────────────────────────────────

describe('get_warnings_by_name', () => {
  it('busca la localidad y devuelve sus alertas', async () => {
    mockGet
      .mockResolvedValueOnce({ data: sampleTuple })
      .mockResolvedValueOnce({ data: sampleWarning });

    const result = await handlers.get('get_warnings_by_name')!({ name: 'Córdoba' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      location: { id: number; name: string };
      warnings: unknown[];
    };
    expect(parsed.location.id).toBe(87);
    expect(parsed.location.name).toBe('Córdoba');
    expect(parsed.warnings).toHaveLength(1);
  });

  it('informa cuando no se encuentran localidades', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const result = await handlers.get('get_warnings_by_name')!({ name: 'Inexistente' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('No se encontraron localidades');
    expect(result.content[0].text).toContain('Inexistente');
  });

  it('filtra eventos con nivel 1 (sin alerta)', async () => {
    const lowLevelWarning: WarningAlertV1 = {
      ...sampleWarning,
      warnings: [
        {
          date: '2026-05-13',
          max_level: 1,
          events: [
            { id: 37, max_level: 1 },
            { id: 41, max_level: 3 },
          ],
        },
      ],
    };
    mockGet
      .mockResolvedValueOnce({ data: sampleTuple })
      .mockResolvedValueOnce({ data: lowLevelWarning });

    const result = await handlers.get('get_warnings_by_name')!({ name: 'Córdoba' });
    const parsed = JSON.parse(result.content[0].text) as {
      warnings: Array<{ events: Array<{ event: string }> }>;
    };

    expect(parsed.warnings[0].events).toHaveLength(1);
    expect(parsed.warnings[0].events[0].event).toBe('tormenta');
  });

  it('devuelve isError ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('error inesperado'));

    const result = await handlers.get('get_warnings_by_name')!({ name: 'Córdoba' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al obtener alertas');
  });
});

// ── get_weather_by_name ───────────────────────────────────────────────────────

describe('get_weather_by_name', () => {
  it('busca la localidad y devuelve clima y pronóstico en paralelo', async () => {
    mockGet
      .mockResolvedValueOnce({ data: sampleTuple })
      .mockResolvedValueOnce({ data: sampleWeather })
      .mockResolvedValueOnce({ data: sampleForecast });

    const result = await handlers.get('get_weather_by_name')!({ name: 'Córdoba' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      location: { id: number };
      weather: { temperature: number };
      forecast: { updated: string };
    };
    expect(parsed.location.id).toBe(87);
    expect(parsed.weather.temperature).toBe(20);
    expect(parsed.forecast.updated).toBe('2026-05-13T18:00:00Z');
  });

  it('informa cuando no se encuentran localidades', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const result = await handlers.get('get_weather_by_name')!({ name: 'Inexistente' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('No se encontraron localidades');
  });

  it('llama a weather y forecast con el ID de la primera localidad encontrada', async () => {
    mockGet
      .mockResolvedValueOnce({ data: sampleTuple })
      .mockResolvedValueOnce({ data: sampleWeather })
      .mockResolvedValueOnce({ data: sampleForecast });

    await handlers.get('get_weather_by_name')!({ name: 'Córdoba' });

    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockGet.mock.calls[1][0]).toBe('/v1/weather/location/87');
    expect(mockGet.mock.calls[2][0]).toBe('/v1/forecast/location/87');
  });

  it('devuelve isError ante fallo de API', async () => {
    mockGet.mockRejectedValueOnce(new Error('timeout'));

    const result = await handlers.get('get_weather_by_name')!({ name: 'Córdoba' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error al obtener clima');
  });
});
