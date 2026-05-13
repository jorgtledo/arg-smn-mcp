// ── API v1 (ws1.smn.gob.ar) ──────────────────────────────────────────────────

/** Tupla devuelta por /v1/georef/location/search */
export type LocationSearchTuple = [
  id: number,
  name: string,
  department: string,
  province: string,
  wmo_id: number,
  alt_id: number,
  lon: number,
  lat: number,
  distance_km: number,
  station_name: string,
];

export interface LocationCoord {
  lon: number;
  lat: number;
}

export interface LocationV1 {
  id: number;
  name: string;
  department: string;
  province: string;
  type: string;
  coord: LocationCoord;
  ref?: {
    station: { id: number; name: string; distance: number };
    location_id: number;
    area_id: number;
  };
}

export interface WeatherWindV1 {
  direction: string;
  deg: number;
  speed: number;
}

export interface WeatherConditionV1 {
  description: string;
  id: number;
}

export interface WeatherV1 {
  date: string;
  humidity: number | null;
  pressure: number | null;
  feels_like: number | null;
  temperature: number | null;
  visibility: number | null;
  weather: WeatherConditionV1;
  wind: WeatherWindV1;
  station_id: number;
  location: LocationV1 & { distance: number };
}

export interface ForecastPeriodV1 {
  humidity: number | null;
  rain_prob_range: [number, number];
  gust_range: [number, number] | null;
  temperature: number | null;
  visibility: string;
  rain06h: number | null;
  weather: WeatherConditionV1;
  wind: { direction: string; deg: number; speed_range: [number, number] };
  river: null;
  border: null;
}

export interface ForecastDayV1 {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  early_morning: ForecastPeriodV1 | null;
  morning: ForecastPeriodV1 | null;
  afternoon: ForecastPeriodV1 | null;
  night: ForecastPeriodV1 | null;
}

export interface ForecastV1 {
  updated: string;
  location: LocationV1;
  type: string;
  forecast: ForecastDayV1[];
}

// ── Alertas y advertencias (ws1.smn.gob.ar/v1/warning) ───────────────────────

/** IDs de fenómenos meteorológicos usados en el sistema de alertas */
export const WARNING_EVENT_NAMES: Record<number, string> = {
  37: 'lluvia',
  39: 'viento',
  40: 'niebla',
  41: 'tormenta',
  42: 'nevada',
  45: 'ceniza volcánica',
  46: 'polvo',
  47: 'viento zonda',
  54: 'humo',
};

/** Niveles de alerta */
export const WARNING_LEVEL_NAMES: Record<number, string> = {
  1: 'verde (sin alerta)',
  2: 'violeta (advertencia)',
  3: 'amarillo',
  4: 'naranja',
  5: 'rojo',
};

export interface WarningEventLevels {
  early_morning: number | null;
  morning: number | null;
  afternoon: number | null;
  night: number | null;
}

export interface WarningEvent {
  id: number;
  max_level: number;
  levels?: WarningEventLevels;
}

export interface WarningDay {
  date: string;
  max_level: number;
  events: WarningEvent[];
}

export interface WarningReportLevel {
  level: number;
  description: string;
  instruction: string;
}

export interface WarningReport {
  event_id: number;
  levels: WarningReportLevel[];
}

export interface WarningAlertV1 {
  area_id: number;
  updated: string;
  warnings: WarningDay[];
  reports?: WarningReport[];
}
