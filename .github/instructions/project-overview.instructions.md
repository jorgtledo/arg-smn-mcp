---
description: "Use when working on any file in the arg-smn-mcp project. Provides architecture context, project conventions, and solution structure for the SMN Argentina MCP server."
applyTo: "src/**"
---

# arg-smn-mcp — Documentación de la Solución

## Descripción General

Servidor **MCP (Model Context Protocol)** que expone datos meteorológicos de Argentina en tiempo real, consumiendo la API pública del [Servicio Meteorológico Nacional (SMN)](https://www.smn.gob.ar/). Permite a LLMs como Claude, n8n, Cursor y cualquier cliente MCP compatible consultar clima actual, pronósticos extendidos y alertas/advertencias vigentes.

**Autor**: Jorge Toledo

**Stack tecnológico:**

- Node.js 20 + TypeScript 6
- `@modelcontextprotocol/sdk` (SDK oficial MCP)
- Express 5 (servidor HTTP)
- Axios (cliente HTTP para la API SMN)
- Zod (validación de parámetros de herramientas MCP)
- Docker + Docker Compose

## Arquitectura

El servidor expone dos transportes MCP sobre HTTP:

- **Streamable HTTP** (`POST /mcp`) — para clientes modernos (Cursor, Claude Desktop)
- **SSE** (`GET /sse` + `POST /messages`) — para clientes legacy (n8n)
- **Health check** (`GET /health`) — endpoint público sin autenticación

Todos los endpoints MCP requieren autenticación por `x-api-key` header.

La obtención de datos meteorológicos requiere un **JWT** que se extrae automáticamente del HTML de `https://ws2.smn.gob.ar/` y se renueva antes de su expiración (1 hora). Este proceso es transparente para el usuario.

## Estructura del Proyecto

```
src/
├── index.ts                  # Entrypoint: servidor Express, rutas MCP/SSE/health
├── server.ts                 # Instancia McpServer + registro de herramientas
├── middleware/
│   └── auth.ts               # Middleware de autenticación x-api-key
├── services/
│   ├── smnClient.ts          # Cliente axios para ws1.smn.gob.ar/v1 + interceptores JWT/debug
│   └── tokenManager.ts       # Gestión del JWT: fetch, parseo, caché y auto-refresh
├── tools/
│   ├── index.ts              # Re-exports de las funciones de registro
│   └── location.ts           # Las 7 herramientas MCP registradas
├── types/
│   ├── smn.ts                # Interfaces TypeScript de los responses de la API SMN
│   └── axios.d.ts            # Extensión de InternalAxiosRequestConfig (metadata.startTime)
└── utils/
    └── logger.ts             # Logger configurable INFO/DEBUG con logRequest/logSuccess/logError/logDebugHttp/logDebugResponse
```

## Herramientas MCP Disponibles

| Tool | Endpoint SMN | Descripción |
|------|-------------|-------------|
| `search_location` | `GET /v1/georef/location/search?name=` | Busca localidades por nombre |
| `get_location` | `GET /v1/georef/location/{id}` | Detalle de localidad por ID |
| `get_weather_by_location` | `GET /v1/weather/location/{id}` | Clima actual por ID |
| `get_forecast_by_location` | `GET /v1/forecast/location/{id}` | Pronóstico extendido por ID |
| `get_weather_by_name` | search + weather + forecast | Clima + pronóstico por nombre (flujo completo) |
| `get_warnings_by_location` | `GET /v1/warning/alert/location/{id}` | Alertas y advertencias por ID |
| `get_warnings_by_name` | search + warnings | Alertas por nombre (flujo completo) |

## Configuración (`.env`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor HTTP |
| `API_KEY` | aleatorio | Clave de autenticación para clientes MCP |
| `LOG_LEVEL` | `INFO` | Nivel de log: `INFO` o `DEBUG` |

## Ejecución

- **Dev**: `npm run dev` (tsx, sin compilar)
- **Build**: `npm run build` → `dist/`
- **Start**: `npm start`
- **Docker**: `docker compose up --build -d`
- **Health**: `GET http://localhost:3000/health`
