# Guía de Diagramas Mermaid para Documentación Funcional

## Tipos de diagrama a usar

### 1. Flowchart — Flujos de caso de uso

Usar para representar el flujo principal y alternativo de cada caso de uso.

```mermaid
flowchart TD
    A["Usuario realiza acción"] --> B{"¿Datos válidos?"}
    B -->|Sí| C["Sistema procesa solicitud"]
    B -->|No| D["Mostrar error de validación"]
    C --> E{"¿Regla de negocio se cumple?"}
    E -->|Sí| F["Retornar resultado exitoso"]
    E -->|No| G["Retornar error de negocio"]
    D --> A
```

**Convenciones:**
- Rectángulos `["..."]` para acciones.
- Rombos `{"..."}` para decisiones.
- Flechas con etiqueta `-->|Texto|` para condiciones.
- Dirección `TD` (top-down) para flujos lineales.
- Dirección `LR` (left-right) si hay muchas ramas paralelas.

### 2. Sequence Diagram — Integraciones

Usar para representar la comunicación entre el sistema y servicios externos.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Sistema
    participant BD as Base de Datos
    participant EXT as Servicio Externo
    
    U->>S: Solicita información
    S->>BD: Consulta datos
    BD-->>S: Datos encontrados
    S->>EXT: Enriquece con datos externos
    EXT-->>S: Datos adicionales
    S-->>U: Respuesta completa
```

**Convenciones:**
- `participant` con alias corto (`U`, `S`, `BD`).
- `->>` para llamadas (línea sólida).
- `-->>` para respuestas (línea punteada).
- Usar `Note over` para aclaraciones.
- Usar `alt`/`else` para flujos condicionales.

### 3. Flujos condicionales en secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Sistema
    
    U->>S: Solicita recurso
    alt Recurso existe
        S-->>U: 200 OK + datos
    else No existe
        S-->>U: 404 No encontrado
    end
```

## Reglas generales

1. **Simplicidad**: Máximo 10-12 nodos por diagrama. Si es más complejo, dividir en sub-diagramas.
2. **Texto en español**: Los labels deben estar en español y en lenguaje funcional.
3. **Sin terminología técnica**: Decir "Consulta eventos" no "SELECT * FROM eventos". Decir "Verifica permisos" no "Claims validation".
4. **Escapar caracteres**: Usar `["texto"]` en lugar de `[texto]` cuando el texto contiene paréntesis o caracteres especiales.
5. **Validar sintaxis**: El diagrama debe renderizar correctamente en GitHub y VS Code.
