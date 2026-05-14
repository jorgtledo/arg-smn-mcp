# arg-smn-mcp

Servidor MCP (Model Context Protocol) para la API pública del [Servicio Meteorológico Nacional Argentino (SMN)](https://www.smn.gob.ar/).

Expone **7 herramientas MCP** que permiten a cualquier LLM compatible (Claude, n8n, etc.) consultar datos meteorológicos de Argentina en tiempo real: búsqueda de localidades, clima actual, pronósticos extendidos y alertas/advertencias vigentes.

Soporta **dos modos de conexión**:
- **HTTP** (predeterminado): servidor de red con autenticación por API key — ideal para n8n, acceso remoto o Docker Compose.
- **stdio**: el cliente MCP lanza el contenedor directamente y se comunica por stdin/stdout — ideal para Cursor y Claude Desktop sin exponer puertos.

---

## Herramientas disponibles

| Tool | Descripción | Parámetros |
|------|-------------|------------|
| `search_location` | Busca localidades por nombre, devuelve ID y datos geográficos | `name: string` |
| `get_location` | Detalle de una localidad por ID (coords, estación de referencia) | `id: number` |
| `get_weather_by_location` | Clima actual por ID de localidad | `id: number` |
| `get_forecast_by_location` | Pronóstico extendido (hasta 8 días) por ID de localidad | `id: number` |
| `get_weather_by_name` | Clima actual + pronóstico buscando por nombre (flujo completo) | `name: string` |
| `get_warnings_by_location` | Alertas y advertencias vigentes por ID de localidad | `id: number` |
| `get_warnings_by_name` | Alertas y advertencias buscando por nombre (flujo completo) | `name: string` |

### Niveles de alerta

| Nivel | Color | Significado |
|-------|-------|-------------|
| `1` | 🟢 Verde | Sin alerta |
| `2` | 🟣 Violeta | Advertencia |
| `3` | 🟡 Amarillo | Informate — posibles daños |
| `4` | 🟠 Naranja | Preparate — fenómenos peligrosos |
| `5` | 🔴 Rojo | Seguí instrucciones — fenómenos excepcionales |

### Fenómenos cubiertos en alertas

Tormenta · Lluvia · Nevada · Viento · Viento zonda · Niebla · Polvo · Humo · Ceniza volcánica

---

## Endpoints HTTP del servidor

| Endpoint | Transporte | Uso |
|----------|-----------|-----|
| `POST /mcp` | Streamable HTTP | Cursor, Claude Desktop, clientes modernos |
| `GET  /sse` | SSE | **n8n**, clientes heredados |
| `POST /messages?sessionId=<id>` | SSE (mensajes) | Parte del protocolo SSE |
| `GET  /health` | HTTP | Verificación de estado / Docker |

---

## Autenticación

Todos los endpoints MCP requieren el encabezado `x-api-key`:

```
x-api-key: <tu-api-key>
```

Si no se define `API_KEY` en el `.env`, el servidor genera una clave aleatoria al iniciar (se imprime en los registros).

---

## Requisitos

- **Node.js** >= 20
- **npm** >= 9
- **Docker** (recomendado para producción)

---

## Configuración

Copiar `.env.example` a `.env` y ajustar los valores:

```bash
cp .env.example .env
```

```env
# Modo de transporte MCP:
#   http  (predeterminado) — servidor HTTP/SSE con puerto de red y API_KEY.
#   stdio                  — stdin/stdout; sin puerto ni API_KEY.
MCP_TRANSPORT=http

# Puerto del servidor HTTP (solo aplica cuando MCP_TRANSPORT=http).
PORT=3000

# Clave de API (solo aplica cuando MCP_TRANSPORT=http).
# Si no se define, se genera una aleatoria en cada inicio (ver registros).
API_KEY=cambia-esta-clave-por-una-segura

# Nivel de registro: INFO (valor predeterminado) | DEBUG
# DEBUG agrega el endpoint HTTP exacto invocado al SMN, su código de respuesta y los cuerpos JSON.
LOG_LEVEL=INFO
```

---

## Inicio rápido con Docker Compose

```bash
# Ir al directorio
cd arg-smn-mcp

# Crear el .env
cp .env.example .env
# Editar .env con tu API_KEY

# Construir y levantar
docker compose up --build -d

# Ver registros
docker compose logs -f
```

El servidor queda disponible en `http://localhost:3000`.

---

## Instalación y uso local

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Iniciar el servidor
npm start
# → Escuchando en http://0.0.0.0:3000

# Desarrollo con recarga automática
npm run dev
```

---

## Conectar desde Cursor

### Opción A — Docker stdio (recomendado para uso local)

El cliente lanza el contenedor directamente. No se expone ningún puerto y no se necesita API key.

Primero, construir la imagen:

```bash
docker build -t arg-smn-mcp ./arg-smn-mcp
```

Luego, en `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "arg-smn-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "MCP_TRANSPORT=stdio", "arg-smn-mcp"]
    }
  }
}
```

### Opción B — HTTP (servidor corriendo en red)

Requiere tener el servidor levantado con `docker compose up` o `npm start`.

```json
{
  "mcpServers": {
    "arg-smn-mcp": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "x-api-key": "tu-api-key"
      }
    }
  }
}
```

---

## Conectar desde Claude Desktop

### Opción A — Docker stdio (recomendado para uso local)

```bash
docker build -t arg-smn-mcp ./arg-smn-mcp
```

En `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arg-smn-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "MCP_TRANSPORT=stdio", "arg-smn-mcp"]
    }
  }
}
```

### Opción B — HTTP (servidor corriendo en red)

```json
{
  "mcpServers": {
    "arg-smn-mcp": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "x-api-key": "tu-api-key"
      }
    }
  }
}
```

---

## Conectar desde n8n

n8n usa el transporte **SSE**. Configuración en el nodo **MCP Client** de n8n:

| Campo | Valor |
|-------|-------|
| **Connection Type** | SSE |
| **SSE URL** | `http://<host>:3000/sse` |
| **Encabezados** | `x-api-key: tu-api-key` |

> Si n8n y el servidor corren en Docker en la misma red, usar el nombre del servicio:
> `http://arg-smn-mcp:3000/sse`

### Ejemplo: red Docker compartida con n8n

```yaml
services:
  mcp-smn:
    image: arg-smn-mcp:latest
    build:
      context: ./arg-smn-mcp
    env_file:
      - ./arg-smn-mcp/.env
    networks:
      - n8n_network   # misma red que n8n

networks:
  n8n_network:
    external: true
```

---

## API SMN — Endpoints cubiertos

Base URL: `https://ws1.smn.gob.ar/v1`

El servidor obtiene automáticamente el JWT requerido desde `https://ws2.smn.gob.ar/` y lo renueva antes de que expire.

| Endpoint SMN | Tool MCP |
|-------------|----------|
| `GET /v1/georef/location/search?name=` | `search_location`, `get_weather_by_name`, `get_warnings_by_name` |
| `GET /v1/georef/location/{id}` | `get_location` |
| `GET /v1/weather/location/{id}` | `get_weather_by_location`, `get_weather_by_name` |
| `GET /v1/forecast/location/{id}` | `get_forecast_by_location`, `get_weather_by_name` |
| `GET /v1/warning/alert/location/{id}` | `get_warnings_by_location`, `get_warnings_by_name` |

---

## Estructura del proyecto

```
arg-smn-mcp/
├── src/
│   ├── index.ts                  # Entrypoint — modo HTTP o stdio según MCP_TRANSPORT
│   ├── server.ts                 # McpServer + registro de tools
│   ├── middleware/
│   │   └── auth.ts               # Middleware de autenticación por API key
│   ├── services/
│   │   ├── smnClient.ts          # Cliente axios para ws1.smn.gob.ar/v1
│   │   └── tokenManager.ts       # Gestión del JWT (fetch, caché, refresh)
│   ├── tools/
│   │   ├── index.ts              # Re-exports
│   │   └── location.ts           # Todas las herramientas MCP
│   ├── types/
│   │   ├── smn.ts                # Interfaces TypeScript de las respuestas
│   │   └── axios.d.ts            # Extensión de tipos Axios
│   └── utils/
│       └── logger.ts             # Logger configurable (INFO/DEBUG)
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Stack

- **Node.js 20 + TypeScript 6**
- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)** — SDK oficial MCP
- **[express](https://expressjs.com/)** — servidor HTTP
- **[axios](https://axios-http.com/)** — cliente HTTP para la API SMN
- **[zod](https://zod.dev/)** — validación de parámetros de entrada
- **Docker** (imagen `node:20-alpine`, compilación multietapa)

---

## Licencia

GNU GPL v2 — ver [LICENSE](./LICENSE).

> Los datos meteorológicos son propiedad del Servicio Meteorológico Nacional Argentino. Este proyecto no tiene fines comerciales ni de lucro.
