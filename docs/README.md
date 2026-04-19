# Centro de documentacion

Este directorio concentra la documentacion tecnica y operativa del sistema KPI.

## Archivos disponibles

### `frontend.md`
Explica la arquitectura del frontend, el flujo de filtros, modales, captura dinamica y la experiencia de creacion de KPIs.

### `backend.md`
Describe los endpoints principales, el flujo de guardado, el calculo automatico y la persistencia por tipo de captura.

### `formulas_kpis.md`
Resume cada tipo de formula soportada, como se calcula y como impacta el semaforo.

### `manual_usuario.md`
Guia paso a paso para usuarios finales: navegar, capturar, crear KPIs y entender resultados.

### `custom-formula-migration.sql`
Migracion necesaria para bases existentes que quieran habilitar la formula personalizada.

## Orden recomendado de lectura

1. `../README.md`
2. `manual_usuario.md`
3. `formulas_kpis.md`
4. `frontend.md`
5. `backend.md`

## Cambio reciente importante

Se agrego soporte para `formula_personalizada`.

Esto implica:

- nuevo flujo en el creador de KPIs
- tutorial visual para orientar al usuario
- validacion de expresiones matematicas
- nueva tabla `captura_formula_personalizada`
- actualizacion de constraints en Supabase

Si el proyecto ya estaba desplegado antes de este cambio, ejecuta `custom-formula-migration.sql` antes de usar la nueva funcionalidad.
