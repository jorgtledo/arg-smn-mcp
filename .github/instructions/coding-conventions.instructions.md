---
description: "Use when creating new MCP tools, services, or modifying existing ones in arg-smn-mcp. Covers coding conventions, patterns, and naming standards for the SMN MCP server."
applyTo: "src/**"
---

# Convenciones de Código — arg-smn-mcp

## Agregar una Nueva Herramienta MCP

Todas las herramientas se registran en `src/tools/location.ts` dentro de la función `registerLocationTools(server)`. Cada herramienta sigue este patrón:

```typescript
server.tool(
  'nombre_herramienta',
  'Descripción clara para el LLM que usa la herramienta.',
  {
    param: z.string().min(1).describe('Descripción del parámetro'),
  },
  async ({ param }) => {
    const start = Date.now();
    logRequest('nombre_herramienta', { param });
    try {
      const { data } = await smn1Client.get<TipoRespuesta>(`/v1/ruta/${param}`);
      logSuccess('nombre_herramienta', Date.now() - start);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      logError('nombre_herramienta', error, Date.now() - start);
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error al ...: ${message}` }],
        isError: true,
      };
    }
  },
);
```

## Patrones Obligatorios

### Logger
- Llamar `logRequest(toolName, params)` al inicio de cada herramienta.
- Llamar `logSuccess(toolName, elapsedMs)` antes del `return` exitoso.
- Llamar `logError(toolName, error, elapsedMs)` dentro del `catch`.
- Para logging de HTTP externo (solo DEBUG): usar `logDebugHttp` y `logDebugResponse` desde `smnClient.ts` vía interceptores Axios — no llamar directamente desde las tools.

### Cliente HTTP
- Siempre usar `smn1Client` (de `src/services/smnClient.ts`) para llamadas a la API del SMN. Nunca crear instancias Axios directas en las tools.
- El JWT se inyecta automáticamente vía interceptor en `smnClient.ts`. No manejar tokens en las tools.

### Tipos
- Definir las interfaces de respuesta en `src/types/smn.ts`.
- Usar genéricos en las llamadas axios: `smn1Client.get<MiTipo>(...)`.
- Los diccionarios de dominio (nombres de eventos, niveles) van como `const` en `smn.ts` y se importan en las tools.

### Validación de parámetros
- Usar Zod en la definición de cada herramienta. Nunca validar manualmente.
- IDs numéricos: `z.number().int().positive()`
- Strings de búsqueda: `z.string().min(2)`
- Añadir `.describe()` a todos los parámetros con una descripción útil para el LLM.

### Respuesta de herramientas
- Siempre devolver `{ content: [{ type: 'text' as const, text: ... }] }`.
- Para errores, agregar `isError: true`.
- Serializar los datos con `JSON.stringify(data, null, 2)` para legibilidad.
- Enriquecer los datos numéricos con nombres legibles cuando hay diccionarios disponibles (ej: `WARNING_LEVEL_NAMES[level]`).

### Servicios
- Los servicios van en `src/services/`. Cada servicio es un módulo con funciones exportadas (no clases).
- `tokenManager.ts` gestiona el JWT: exporta solo `getToken()`. No llamar `getToken()` desde las tools — solo desde `smnClient.ts`.

## Estructura de Tipos (`src/types/smn.ts`)

- Una interfaz por entidad de respuesta de la API.
- Prefijo según origen: sin prefijo para tipos base, sufijo `V1` para respuestas de `ws1.smn.gob.ar/v1`.
- Los diccionarios de dominio son `const` exportados, no enums.

```typescript
// Bien
export const WARNING_LEVEL_NAMES: Record<number, string> = { 1: 'verde', ... };
export interface WarningAlertV1 { area_id: number; ... }

// Mal
enum WarningLevel { Verde = 1, ... }
```

## Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Nombre de tool MCP | snake_case | `get_warnings_by_name` |
| Funciones TypeScript | camelCase | `registerLocationTools` |
| Interfaces | PascalCase + sufijo tipo | `WarningAlertV1`, `ForecastDayV1` |
| Constantes de dominio | UPPER_SNAKE_CASE | `WARNING_EVENT_NAMES` |
| Archivos | kebab-case | `smnClient.ts`, `tokenManager.ts` |

## Variables de Entorno

- Acceder siempre vía `process.env.NOMBRE_VAR`.
- Valores por defecto en `src/index.ts` o donde se consuman.
- Nunca hardcodear URLs, claves o tokens en el código.
- El archivo `.env` nunca se commitea (está en `.gitignore`). Usar `.env.example` como plantilla.

## Agregar un Nuevo Servicio

1. Crear `src/services/miServicio.ts`.
2. Exportar funciones (no clases).
3. Usar `logDebugHttp` / `logDebugResponse` para trazar llamadas HTTP externas en modo DEBUG.
4. Si el servicio hace llamadas a la API SMN, usar `smn1Client`; si necesita otra base URL, crear una nueva instancia Axios con `addDebugInterceptors` aplicado.

## Middleware

- Los middlewares van en `src/middleware/`.
- Deben retornar `void` y llamar `next()` para continuar o responder directamente en caso de error.
- No capturar ni suprimir errores silenciosamente.
