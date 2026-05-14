import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { smn1Client } from '../services/smnClient.js';
import type {
  LocationSearchTuple,
  LocationV1,
  WeatherV1,
  ForecastV1,
  WarningAlertV1,
} from '../types/smn.js';
import { WARNING_EVENT_NAMES, WARNING_LEVEL_NAMES } from '../types/smn.js';
import { logRequest, logSuccess, logError } from '../utils/logger.js';

export function registerLocationTools(server: McpServer): void {

  // ── 1. Buscar localidad por nombre ─────────────────────────────────────────
  server.tool(
    'search_location',
    'Busca localidades de Argentina por nombre. Devuelve una lista con el ID, nombre, departamento, provincia y estación meteorológica más cercana. Usar el ID para consultar clima o pronóstico.',
    {
      name: z.string().min(2).describe('Nombre de la localidad, ciudad o lugar (ej: "Buenos Aires", "Rosario", "San Fernando")'),
    },
    async ({ name }) => {
      const start = Date.now();
      logRequest('search_location', { name });
      try {
        const { data } = await smn1Client.get<LocationSearchTuple[]>('/v1/georef/location/search', {
          params: { name },
        });

        const results = data.map(([id, locName, dept, prov, , , lon, lat, dist, station]) => ({
          id,
          name: locName,
          department: dept,
          province: prov,
          lon,
          lat,
          distance_to_station_km: dist,
          nearest_station: station,
        }));

        logSuccess('search_location', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        logError('search_location', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al buscar localidad "${name}": ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 2. Detalle de una localidad por ID ─────────────────────────────────────
  server.tool(
    'get_location',
    'Obtiene los detalles de una localidad meteorológica por su ID (obtenido con search_location): nombre, departamento, provincia, coordenadas y estación de referencia.',
    {
      id: z.number().int().min(1).describe('ID numérico de la localidad (obtenido con search_location)'),
    },
    async ({ id }) => {
      const start = Date.now();
      logRequest('get_location', { id });
      try {
        const { data } = await smn1Client.get<LocationV1>(`/v1/georef/location/${id}`);
        logSuccess('get_location', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        logError('get_location', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener localidad ID ${id}: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 3. Clima actual por ID de localidad ────────────────────────────────────
  server.tool(
    'get_weather_by_location',
    'Obtiene el clima actual (temperatura, humedad, presión, viento, visibilidad) para una localidad específica por su ID. Usar search_location para obtener el ID.',
    {
      id: z.number().int().min(1).describe('ID numérico de la localidad (obtenido con search_location)'),
    },
    async ({ id }) => {
      const start = Date.now();
      logRequest('get_weather_by_location', { id });
      try {
        const { data } = await smn1Client.get<WeatherV1>(`/v1/weather/location/${id}`);
        logSuccess('get_weather_by_location', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        logError('get_weather_by_location', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener clima para localidad ID ${id}: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 4. Pronóstico por ID de localidad ──────────────────────────────────────
  server.tool(
    'get_forecast_by_location',
    'Obtiene el pronóstico extendido (hasta 8 días) para una localidad específica por su ID. Incluye temperatura mín/máx, humedad, probabilidad de lluvia, viento y descripción por franja horaria (madrugada, mañana, tarde, noche).',
    {
      id: z.number().int().min(1).describe('ID numérico de la localidad (obtenido con search_location)'),
    },
    async ({ id }) => {
      const start = Date.now();
      logRequest('get_forecast_by_location', { id });
      try {
        const { data } = await smn1Client.get<ForecastV1>(`/v1/forecast/location/${id}`);
        logSuccess('get_forecast_by_location', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        logError('get_forecast_by_location', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener pronóstico para localidad ID ${id}: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 5. Alertas y advertencias por ID de localidad ─────────────────────────
  server.tool(
    'get_warnings_by_location',
    'Obtiene las alertas y advertencias meteorológicas vigentes para una localidad por su ID (obtenido con search_location). Devuelve el nivel de alerta para los próximos días por fenómeno (tormenta, lluvia, nevada, viento, etc.) en cada franja horaria (madrugada, mañana, tarde, noche). Niveles: 1=verde/sin alerta, 2=violeta/advertencia, 3=amarillo, 4=naranja, 5=rojo.',
    {
      id: z.number().int().min(1).describe('ID numérico de la localidad (obtenido con search_location)'),
    },
    async ({ id }) => {
      const start = Date.now();
      logRequest('get_warnings_by_location', { id });
      try {
        const { data } = await smn1Client.get<WarningAlertV1>(`/v1/warning/alert/location/${id}`);

        const enriched = {
          area_id: data.area_id,
          updated: data.updated,
          warnings: data.warnings.map((day) => ({
            date: day.date,
            max_level: day.max_level,
            max_level_name: WARNING_LEVEL_NAMES[day.max_level] ?? String(day.max_level),
            events: day.events.map((ev) => ({
              id: ev.id,
              event: WARNING_EVENT_NAMES[ev.id] ?? `evento_${ev.id}`,
              max_level: ev.max_level,
              max_level_name: WARNING_LEVEL_NAMES[ev.max_level] ?? String(ev.max_level),
              ...(ev.levels
                ? {
                    levels: {
                      early_morning: ev.levels.early_morning,
                      morning: ev.levels.morning,
                      afternoon: ev.levels.afternoon,
                      night: ev.levels.night,
                    },
                  }
                : {}),
            })),
          })),
          ...(data.reports?.length
            ? {
                reports: data.reports.map((r) => ({
                  event_id: r.event_id,
                  event: WARNING_EVENT_NAMES[r.event_id] ?? `evento_${r.event_id}`,
                  levels: r.levels.map((l) => ({
                    level: l.level,
                    level_name: WARNING_LEVEL_NAMES[l.level] ?? String(l.level),
                    description: l.description,
                    instruction: l.instruction,
                  })),
                })),
              }
            : {}),
        };

        logSuccess('get_warnings_by_location', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(enriched, null, 2) }],
        };
      } catch (error) {
        logError('get_warnings_by_location', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener alertas para localidad ID ${id}: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 6. Alertas por nombre de localidad (flujo completo) ────────────────────
  server.tool(
    'get_warnings_by_name',
    'Flujo completo: busca una localidad por nombre y devuelve sus alertas y advertencias meteorológicas vigentes. Equivale a ejecutar search_location + get_warnings_by_location en una sola llamada. Incluye nivel de alerta por fenómeno (tormenta, lluvia, nevada, viento zonda, etc.) para los próximos días por franja horaria.',
    {
      name: z.string().min(2).describe('Nombre de la localidad (ej: "Córdoba", "Mendoza", "Bariloche")'),
    },
    async ({ name }) => {
      const start = Date.now();
      logRequest('get_warnings_by_name', { name });
      try {
        const { data: searchResults } = await smn1Client.get<LocationSearchTuple[]>('/v1/georef/location/search', {
          params: { name },
        });

        if (!searchResults.length) {
          return {
            content: [{ type: 'text' as const, text: `No se encontraron localidades para "${name}".` }],
          };
        }

        const [id, locName, dept, prov] = searchResults[0];
        logRequest('get_warnings_by_name → warnings', { id, locName });

        const { data } = await smn1Client.get<WarningAlertV1>(`/v1/warning/alert/location/${id}`);

        const result = {
          location: { id, name: locName, department: dept, province: prov },
          area_id: data.area_id,
          updated: data.updated,
          warnings: data.warnings.map((day) => ({
            date: day.date,
            max_level: day.max_level,
            max_level_name: WARNING_LEVEL_NAMES[day.max_level] ?? String(day.max_level),
            events: day.events
              .filter((ev) => ev.max_level > 1)
              .map((ev) => ({
                event: WARNING_EVENT_NAMES[ev.id] ?? `evento_${ev.id}`,
                max_level: ev.max_level,
                max_level_name: WARNING_LEVEL_NAMES[ev.max_level] ?? String(ev.max_level),
                ...(ev.levels
                  ? {
                      levels: {
                        early_morning: ev.levels.early_morning,
                        morning: ev.levels.morning,
                        afternoon: ev.levels.afternoon,
                        night: ev.levels.night,
                      },
                    }
                  : {}),
              })),
          })),
          ...(data.reports?.length
            ? {
                reports: data.reports.map((r) => ({
                  event: WARNING_EVENT_NAMES[r.event_id] ?? `evento_${r.event_id}`,
                  levels: r.levels.map((l) => ({
                    level_name: WARNING_LEVEL_NAMES[l.level] ?? String(l.level),
                    description: l.description,
                    instruction: l.instruction,
                  })),
                })),
              }
            : {}),
        };

        logSuccess('get_warnings_by_name', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        logError('get_warnings_by_name', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener alertas para "${name}": ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── 7. Clima + pronóstico por nombre (flujo completo) ──────────────────────
  server.tool(
    'get_weather_by_name',
    'Flujo completo: busca una localidad por nombre y devuelve el clima actual más el pronóstico extendido. Equivale a ejecutar search_location + get_weather_by_location + get_forecast_by_location en una sola llamada.',
    {
      name: z.string().min(2).describe('Nombre de la localidad (ej: "Córdoba", "Mendoza", "Bariloche")'),
    },
    async ({ name }) => {
      const start = Date.now();
      logRequest('get_weather_by_name', { name });
      try {
        const { data: searchResults } = await smn1Client.get<LocationSearchTuple[]>('/v1/georef/location/search', {
          params: { name },
        });

        if (!searchResults.length) {
          return {
            content: [{ type: 'text' as const, text: `No se encontraron localidades para "${name}".` }],
          };
        }

        const [id, locName, dept, prov] = searchResults[0];
        logRequest('get_weather_by_name → weather+forecast', { id, locName });

        const [weatherRes, forecastRes] = await Promise.all([
          smn1Client.get<WeatherV1>(`/v1/weather/location/${id}`),
          smn1Client.get<ForecastV1>(`/v1/forecast/location/${id}`),
        ]);

        const result = {
          location: { id, name: locName, department: dept, province: prov },
          weather: weatherRes.data,
          forecast: forecastRes.data,
        };

        logSuccess('get_weather_by_name', Date.now() - start);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        logError('get_weather_by_name', error, Date.now() - start);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error al obtener clima para "${name}": ${message}` }],
          isError: true,
        };
      }
    },
  );
}
