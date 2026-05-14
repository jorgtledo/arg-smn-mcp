---
name: 02-documento-funcional
description: "Genera un Documento Funcional detallado de un proyecto de software. Use when: documentar features, casos de uso, módulos funcionales, documento funcional, functional spec, reglas de negocio, permisos y roles, integraciones."
argument-hint: "Nombre del proyecto o módulo específico a documentar (opcional)"
---

# Documento Funcional

Genera un documento funcional completo que describe los módulos, casos de uso, flujos, reglas de negocio, permisos, e integraciones de un proyecto de software. Nivel de detalle alto: flujos paso a paso, reglas con condiciones, y diagramas Mermaid.

## Cuándo Usar

- Para documentar la funcionalidad completa de un sistema.
- Cuando se necesita especificar casos de uso detallados con flujos alternativos.
- Para mapear permisos y roles del sistema.
- Para documentar integraciones con sistemas externos.
- Como insumo para QA, analistas funcionales, o nuevos desarrolladores.

## Procedimiento

### Paso 1 — Exploración profunda del codebase

Usá un subagente de exploración (thoroughness: **thorough**) para recopilar información funcional. La exploración debe cubrir:

#### 1.1 Estructura y módulos
- Listar carpetas de primer, segundo y tercer nivel.
- Identificar módulos funcionales por agrupación de carpetas (`Features/`, `Modules/`, `Areas/`, `Controllers/`, `Pages/`).
- Leer archivos README o docs existentes para contexto.

#### 1.2 Endpoints y casos de uso
- Leer **todos** los archivos de herramientas MCP, endpoints, controladores o handlers.
- Para proyectos MCP: leer los archivos en `src/tools/` y extraer cada `server.tool(name, description, schema, handler)`.
- Para proyectos REST: leer controllers, routers, o handlers — extraer ruta, método HTTP, parámetros, respuestas.
- Buscar descripciones de herramientas/endpoints en el propio código (descripciones Zod, comentarios JSDoc, XML summaries).

#### 1.3 Entidades y reglas de negocio
- Leer todos los archivos en carpetas de dominio: `Entities/`, `Models/`, `Domain/`, `src/types/`, `ValueObjects/`.
- Identificar tipos, interfaces y diccionarios de dominio.
- Buscar validaciones: **Zod schemas** (`z.string()`, `z.number()`, `.describe()`), `joi`, `yup`, validaciones manuales en handlers.
- Buscar constantes de negocio, enums, y `const Record<>` exportados que representen reglas de dominio.

#### 1.4 Autenticación, autorización y roles
- Buscar middleware de autenticación: `x-api-key`, JWT, OAuth, cookies — en carpetas `middleware/` o configuración de Express/Fastify/Koa.
- Identificar si hay roles definidos en enums, constantes, o base de datos.
- Buscar endpoints o rutas que sean públicas (sin autenticación).

#### 1.5 Integraciones externas
- Buscar clientes HTTP: instancias de **Axios** (`axios.create`), `fetch`, SDKs de terceros.
- Buscar configuraciones de conexión a servicios externos en `.env`, `.env.example`.
- Buscar interceptores HTTP (Axios interceptors) que inyecten auth o logueen requests.
- Buscar gestores de tokens/credenciales para APIs externas (`tokenManager.ts`, similares).
- Buscar colas de mensajería (`RabbitMQ`, `ServiceBus`, `Kafka`).
- Buscar llamadas a otros microservicios o APIs internas.

#### 1.6 Manejo de errores y mensajes
- Buscar mensajes de error en validadores, excepciones, respuestas de error.
- Buscar códigos de error personalizados o catálogos de mensajes.

### Paso 2 — Clasificar y organizar la información

Organizar lo encontrado en estas categorías:

| Categoría | Qué incluir |
|-----------|-------------|
| Módulos funcionales | Agrupaciones lógicas de features, su propósito y dependencias entre ellos |
| Casos de uso | Cada feature/endpoint como un caso de uso con actores, flujos y reglas |
| Reglas de negocio | Validaciones, restricciones, lógica condicional extraída del código |
| Permisos y roles | Quién puede hacer qué, políticas de acceso |
| Integraciones | Sistemas externos, qué datos se intercambian, dirección del flujo |
| Mensajes de error | Catálogo de errores relevantes del usuario |

### Paso 3 — Redactar cada sección

#### Reglas de redacción generales
- **Tono**: Funcional, orientado a negocio. Evitar jerga de implementación.
- **Idioma**: Español (salvo que el proyecto esté documentado en otro idioma).
- **Tiempo verbal**: Presente indicativo.
- **Marcar supuestos**: Usar *[inferido]* para lo que no está explícito en el código.
- **Diagramas**: Usar Mermaid inline para diagramas de flujo y secuencia. Seguir la guía de [diagramas](./references/diagramas-mermaid.md).

#### 3.1 — Módulos Funcionales

Para cada módulo:
- Nombre descriptivo (no el nombre de la carpeta técnica).
- Objetivo: qué resuelve funcionalmente.
- Relación con otros módulos (dependencias funcionales).
- Features que contiene (listado breve).

#### 3.2 — Casos de Uso / Features

Para cada caso de uso, completar **todas** estas subsecciones:

| Subsección | Contenido |
|------------|-----------|
| **Descripción** | Qué permite hacer este caso de uso, en 2-3 oraciones |
| **Actores** | Quién ejecuta la acción (usuario, sistema, servicio externo) |
| **Precondiciones** | Qué debe ser verdad antes de ejecutar |
| **Flujo principal** | Pasos numerados del camino exitoso (actor → sistema → respuesta) |
| **Flujos alternativos** | Paso a paso de cada variante, indicando desde qué paso del flujo principal se desvía |
| **Reglas de negocio** | Lista de reglas con formato: `RN-XXX: Descripción [condición → resultado]` |
| **Validaciones** | Cada campo validado con: campo, regla, mensaje de error |
| **Datos de entrada** | Parámetros con nombre, tipo funcional, obligatoriedad, descripción |
| **Datos de salida** | Estructura de la respuesta exitosa |
| **Mensajes de error** | Lista de errores posibles con código (si existe) y mensaje |
| **Diagrama** | Diagrama de flujo Mermaid del flujo principal + alternativos |

#### 3.3 — Permisos y Roles

Generar una **matriz de permisos**:

```markdown
| Acción / Feature | Rol A | Rol B | Rol C |
|-----------------|-------|-------|-------|
| Feature 1       | ✅    | ❌    | 👁️    |
| Feature 2       | ✅    | ✅    | ❌    |
```

Leyenda: ✅ Acceso completo | 👁️ Solo lectura | ❌ Sin acceso

Si los roles no están explícitos en el código, indicar *[inferido]* y documentar lo que se detectó (ej: "solo se detectó autenticación JWT sin roles diferenciados").

#### 3.4 — Integraciones Funcionales

Para cada integración:

| Campo | Contenido |
|-------|-----------|
| Sistema externo | Nombre del sistema/servicio |
| Propósito | Para qué se comunica |
| Dirección | Entrante / Saliente / Bidireccional |
| Datos intercambiados | Qué información se envía o recibe |
| Frecuencia | Tiempo real, bajo demanda, batch, programado |
| Diagrama | Diagrama de secuencia Mermaid si hay interacción compleja |

### Paso 4 — Guardar el documento

Guardar en `docs/documento-funcional.md` en la raíz del proyecto.

Si la carpeta `docs/` no existe, crearla.

### Paso 5 — Revisar con el usuario

1. Mostrar resumen: cantidad de módulos, casos de uso, reglas de negocio, e integraciones detectadas.
2. Listar todo lo marcado como *[inferido]*.
3. Preguntar si falta algún caso de uso, regla de negocio, o integración que el código no refleje.
4. Aplicar correcciones.

Usá la plantilla de referencia: [template](./references/template.md)

## Criterios de Calidad

- Cada caso de uso tiene **todas** las subsecciones completas (descripción, actores, flujo principal, alternativos, reglas, validaciones, datos, errores, diagrama).
- Los flujos alternativos indican desde qué paso se desvían del flujo principal.
- Las reglas de negocio tienen formato `RN-XXX` con condición y resultado explícitos.
- Los diagramas Mermaid son sintácticamente válidos y reflejan el flujo documentado.
- La matriz de permisos cubre todos los casos de uso listados.
- No hay terminología de implementación sin traducir a lenguaje funcional (ej: decir "consulta de alertas meteorológicas para una localidad" no "`get_warnings_by_location`").
- Las integraciones especifican dirección y datos intercambiados concretos.
- Todo lo que no está explícito en el código está marcado con *[inferido]*.
