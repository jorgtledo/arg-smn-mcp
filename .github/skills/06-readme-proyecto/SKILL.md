---
name: 06-readme-proyecto
description: "Genera un README.md profesional que documenta el propósito, arquitectura, uso y capacidades de documentación del proyecto. Use when: generar readme, documentar proyecto, readme profesional, project readme, getting started, cómo ejecutar, cómo contribuir."
argument-hint: "Nombre del proyecto o contexto adicional (opcional)"
---

# README del Proyecto

Genera un `README.md` profesional y completo que documenta el propósito, stack tecnológico, estructura, instrucciones de uso, y el sistema de documentación automatizada disponible en el repositorio.

## Cuándo Usar

- Al iniciar un proyecto que necesita un README real (no el template de GitLab/GitHub).
- Cuando el README existente es un placeholder o está desactualizado.
- Para reemplazar un README genérico con uno que refleje el proyecto actual.
- Cuando se quiere documentar qué documentación puede generarse automáticamente.

## Procedimiento

### Paso 1 — Explorar el codebase

Usá un subagente de exploración (thoroughness: **thorough**) para recopilar:

1. **Metadata del proyecto**: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod` — nombre, versión, autor, framework, scripts.
2. **Configuración**: `.env.example`, `docker-compose.*`, archivos CI/CD.
3. **Estructura de carpetas**: Primer y segundo nivel para describir organización.
4. **Entrypoint y funcionalidad principal**: `src/index.ts`, `main.ts`, `app.ts` o equivalente — extraer rutas HTTP, tools MCP, o endpoints expuestos.
5. **Instrucciones existentes**: `.github/instructions/`, memory files del repo — para contexto de arquitectura y convenciones.
6. **Skills de documentación disponibles**: `.github/skills/*/SKILL.md` — leer `name` y `description` de cada uno.
7. **Documentación existente**: `docs/` — listar documentos ya generados.
8. **Scripts de BD o migraciones**: `Scripts/`, `migrations/`, `prisma/schema.prisma` — si existen.
9. **Puertos y URLs**: `docker-compose.yml` (ports), `.env.example` (PORT).

### Paso 2 — Componer las secciones del README

El README debe incluir las siguientes secciones en este orden:

| Sección | Contenido |
|---------|-----------|
| Título y badge | Nombre del proyecto + badge del framework/versión |
| Descripción | 2-3 oraciones que explican qué hace y para quién |
| Tabla de contenidos | Links a cada sección (si el README supera 100 líneas) |
| Stack tecnológico | Lista con iconos/badges de las tecnologías principales |
| Arquitectura | Patrón arquitectónico, organización del código (breve) |
| Requisitos previos | Runtime, DB (si aplica), herramientas necesarias |
| Instalación y ejecución | Paso a paso: clonar, instalar dependencias (`npm install` / `pip install` / etc.), configurar, ejecutar |
| Endpoints / API / Tools | Tabla con los endpoints REST, herramientas MCP, o funciones principales disponibles |
| Estructura del proyecto | Árbol simplificado con explicación de carpetas clave |
| Scripts de BD / Migraciones | Si existen, cómo ejecutarlos |
| Documentación generada | Lista de documentos en `docs/` con descripción |
| Generación de documentación | Tabla con skills disponibles y cómo invocarlos |
| Configuración | Variables de entorno / connection strings relevantes (sin secretos) |
| Contribución | Convenciones de código, estructura de features, naming |
| Licencia | Si aplica |

### Paso 3 — Reglas de redacción

- **Idioma**: Español (salvo que el proyecto esté documentado en inglés).
- **Tono**: Técnico pero accesible. Un nuevo desarrollador debe poder levantar el proyecto solo con el README.
- **Formato**: Markdown estándar compatible con GitHub/GitLab.
- **Secretos**: NUNCA incluir connection strings reales, tokens, passwords, o URLs internas en el README. Usar placeholders como `<TU_CONNECTION_STRING>`.
- **Badges**: Usar badges de shields.io cuando sea relevante (framework version, build status).
- **Código**: Bloques de código con lenguaje especificado (```bash, ```typescript, etc.).
- **Links**: Referenciar documentos en `docs/` con paths relativos.

### Paso 4 — Sección especial: Documentación Automatizada

Esta sección es clave. Debe documentar:

1. **Documentos ya generados** (en `docs/`): tabla con nombre de archivo, título del documento, y descripción breve.
2. **Skills de generación disponibles**: tabla con:
   - Nombre del skill (como comando `/`)
   - Qué genera
   - Cuándo usarlo
   - Ejemplo de invocación

Formato sugerido para la tabla de skills:

```markdown
| Skill | Genera | Cuándo usar |
|-------|--------|-------------|
| `/01-documento-objetivo` | Visión general ejecutiva | Onboarding, resumen para stakeholders |
| `/02-documento-funcional` | Especificación funcional completa | Documentar casos de uso, flujos, reglas |
| ... | ... | ... |
```

### Paso 5 — Guardar el README

Guardar el archivo generado en `README.md` en la **raíz del proyecto** (reemplazando el existente si es un placeholder/template).

### Paso 6 — Validar con el usuario

Después de generar:

1. Confirmar que la información técnica es correcta (puertos, comandos, versiones).
2. Preguntar si hay secciones adicionales que necesiten (deploy, CI/CD, etc.).
3. Preguntar si el README del subdirectorio `src/` también debe actualizarse.

## Criterios de Calidad

- Un desarrollador nuevo puede clonar y ejecutar el proyecto siguiendo solo el README.
- Los endpoints REST están documentados con verbo HTTP y ruta; las herramientas MCP con nombre y parámetros.
- La sección de documentación lista todos los skills disponibles.
- No hay secretos, URLs internas, ni datos sensibles.
- Los paths son correctos y los links relativos funcionan.
- El README no excede ~300 líneas (ser conciso, no exhaustivo).
