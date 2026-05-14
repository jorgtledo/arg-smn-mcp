---
name: 04-sugerencias-mejoras
description: "Genera un Documento de Recomendaciones Técnicas y sugerencias de mejora de un proyecto de software. Use when: mejoras de performance, refactorizaciones, riesgos técnicos, deuda técnica, roadmap, tech debt, recomendaciones, sugerencias, improvements, technical recommendations."
argument-hint: "Nombre del proyecto o área específica a analizar (opcional)"
---

# Sugerencias de Mejoras — Recomendaciones Técnicas

Genera un documento de recomendaciones técnicas que identifica oportunidades de mejora, deuda técnica, riesgos y propone un roadmap priorizado. Se basa en el análisis estático del codebase, no en métricas de runtime.

## Cuándo Usar

- Después de generar los documentos objetivo, funcional y tecnológico (se alimenta de ese contexto).
- Para hacer un health check técnico del proyecto.
- Cuando se planifica un sprint de mejora técnica o reducción de deuda.
- Para onboarding técnico: que el nuevo dev sepa dónde están los puntos débiles.
- Antes de una migración, upgrade de framework, o cambio arquitectónico.

## Procedimiento

### Paso 1 — Recopilar contexto previo

Antes de explorar, verificar si ya existen documentos generados:

1. Leer `docs/documento-tecnologico.md` si existe — extraer la sección de **Limitaciones Técnicas** como punto de partida.
2. Leer `docs/documento-funcional.md` si existe — extraer integraciones y complejidad funcional.
3. Leer `docs/documento-objetivo.md` si existe — extraer alcance y limitaciones de negocio.

Si no existen, proceder igualmente con la exploración directa del codebase.

### Paso 2 — Exploración analítica del codebase

Usá un subagente de exploración (thoroughness: **thorough**) para analizar el codebase buscando problemas y oportunidades. Cubrir estas áreas:

#### 2.1 Performance
- Si hay base de datos: buscar queries N+1 (múltiples llamadas a BD en loops), ausencia de paginación, `SELECT *`, ausencia de índices.
- Buscar llamadas HTTP externas secuenciales que podrían ejecutarse en paralelo (`Promise.all` / `Task.WhenAll`).
- Buscar operaciones sincrónicas que deberían ser async/await.
- Buscar ausencia de caching donde beneficiaría (tokens de autenticación, datos estáticos frecuentes, respuestas costosas).
- Buscar timeouts no configurados en clientes HTTP (Axios, HttpClient) — riesgo de cuelgue indefinido.
- Buscar ausencia de paginación en endpoints/tools que podrían devolver grandes volúmenes de datos.

#### 2.2 Refactorizaciones
- Buscar código duplicado: lógica repetida entre features/handlers/controllers.
- Buscar métodos o clases excesivamente largos (>100 líneas).
- Buscar violaciones de principios SOLID (clases con múltiples responsabilidades, dependencias concretas en vez de abstracciones).
- Buscar magic numbers o strings hardcodeados que deberían ser constantes o configuraciones.
- Buscar patrones inconsistentes (features que no siguen la convención del resto).
- Buscar código comentado o dead code.
- Buscar nombres poco descriptivos en entidades, métodos o variables clave.

#### 2.3 Riesgos técnicos
- Buscar dependencias desactualizadas o con vulnerabilidades conocidas (verificar versiones en `package.json` u otro archivo de dependencias del lenguaje).
- Buscar dependencias deprecated o en modo mantenimiento.
- Buscar ausencia de validación de input en endpoints/tools públicos.
- Si hay SQL: buscar SQL injection potencial (queries concatenadas en vez de parametrizadas).
- Buscar ausencia de rate limiting o throttling en endpoints expuestos.
- Buscar secretos, API keys o tokens expuestos en el código fuente o configs versionadas.
- Buscar single points of failure en integraciones con APIs externas (sin retry, sin timeout, sin circuit breaker).
- Buscar claves de autenticación generadas con baja entropía o hardcodeadas en el código.
- Buscar ausencia de manejo de expiración de tokens en integraciones que requieren auth (JWT, OAuth).

#### 2.4 Deuda técnica
- Buscar `TODO`, `HACK`, `FIXME`, `WORKAROUND`, `TEMP` en el código.
- Buscar ausencia de pruebas (unitarias, integración, E2E).
- Buscar ausencia de logging en flujos críticos (herramientas sin `logRequest`/`logError`, servicios sin trazabilidad).
- Buscar ausencia de manejo de errores consistente (try/catch faltantes, errores silenciados).
- Buscar ausencia de documentación en API (descripciones de herramientas MCP, OpenAPI, XML comments).
- Buscar configuraciones hardcodeadas que deberían estar en variables de entorno.
- Si hay base de datos: buscar migraciones o scripts pendientes sin aplicar.

#### 2.5 Escalabilidad y mantenibilidad
- Evaluar si la arquitectura actual soporta crecimiento (nuevas features, más carga).
- Buscar acoplamiento fuerte entre módulos/features.
- Buscar ausencia de health checks.
- Buscar ausencia de versionado de API.
- Evaluar facilidad de despliegue (CI/CD, contenedores).

### Paso 3 — Clasificar y priorizar hallazgos

Para cada hallazgo, asignar:

| Campo | Valores |
|-------|---------|
| **Categoría** | Performance / Refactorización / Riesgo técnico / Deuda técnica / Escalabilidad |
| **Severidad** | 🔴 Alta / 🟡 Media / 🟢 Baja |
| **Esfuerzo estimado** | S (horas) / M (días) / L (semanas) / XL (sprint+) |
| **Impacto** | Descripción concreta de qué mejora |

**Criterios de severidad:**
- 🔴 **Alta**: Riesgo de seguridad, pérdida de datos, o bloqueo de funcionalidad.
- 🟡 **Media**: Degrada performance, dificulta mantenimiento, o genera deuda acumulativa.
- 🟢 **Baja**: Mejora nice-to-have, cleanup, o mejora de developer experience.

### Paso 4 — Redactar el documento

#### Reglas de redacción
- **Tono**: Técnico pero constructivo. Identificar problemas sin ser peyorativo con el código existente.
- **Idioma**: Español. Nombres de tecnologías y patrones en su idioma original.
- **Evidencia**: Cada recomendación debe citar el archivo/línea o patrón específico donde se detectó. No hacer recomendaciones genéricas sin evidencia.
- **Accionable**: Cada recomendación debe incluir una sugerencia concreta de qué hacer, no solo qué está mal.
- **Marcar supuestos**: Usar *[inferido]* cuando la recomendación se basa en suposiciones sobre el uso real del sistema.

#### Secciones del documento

**4.1 — Resumen Ejecutivo**

Un párrafo de 3-5 oraciones con el estado general del proyecto y las áreas más críticas. Incluir conteo de hallazgos por severidad.

**4.2 — Mejoras de Performance**

Para cada hallazgo:
- **Problema**: Qué se detectó y dónde.
- **Impacto**: Cómo afecta al usuario o al sistema.
- **Recomendación**: Qué hacer concretamente.
- **Ejemplo**: Snippet de código sugerido o pseudocódigo (si aplica).

**4.3 — Refactorizaciones Sugeridas**

Para cada refactorización:
- **Código actual**: Qué patrón o estructura hay hoy.
- **Problema**: Por qué es mejorable.
- **Propuesta**: Cómo debería quedar.
- **Archivos afectados**: Lista de archivos que cambiarían.

**4.4 — Riesgos Técnicos**

Para cada riesgo:
- **Descripción**: Qué riesgo existe.
- **Probabilidad**: Alta / Media / Baja.
- **Impacto si ocurre**: Qué pasa si no se mitiga.
- **Mitigación**: Acción recomendada.

**4.5 — Deuda Técnica**

Para cada item de deuda:
- **Qué**: Descripción del item.
- **Dónde**: Archivo(s) o área del código.
- **Esfuerzo**: S / M / L / XL.
- **Prioridad**: Alta / Media / Baja (basada en severidad × frecuencia de impacto).

**4.6 — Roadmap Sugerido**

Organizar las recomendaciones en fases priorizadas:

| Fase | Foco | Items | Esfuerzo total estimado |
|------|------|-------|------------------------|
| 1 — Quick wins | Severidad alta + esfuerzo S/M | ... | ... |
| 2 — Estabilización | Riesgos técnicos + deuda crítica | ... | ... |
| 3 — Mejora continua | Refactorizaciones + performance | ... | ... |
| 4 — Evolución | Escalabilidad + nuevas capacidades | ... | ... |

Cada fase debe poder ejecutarse independientemente. No crear dependencias circulares entre fases.

Usá la plantilla de referencia: [template](./references/template.md)

### Paso 5 — Guardar el documento

Guardar en `docs/sugerencias-mejoras.md` en la raíz del proyecto.

Si la carpeta `docs/` no existe, crearla.

### Paso 6 — Revisar con el usuario

1. Mostrar resumen: total de hallazgos por categoría y severidad.
2. Preguntar si hay contexto que el código no refleja (ej: "ese endpoint se usa 1 vez al mes, no necesita optimización").
3. Preguntar prioridades del equipo para ajustar el roadmap.
4. Aplicar correcciones.

## Criterios de Calidad

- Cada recomendación cita al menos un archivo o patrón concreto como evidencia.
- No hay recomendaciones genéricas tipo "mejorar performance" sin especificar dónde y cómo.
- Las severidades son consistentes (no marcar todo como Alta).
- El roadmap tiene 3-4 fases máximo y los quick wins van primero.
- Los riesgos de seguridad (secretos expuestos, SQL injection, tokens sin rotación) siempre son severidad Alta.
- Las estimaciones de esfuerzo son razonables (no subestimar refactorizaciones grandes).
- El tono es constructivo: se presenta como oportunidades de mejora, no como crítica al código.
- No se recomienda reescribir todo ni cambiar la arquitectura completa salvo que haya evidencia fuerte.
