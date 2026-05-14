---
name: 05-documento-operacion
description: "Genera un Documento de Operación (runbook) de un proyecto de software. Use when: documentar despliegue, deploy, monitoreo, recuperación ante fallos, soporte, logs, auditoría, runbook, operaciones, operations doc, disaster recovery, troubleshooting."
argument-hint: "Nombre del proyecto o entorno específico a documentar (opcional)"
---

# Documento de Operación

Genera un runbook operativo que documenta cómo se despliega, monitorea, recupera y soporta un sistema en producción. Orientado a equipos de DevOps, SRE, soporte L2/L3, y desarrolladores de guardia.

## Cuándo Usar

- Para documentar procedimientos operativos de un sistema en producción.
- Cuando un equipo de soporte necesita saber cómo actuar ante incidentes.
- Para onboarding de DevOps o SRE al proyecto.
- Antes de un go-live o release importante.
- Cuando el cliente pide "documentación de despliegue" o "plan de contingencia".

## Procedimiento

### Paso 1 — Recopilar contexto previo

Verificar si existen documentos ya generados:

1. Leer `docs/documento-tecnologico.md` si existe — extraer secciones de **Infraestructura**, **Seguridad**, y **Limitaciones Técnicas**.
2. Leer `docs/sugerencias-mejoras.md` si existe — extraer **Riesgos Técnicos** relevantes a operación.
3. Leer memory files del repositorio (`/memories/repo/`).

Si no existen, proceder con exploración directa.

### Paso 2 — Exploración operativa del codebase

Usá un subagente de exploración (thoroughness: **thorough**) para recopilar información operativa:

#### 2.1 Despliegue
- Buscar `Dockerfile`, `docker-compose.*`, `.dockerignore`.
- Buscar pipelines CI/CD: `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `Jenkinsfile`, `.circleci/`.
- Buscar scripts de deploy: `deploy/`, `scripts/`, `Makefile`.
- Leer los scripts de `package.json` (`build`, `start`, `dev`, `test`) para entender el ciclo de vida.
- Buscar configuración por entorno: `.env`, `.env.example`, `.env.production`, `.env.development`.
- Verificar si el `Dockerfile` es multi-stage y qué etapas tiene (build, runtime).
- Buscar health checks en el `docker-compose.yml` (test, interval, retries).
- Si hay base de datos: buscar migraciones (`Migrations/`, `Scripts/`, `flyway/`, `liquibase/`) y seeds.

#### 2.2 Monitoreo y observabilidad
- Buscar configuración de logging: logger custom (`src/utils/logger.ts`), Winston, Pino, logging stdlib.
- Leer la configuración completa de logging: niveles configurables (env var `LOG_LEVEL`, `--log-level`, etc.), destinos (consola, archivo), formato.
- Buscar health checks: endpoint `/health`, `/ready`, `HealthChecks`, `IHealthCheck`.
- Buscar métricas: Prometheus, Application Insights, Datadog, New Relic, OpenTelemetry.
- Buscar tracing distribuido: Jaeger, Zipkin, OpenTelemetry traces.
- Buscar alertas configuradas en pipelines o archivos de infra.

#### 2.3 Recuperación ante fallos
- Buscar retry policies: `axios-retry`, retry middleware, exponential backoff.
- Buscar circuit breakers.
- Buscar manejo de excepciones global: middleware de errores Express (`app.use((err, req, res, next) => ...)`), exception filters.
- Buscar configuración de timeouts en Axios (`timeout`), HttpClients e integraciones externas.
- Buscar lógica de renovación de tokens externos (token managers con expiración y refresh).
- Buscar backups: scripts, configuración de backup, snapshots.
- Buscar dead letter queues o mecanismos de reintento en mensajería.

#### 2.4 Configuración y secretos
- Listar todas las variables en `.env.example` (sin valores reales).
- Buscar uso de Secret Manager, variables de entorno del sistema operativo o del orquestador de contenedores.
- Buscar connection strings u otras credenciales (identificar nombre/clave, NO el valor).
- Buscar feature flags o toggles configurables por variable de entorno.

#### 2.5 Logs y auditoría
- Buscar patrones de logging en el código: qué se loguea, en qué nivel (Info, Warning, Error).
- Buscar audit trail: tablas de auditoría, eventos de cambio, middleware de auditoría.
- Buscar correlation IDs o request IDs en logging.
- Buscar log de acceso o autenticación.

### Paso 3 — Redactar cada sección

#### Reglas de redacción
- **Tono**: Operativo, directo, orientado a acción. Cada sección debe responder "¿qué hago cuando...?"
- **Idioma**: Español. Comandos y rutas técnicas en su formato original.
- **Formato de comandos**: Usar bloques de código con el shell correspondiente (`bash`, `powershell`, `cmd`).
- **Marcar supuestos**: Usar *[inferido — confirmar con el equipo]* para lo que no está explícito.
- **No incluir secretos**: Documentar QUÉ secretos se necesitan y DÓNDE configurarlos, nunca los valores.

#### 3.1 — Requisitos Previos

Lista de todo lo necesario antes de operar el sistema:

| Requisito | Versión mínima | Propósito |
|-----------|---------------|-----------|
| {runtime} | {versión} | {para qué} |
| {herramienta} | {versión} | {para qué} |

Variables de entorno / configuraciones requeridas:

| Variable / Clave | Descripción | Dónde configurar | Ejemplo de formato |
|-------------------|-------------|------------------|--------------------|
| {nombre} | {para qué} | {archivo .env / variable de entorno del sistema} | {formato sin valor real} |

#### 3.2 — Despliegue

Para cada entorno detectado (Development, Staging, Production):

**Paso a paso numerado** del proceso de deploy:
1. Prerrequisitos del deploy.
2. Comandos exactos (build, publish, migrate, deploy).
3. Verificación post-deploy (health check, smoke test).
4. Rollback: cómo volver a la versión anterior.

Si hay CI/CD, documentar:
- Trigger del pipeline (push, tag, manual).
- Etapas y qué hace cada una.
- Aprobaciones requeridas (si hay gates).
- Dónde ver el estado del pipeline.

Si hay migraciones de BD:
- Cómo ejecutar migraciones.
- Cómo revertir una migración.
- Orden de ejecución (primero BD, luego app, o viceversa).

Para proyectos Node.js/Docker, documentar también:
- Comandos `npm run build` y `npm start`.
- Comandos `docker compose up --build -d`, `docker compose logs -f`, `docker compose restart`.
- Cómo pasar/actualizar variables de entorno sin rebuild.

#### 3.3 — Monitoreo

| Qué se monitorea | Herramienta | Dónde ver | Umbral de alerta |
|-------------------|-------------|-----------|-------------------|
| {métrica/log} | {herramienta} | {URL/dashboard} | {cuándo alertar} |

Health checks disponibles:

| Endpoint | Qué verifica | Respuesta esperada |
|----------|-------------|-------------------|
| {ruta} | {qué chequea} | {200 OK / formato} |

Logging:
- Niveles configurados por entorno.
- Destino de los logs (consola, archivo, servicio externo).
- Cómo buscar logs de un request específico (correlation ID, filtros).
- Retención de logs.

#### 3.4 — Recuperación ante Fallos

Para cada escenario de fallo documentar con este formato:

**Escenario: {Descripción del fallo}**

| Campo | Detalle |
|-------|---------|
| **Síntomas** | {Qué se observa} |
| **Causa probable** | {Por qué pasa} |
| **Diagnóstico** | {Cómo confirmar la causa} |
| **Resolución** | {Pasos para resolver} |
| **Prevención** | {Cómo evitar que vuelva a pasar} |

Escenarios mínimos a cubrir:
- Si hay base de datos: base de datos no disponible.
- Servicio externo / integración caída (API externa devuelve 5xx o timeout).
- Error de autenticación / token expirado (tanto el `x-api-key` propio como tokens de APIs externas).
- Container Docker no levanta o se cae en loop.
- Despliegue fallido (rollback).
- Disco / memoria llena (si aplica).
- Certificado expirado (si aplica).

#### 3.5 — Procedimientos de Soporte

Información para el equipo de soporte:

- **Escalamiento**: A quién contactar según el tipo de incidente (L1 → L2 → L3).
- **Acceso a entornos**: Cómo acceder a cada entorno (sin credenciales, solo el mecanismo).
- **Reinicio del servicio**: Comando o procedimiento para reiniciar.
- **Verificación de estado**: Cómo confirmar que el sistema está operativo.
- **Datos de prueba**: Cómo generar o restaurar datos de prueba (si aplica).

#### 3.6 — Logs y Auditoría

| Tipo de log | Qué registra | Nivel | Retención |
|-------------|-------------|-------|-----------|
| Aplicación | {eventos de negocio, errores} | {Info/Warn/Error} | {días/meses} |
| Acceso | {requests, autenticación} | {Info} | {días/meses} |
| Auditoría | {cambios de datos, acciones de usuario} | {Info} | {días/meses} |

Formato de log:
```
{ejemplo del formato de una línea de log típica}
```

Campos relevantes para filtrar:
- `{campo1}` — {para qué sirve en diagnóstico}
- `{campo2}` — {para qué sirve en diagnóstico}

Usá la plantilla de referencia: [template](./references/template.md)

### Paso 4 — Guardar el documento

Guardar en `docs/documento-operacion.md` en la raíz del proyecto.

Si la carpeta `docs/` no existe, crearla.

### Paso 5 — Revisar con el usuario

1. Mostrar resumen: qué secciones se pudieron completar con evidencia vs. cuáles quedaron *[inferido]*.
2. Preguntar específicamente por:
   - Entornos reales (URLs, nombres de servidores — sin credenciales).
   - Política de retención de logs.
   - Cadena de escalamiento de soporte.
   - Procedimientos de backup que no estén en el código.
3. Aplicar correcciones.

## Criterios de Calidad

- Cada procedimiento de deploy tiene pasos numerados con comandos ejecutables (no descripciones vagas).
- La sección de rollback existe y es concreta (no solo "revertir el deploy").
- Cada escenario de fallo tiene síntomas, diagnóstico y resolución como pasos accionables.
- Los comandos están en bloques de código con el shell correcto.
- No hay secretos, passwords, tokens, ni connection strings con valores reales en el documento.
- Las variables de entorno listan formato esperado pero no valores de producción.
- La sección de monitoreo especifica DÓNDE ver cada cosa (no solo "se monitorea con X").
- El documento es usable a las 3am por alguien de guardia que no conoce el proyecto en detalle.
