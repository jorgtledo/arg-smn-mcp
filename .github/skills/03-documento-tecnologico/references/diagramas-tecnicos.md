# Guía de Diagramas Técnicos en Mermaid

## Tipos de diagrama a usar

### 1. Flowchart — Arquitectura del Sistema

Representar componentes, capas y flujo de datos.

**Ejemplo: API REST con base de datos**

```mermaid
flowchart TD
    subgraph Cliente["Capa Cliente"]
        A["Aplicación Web / Mobile / CLI"]
    end
    subgraph API["Capa API"]
        B["Servidor HTTP / Gateway"]
        C["Handlers / Controllers / Tools"]
        D["Servicios / Lógica"]
    end
    subgraph Datos["Capa de Datos"]
        E[("Base de Datos")]
        F[("Cache")]
    end
    subgraph Externos["Servicios Externos"]
        G["Servicio de Auth"]
        H["API de Terceros"]
    end
    A -->|HTTPS| B
    B --> C
    C --> D
    D --> E
    D --> F
    D -->|HTTP| H
    B -->|Token| G
```

**Ejemplo: Servidor MCP (stateless, sin base de datos propia)**

```mermaid
flowchart LR
    subgraph Clientes["Clientes MCP"]
        A["Claude / Cursor"]
        B["n8n (SSE)"]
    end
    subgraph MCP["Servidor MCP"]
        C["Express HTTP"]
        D["Auth Middleware\n(x-api-key)"]
        E["MCP Transport\n(Streamable / SSE)"]
        F["Tool Handlers"]
        G["Token Manager\n(JWT cache)"]
    end
    subgraph Externos["API Externa"]
        H["ws1.smn.gob.ar/v1"]
        I["ws2.smn.gob.ar\n(fuente JWT)"]
    end
    A -->|POST /mcp| C
    B -->|GET /sse| C
    C --> D
    D --> E
    E --> F
    F -->|Axios + JWT| H
    G -->|fetch HTML| I
    G -.->|inyecta token| F
```

**Convenciones:**
- `subgraph` para agrupar por capa o responsabilidad.
- Rectángulos `["..."]` para componentes de aplicación.
- Cilindros `[("...")]` para bases de datos y almacenamiento.
- Flechas con etiqueta de protocolo `-->|HTTPS|`.
- Dirección `TD` (top-down) para arquitecturas en capas.
- Dirección `LR` (left-right) para flujos de datos horizontales.

### 2. erDiagram — Modelo de Datos (proyectos con BD)

Representar entidades, atributos y relaciones. Usar solo si el proyecto tiene base de datos propia.

```mermaid
erDiagram
    USUARIO {
        int Id PK
        string Nombre
        string Email
        datetime FechaCreacion
    }
    PEDIDO {
        int Id PK
        int UsuarioId FK
        decimal Total
        string Estado
        datetime Fecha
    }
    USUARIO ||--o{ PEDIDO : "realiza"
```

**Convenciones de cardinalidad:**
- `||--||` → uno a uno
- `||--o{` → uno a muchos (el lado `o{` es el "muchos", `o` = opcional)
- `||--|{` → uno a muchos (obligatorio en ambos lados)
- `}o--o{` → muchos a muchos

**Convenciones de atributos:**
- Incluir `PK` para claves primarias.
- Incluir `FK` para claves foráneas.
- Usar tipos simples: `int`, `string`, `decimal`, `datetime`, `bool`.
- Máximo 6-8 atributos por entidad.

**Para proyectos stateless (sin BD propia):** en lugar de erDiagram, usar un diagrama de flujo o una tabla de tipos de dominio. No forzar un ER donde no hay relaciones.

### 3. Sequence Diagram — Integraciones Técnicas

Representar flujo de comunicación entre sistemas.

**Ejemplo: integración con API externa con auth**

```mermaid
sequenceDiagram
    participant C as Cliente MCP
    participant S as Servidor
    participant TM as Token Manager
    participant API as API Externa

    C->>S: POST /mcp (x-api-key)
    S->>S: Validar API key
    S->>TM: getToken()
    alt Token en caché válido
        TM-->>S: JWT cacheado
    else Token expirado / no existe
        TM->>API: GET / (fetch HTML)
        API-->>TM: HTML con token embebido
        TM->>TM: Parsear y cachear JWT
        TM-->>S: JWT nuevo
    end
    S->>API: GET /v1/recurso (Authorization: JWT ...)
    API-->>S: 200 OK + JSON
    S-->>C: Tool result (JSON)
```

**Ejemplo: flujo con manejo de error**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Sistema
    participant E as Servicio Externo

    C->>S: Solicita recurso
    S->>E: GET /endpoint
    alt Respuesta exitosa
        E-->>S: 200 OK + datos
        S-->>C: Resultado procesado
    else Error / timeout
        E-->>S: 5xx / timeout
        S-->>C: isError: true + mensaje
    end
```

**Convenciones:**
- `participant` con alias técnico corto.
- `->>` para requests (línea sólida).
- `-->>` para responses (línea punteada).
- Incluir método HTTP y ruta en las llamadas.
- Incluir código de status en las respuestas.
- Usar `alt`/`else` para flujos condicionales.

## Reglas generales

1. **Máximo 12-15 nodos** por diagrama. Si es más complejo, dividir en sub-diagramas.
2. **Nombres técnicos permitidos**: A diferencia del documento funcional, acá sí usar nombres de tecnología (JWT, REST, Axios, Docker, etc.).
3. **Consistencia**: Los nombres de entidades/componentes deben coincidir con los de las tablas descriptivas.
4. **Escapar caracteres**: Usar `["texto"]` para nodos con caracteres especiales o saltos de línea (`\n`).
5. **Validar sintaxis**: El diagrama debe renderizar en GitHub y VS Code sin errores.
6. **No incluir secretos**: Los diagramas muestran rutas y protocolos, nunca tokens, passwords, o connection strings.
