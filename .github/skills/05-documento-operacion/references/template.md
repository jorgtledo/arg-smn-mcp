# Documento de Operación — {Nombre del Proyecto}

> Última actualización: {fecha}

---

## Tabla de Contenidos

- [1. Requisitos Previos](#1-requisitos-previos)
- [2. Despliegue](#2-despliegue)
- [3. Monitoreo](#3-monitoreo)
- [4. Recuperación ante Fallos](#4-recuperación-ante-fallos)
- [5. Procedimientos de Soporte](#5-procedimientos-de-soporte)
- [6. Logs y Auditoría](#6-logs-y-auditoría)

---

## 1. Requisitos Previos

### Software requerido

| Requisito | Versión mínima | Propósito |
|-----------|---------------|-----------|
| {runtime} | {versión} | {para qué} |
| {herramienta} | {versión} | {para qué} |

### Configuración requerida

| Variable / Clave | Descripción | Dónde configurar | Ejemplo de formato |
|-------------------|-------------|------------------|--------------------|
| {nombre} | {para qué} | {archivo .env / variable de entorno del sistema} | `{formato sin valor real}` |

---

## 2. Despliegue

### 2.1 Entorno: {Development / Staging / Production}

#### Build y despliegue

```bash
# Paso 1: Build / compilar
{comando de build, ej: npm run build / docker build}

# Paso 2: Iniciar / desplegar
{comando de inicio, ej: npm start / docker compose up -d}

# Paso 3: Migración de BD (si aplica)
{comando de migración}
```

> Si se usa Docker Compose:
> ```bash
> docker compose up --build -d
> docker compose logs -f
> ```

#### Verificación post-deploy

```bash
# Health check
curl http://localhost:{PORT}/health
```

Resultado esperado: `{respuesta esperada, ej: {"status":"ok"}}`

#### Rollback

```bash
# Revertir a versión anterior
{comando o procedimiento de rollback, ej: docker compose down && git checkout v{anterior} && docker compose up --build -d}
```

### 2.2 CI/CD Pipeline

| Etapa | Qué hace | Trigger | Aprobación |
|-------|----------|---------|------------|
| {Build} | {descripción} | {push / tag / manual} | {auto / manual} |
| {Test} | {descripción} | {automático} | {auto} |
| {Deploy} | {descripción} | {post-test} | {manual / auto} |

### 2.3 Migraciones de Base de Datos *(si aplica)*

| Paso | Comando | Notas |
|------|---------|-------|
| Ejecutar migración | `{comando}` | {ejecutar antes/después del deploy} |
| Revertir migración | `{comando}` | {último recurso, verificar impacto} |

---

## 3. Monitoreo

### Dashboard y métricas

| Qué se monitorea | Herramienta | Dónde ver | Umbral de alerta |
|-------------------|-------------|-----------|-------------------|
| {métrica} | {herramienta} | {URL/dashboard} | {cuándo alertar} |

### Health Checks

| Endpoint | Qué verifica | Respuesta esperada |
|----------|-------------|-------------------|
| {ruta} | {qué chequea} | `{200 OK / formato}` |

### Logging

| Entorno | Nivel mínimo | Destino | Retención |
|---------|-------------|---------|-----------|
| Development | {Debug/Info} | {consola/archivo} | {N/A} |
| Production | {Warning/Info} | {servicio/archivo} | {días} |

**Cómo buscar logs de un request específico:**
```
{comando o instrucción para filtrar por correlation ID u otro campo}
```

---

## 4. Recuperación ante Fallos

### FALLO-001: Servicio externo / integración caída

| Campo | Detalle |
|-------|---------|
| **Síntomas** | {qué se observa} |
| **Causa probable** | {servicio externo no responde} |
| **Diagnóstico** | {cómo confirmar} |
| **Resolución** | {pasos para resolver} |
| **Prevención** | {retry, circuit breaker, fallback} |

### FALLO-002: Error de autenticación / token expirado

| Campo | Detalle |
|-------|---------|
| **Síntomas** | {401 Unauthorized, acceso denegado} |
| **Causa probable** | {API key inválida, token externo expirado, config faltante} |
| **Diagnóstico** | {cómo confirmar: revisar logs, probar con curl} |
| **Resolución** | {pasos para resolver} |
| **Prevención** | {renovación automática de tokens, validar API key en .env} |

### FALLO-003: Container Docker no levanta / reinicio en loop

| Campo | Detalle |
|-------|---------|
| **Síntomas** | {container en estado `Restarting`, health check falla} |
| **Causa probable** | {variable de entorno faltante, puerto ocupado, crash en startup} |
| **Diagnóstico** | `docker compose logs -f` — ver el error de inicio |
| **Resolución** | {verificar .env, liberar puerto, corregir config} |
| **Prevención** | {smoke test post-deploy, health check con start_period} |

### FALLO-004: Despliegue fallido

| Campo | Detalle |
|-------|---------|
| **Síntomas** | {app no inicia, errores post-deploy} |
| **Causa probable** | {migración fallida, config faltante, incompatibilidad} |
| **Diagnóstico** | {cómo confirmar} |
| **Resolución** | {rollback — ver sección 2} |
| **Prevención** | {deploy canary, smoke tests} |

---

## 5. Procedimientos de Soporte

### Escalamiento

| Nivel | Responsable | Cuándo escalar | Contacto |
|-------|-------------|----------------|----------|
| L1 | {rol} | {criterio} | {medio de contacto} |
| L2 | {rol} | {criterio} | {medio de contacto} |
| L3 | {rol} | {criterio} | {medio de contacto} |

### Acceso a entornos

| Entorno | Mecanismo de acceso | Requisitos |
|---------|--------------------|-----------| 
| {Development} | {VPN + RDP / SSH / Portal} | {permisos necesarios} |
| {Production} | {mecanismo} | {permisos necesarios} |

### Reinicio del servicio

```bash
# Docker Compose
docker compose restart {nombre-servicio}

# O para forzar rebuild:
docker compose down && docker compose up --build -d
```

### Verificación de estado

```bash
# Verificar que el sistema responde
curl http://localhost:{PORT}/health
```

Resultado esperado: `{respuesta OK}`

---

## 6. Logs y Auditoría

### Tipos de log

| Tipo | Qué registra | Nivel | Retención |
|------|-------------|-------|-----------|
| Aplicación | {eventos de negocio, errores} | {Info/Warn/Error} | {días/meses} |
| Acceso | {requests HTTP, autenticación} | {Info} | {días/meses} |
| Auditoría | {cambios de datos, acciones de usuario} | {Info} | {días/meses} |

### Formato de log

```
{ejemplo de una línea de log típica del sistema}
```

### Campos clave para diagnóstico

| Campo | Para qué sirve |
|-------|----------------|
| `{Timestamp}` | {cuándo ocurrió} |
| `{Level}` | {severidad} |
| `{CorrelationId}` | {rastrear un request completo} |
| `{Message}` | {qué pasó} |
| `{Exception}` | {detalle del error} |

---

*Documento generado automáticamente. Las secciones marcadas con [inferido] requieren validación del equipo de operaciones. Este documento NO contiene credenciales ni secretos.*
