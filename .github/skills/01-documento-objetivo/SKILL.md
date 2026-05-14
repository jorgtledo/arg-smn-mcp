---
name: 01-documento-objetivo
description: "Genera un Documento Objetivo (visión general ejecutiva) de un proyecto de software. Use when: documentar proyecto, generar visión general, documento objetivo, resumen ejecutivo, project overview document."
argument-hint: "Nombre del proyecto o contexto adicional (opcional)"
---

# Documento Objetivo — Visión General del Proyecto

Genera un documento ejecutivo breve que describe el propósito, contexto de negocio, alcance y limitaciones de un proyecto de software. Está diseñado para ser entendible por cualquier perfil (técnico o no técnico).

## Cuándo Usar

- Al iniciar la documentación de un proyecto nuevo o existente.
- Cuando un stakeholder necesita entender rápidamente qué hace el sistema.
- Para onboarding de nuevos integrantes al equipo.
- Cuando se necesita un resumen ejecutivo actualizado.

## Procedimiento

### Paso 1 — Explorar el codebase

Usá un subagente de exploración para recopilar información del proyecto. Buscá en paralelo:

1. **Archivos de configuración y metadata**: `README.md`, `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `docker-compose.*`, archivos de CI/CD, `.env.example`.
2. **Estructura de carpetas**: Listar carpetas de primer y segundo nivel para inferir arquitectura y módulos.
3. **Entrypoints y rutas**: `index.ts`, `main.ts`, `app.ts`, `main.py`, `main.go`, o equivalente — archivos de rutas/endpoints, handlers.
4. **Entidades y modelos de dominio**: Carpetas `Entities/`, `Models/`, `Domain/`, schemas de base de datos.
5. **Instrucciones existentes**: `.github/instructions/`, `copilot-instructions.md`, memory files del repositorio.

### Paso 2 — Inferir las secciones del documento

Con la información recopilada, completá cada sección:

| Sección | Qué inferir | Fuentes clave |
|---------|-------------|---------------|
| Propósito general | Qué problema resuelve la aplicación | README, nombre del proyecto, entidades de dominio, endpoints |
| Público objetivo | Quiénes son los usuarios finales | README, UI/frontend (si existe), nombres de features |
| Contexto del negocio | Por qué existe, qué procesos soporta | README, entidades, flujos, instrucciones del proyecto |
| Alcance actual | Qué hace hoy (features implementadas) | Endpoints, features, carpetas de módulos |
| Lo que NO hace | Gaps explícitos o implícitos | Ausencia de módulos comunes (auth propia, reporting, etc.) |
| Limitaciones conocidas | Restricciones de alto nivel | TODOs, issues, configs limitadas, README |

### Paso 3 — Redactar el documento

Seguí estas reglas de redacción:

- **Tono**: Ejecutivo, claro, sin jerga técnica innecesaria.
- **Extensión**: Máximo 2 páginas (~600 palabras). Preferir bullet points sobre párrafos.
- **Idioma**: Español (salvo que el proyecto esté documentado en otro idioma).
- **Tiempo verbal**: Presente indicativo ("La aplicación permite...", "El sistema gestiona...").
- **Evitar**: Detalles de implementación (frameworks, bases de datos, patrones). Eso va en documentación técnica, no acá.
- **Marcar supuestos**: Si algo fue inferido y no está explícito en el código, indicarlo con *[inferido]*.

Usá la plantilla de referencia: [template](./references/template.md)

### Paso 4 — Guardar el documento

Guardar el documento generado en `docs/documento-objetivo.md` en la raíz del proyecto.

Si la carpeta `docs/` no existe, crearla.

### Paso 5 — Revisar con el usuario

Después de generar el documento:

1. Mostrá un resumen de lo que se detectó vs. lo que se tuvo que inferir.
2. Preguntá específicamente por las secciones marcadas con *[inferido]*.
3. Aplicá las correcciones indicadas por el usuario.

## Criterios de Calidad

- Cada sección tiene al menos 2-3 bullet points concretos.
- No hay terminología técnica sin explicar (si aparece, debe tener contexto).
- Las limitaciones son honestas, no genéricas ("tiene limitaciones de performance" NO vale).
- El documento se entiende sin conocimiento previo del proyecto.
