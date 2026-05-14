---
name: 03-documento-tecnologico
description: "Genera un Documento Tecnológico detallado de un proyecto de software. Use when: documentar arquitectura, stack tecnológico, infraestructura, seguridad, modelo de datos, diagrama ER, integraciones técnicas, librerías, CI/CD, testing, limitaciones técnicas, documento técnico, technical doc."
argument-hint: "Nombre del proyecto o componente específico a documentar (opcional)"
---

# Documento Tecnológico

Genera un documento técnico completo que describe la arquitectura, stack, infraestructura, seguridad, modelo de datos, integraciones, pruebas y limitaciones técnicas de un proyecto de software. Incluye diagramas Mermaid (arquitectura, ER, secuencia) y listado completo de dependencias.

## Cuándo Usar

- Para documentar la arquitectura y decisiones técnicas de un sistema.
- Cuando se necesita un inventario completo de tecnologías y librerías.
- Para documentar infraestructura, CI/CD y seguridad.
- Para generar el modelo de datos con diagrama ER.
- Como referencia técnica para DevOps, nuevos desarrolladores, o auditorías.

## Procedimiento

### Paso 1 — Exploración técnica del codebase

Usá un subagente de exploración (thoroughness: **thorough**) para recopilar toda la información técnica. La exploración debe cubrir:

#### 1.1 Arquitectura y estructura
- Listar carpetas de primer, segundo y tercer nivel para inferir el patrón arquitectónico.
- Leer el entrypoint principal completo: `index.ts`, `main.ts`, `app.ts` (Node.js/TS) o equivalente en el lenguaje del proyecto.
- Buscar archivos de instrucciones (`.github/instructions/`, `copilot-instructions.md`) que describan la arquitectura.
- Buscar archivos README o docs existentes.
- Leer memory files del repositorio (`/memories/repo/`).

#### 1.2 Dependencias y librerías
- Leer el archivo de dependencias completo: `package.json` (Node.js), `requirements.txt` / `pyproject.toml` (Python), `Cargo.toml` (Rust), `go.mod` (Go), `Gemfile` (Ruby), `pom.xml` / `build.gradle` (Java).
- Para cada dependencia: nombre, versión, y propósito (inferir del nombre o de cómo se usa en el código).
- Distinguir entre dependencias de runtime y de desarrollo/test (`dependencies` vs `devDependencies` en Node.js).

#### 1.3 Infraestructura y CI/CD
- Buscar `Dockerfile`, `docker-compose.*`, `.dockerignore`.
- Buscar pipelines: `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `Jenkinsfile`, `.circleci/`.
- Buscar archivos de despliegue: `deploy/`, `k8s/`, `terraform/`, `bicep/`, `pulumi/`.
- Buscar scripts npm/make relevantes en `package.json` (build, start, dev, test).
- Buscar configuración de monitoreo/logging: logger customizado (`src/utils/logger.ts`), Winston, Pino, ELK, Prometheus, etc.

#### 1.4 Seguridad
- Buscar configuración de autenticación: JWT, OAuth, API keys en headers (`x-api-key`), cookies.
- Buscar middlewares de seguridad en Express/Fastify/Koa: CORS, rate limiting, helmet, HTTPS redirect.
- Buscar manejo de secretos: archivos `.env`, `.env.example` (detectar patrones de secretos, NO extraer valores).
- Buscar políticas de autorización, claims, roles.
- Buscar configuración de encriptación o hashing.

#### 1.5 Modelo de datos / Tipos de dominio
- Si hay base de datos: leer entidades en `Entities/`, `Models/`, `Domain/`, `Data/`; buscar migraciones, ORM (Prisma, TypeORM, Sequelize).
- Si no hay base de datos (servidor stateless): leer interfaces y tipos en `src/types/`, `types/`, `models/` — documentar los tipos de dominio como estructura de datos de la API.
- Buscar diccionarios de dominio (`const Record<>`, enums) que representan estados, tipos o clasificaciones.
- Identificar estructuras de request/response de integraciones externas.

#### 1.6 Integraciones técnicas
- Buscar clientes HTTP: instancias de **Axios** (`axios.create`), `fetch`, `got`, SDKs de terceros.
- Buscar interceptores HTTP que modifiquen headers, inyecten auth, o logueen requests/responses.
- Leer configuraciones de endpoints externos en `.env.example` o constantes en el código.
- Buscar gestores de tokens o credenciales para APIs externas (ej: `tokenManager.ts`).
- Buscar colas de mensajería: RabbitMQ, Azure Service Bus, Kafka, MassTransit.
- Para cada integración: protocolo, base URL, formato de datos (JSON/XML), mecanismo de autenticación, dirección del flujo.

#### 1.7 Pruebas
- Buscar carpetas de test: `__tests__/`, `tests/`, `spec/`, `test/`, `*.test.ts`, `*.spec.ts`.
- Identificar frameworks de testing: Jest, Vitest, Mocha, pytest, etc.
- Buscar configuración de cobertura: `istanbul`, `c8`, `coverage.py`.
- Clasificar: unitarios, integración, E2E, performance.
- Si no hay pruebas, indicarlo explícitamente como limitación técnica.

### Paso 2 — Clasificar la información

Organizar lo encontrado en estas categorías:

| Categoría | Qué incluir |
|-----------|-------------|
| Arquitectura | Patrón, componentes principales, capas, diagrama |
| Tecnologías | Lenguajes, frameworks, BD, runtime |
| Librerías | Listado completo con versión y propósito |
| Infraestructura | Hosting, contenedores, CI/CD, monitoreo, logging |
| Seguridad | Auth, authz, encriptación, secretos, backups |
| Integraciones técnicas | Protocolos, endpoints, formatos, auth por integración |
| Modelo de datos | Entidades, relaciones, diagrama ER |
| Pruebas | Tipos, frameworks, cobertura |
| Limitaciones técnicas | Deuda técnica, restricciones, riesgos |

### Paso 3 — Redactar cada sección

#### Reglas de redacción
- **Tono**: Técnico, preciso, orientado a desarrolladores y DevOps.
- **Idioma**: Español (salvo que el proyecto esté documentado en otro idioma). Nombres de tecnologías en su idioma original.
- **Marcar supuestos**: Usar *[inferido]* para lo que no está explícito en el código.
- **Diagramas**: Usar Mermaid inline. Seguir la guía de [diagramas técnicos](./references/diagramas-tecnicos.md).
- **Versiones**: Siempre incluir la versión cuando esté disponible.

#### 3.1 — Arquitectura Aplicada

- Nombre del patrón (MVC, Clean Architecture, Vertical Slice, microservicios, monolito, etc.).
- Justificación inferida de por qué ese patrón (basada en la estructura).
- Componentes principales y sus responsabilidades.
- Diagrama Mermaid de la arquitectura (ver guía de diagramas).

#### 3.2 — Tecnologías Utilizadas

Tabla resumen:

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| Lenguaje | ... | ... | ... |
| Framework | ... | ... | ... |
| Base de datos | ... | ... | ... |
| Runtime | ... | ... | ... |

#### 3.3 — Librerías Utilizadas

Listado **completo** de dependencias, separado en Runtime y Desarrollo/Test:

| Librería | Versión | Categoría | Propósito |
|----------|---------|-----------|-----------|
| ... | ... | Runtime / Dev / Test | ... |

#### 3.4 — Infraestructura

Para cada componente de infra detectado, documentar:
- **Hosting / Cloud**: Proveedor, tipo de servicio (App Service, EC2, etc.).
- **Contenedores**: Dockerfile, compose, orquestador.
- **CI/CD**: Pipelines, etapas, triggers.
- **Monitoreo y logging**: Herramientas, niveles, destinos de logs.

Si algún componente no se detecta en el código, indicar *[no detectado en el codebase — confirmar con el equipo]*.

#### 3.5 — Seguridad

| Aspecto | Implementación |
|---------|----------------|
| Autenticación | {mecanismo detectado} |
| Autorización | {mecanismo detectado} |
| Encriptación | {en tránsito / en reposo / ambos} |
| Manejo de secretos | {mecanismo detectado} |
| Políticas de backup | {detectado / no detectado} |
| CORS | {configuración detectada} |
| HTTPS | {forzado / opcional / no detectado} |

**IMPORTANTE**: No incluir valores de secretos, connection strings, ni claves. Solo documentar el mecanismo.

#### 3.6 — Integraciones Técnicas

Para cada integración:

| Campo | Detalle |
|-------|---------|
| Servicio | Nombre del sistema externo |
| Protocolo | HTTP REST / gRPC / WebSocket / AMQP / etc. |
| Endpoint base | URL base (sin secretos) o patrón de ruta |
| Formato de datos | JSON / XML / Protobuf / etc. |
| Autenticación | Bearer token / API Key / mTLS / etc. |
| Dirección | Consumo / Exposición / Bidireccional |

Incluir diagrama de secuencia Mermaid para integraciones complejas.

#### 3.7 — Modelo de Datos / Tipos de Dominio

Si el proyecto tiene base de datos, generar **ambos**:

1. **Diagrama ER en Mermaid** con entidades, atributos clave, y relaciones.
2. **Tabla de detalle** por entidad:

| Tabla/Entidad | Columna | Tipo | Nullable | Clave | Descripción |
|---------------|---------|------|----------|-------|-------------|
| ... | ... | ... | ... | PK / FK a X | ... |

Si el proyecto es **stateless** (sin base de datos propia), documentar en cambio:

1. **Tipos/interfaces de dominio** principales con sus campos y propósito.
2. **Estructuras de respuesta de APIs externas** relevantes que el sistema consume y expone.
3. **Diccionarios de dominio** (constantes, enums, mapas ID→nombre).

Documentar también:
- Enums o `const Record<>` relevantes con sus valores.
- Scripts de migración o inicialización si existen.

#### 3.8 — Pruebas

| Tipo | Framework | Cobertura | Ubicación |
|------|-----------|-----------|-----------|
| Unitarios | ... | ...% / No medida | ... |
| Integración | ... | ... | ... |
| E2E | ... | ... | ... |

Si no hay pruebas, indicarlo explícitamente como limitación técnica.

#### 3.9 — Limitaciones Técnicas Actuales

Lista específica de deuda técnica, restricciones y riesgos. Cada limitación con:
- **Descripción**: Qué es la limitación.
- **Impacto**: A qué afecta (performance, escalabilidad, mantenibilidad, seguridad).
- **Severidad**: Alta / Media / Baja.

Fuentes para detectar limitaciones:
- TODOs y HACKs en el código.
- Dependencias desactualizadas o deprecated.
- Ausencia de pruebas.
- Configuraciones hardcodeadas.
- Patrones anti-pattern detectados.
- Falta de monitoreo o logging.

### Paso 4 — Guardar el documento

Guardar en `docs/documento-tecnologico.md` en la raíz del proyecto.

Si la carpeta `docs/` no existe, crearla.

### Paso 5 — Revisar con el usuario

1. Mostrar resumen: cantidad de tecnologías, librerías, entidades, integraciones, y limitaciones detectadas.
2. Listar todo lo marcado como *[inferido]* o *[no detectado]*.
3. Preguntar específicamente por infraestructura y seguridad (las secciones más difíciles de inferir del código).
4. Aplicar correcciones.

Usá la plantilla de referencia: [template](./references/template.md)

## Criterios de Calidad

- El diagrama de arquitectura refleja la estructura real del código, no una arquitectura idealizada.
- Todas las dependencias del archivo de paquetes están listadas con versión y propósito.
- El diagrama ER es sintácticamente válido en Mermaid y consistente con la tabla de detalle.
- La sección de seguridad NO contiene secretos, connection strings, ni claves.
- Las limitaciones son específicas y accionables (no genéricas como "podría mejorar el performance").
- Cada integración tiene protocolo, formato y dirección documentados.
- Lo que no se pudo detectar está marcado claramente, no inventado.
