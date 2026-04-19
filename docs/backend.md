# Arquitectura backend

## Stack

- Express
- Supabase client
- PostgreSQL en Supabase

El backend principal vive en `api/index.ts`.

## Responsabilidades

- exponer endpoints REST para lectura y escritura
- guardar capturas mensuales
- calcular el resultado del KPI
- asignar el semaforo
- crear nuevos KPIs con su configuracion

## Endpoints principales

### `GET /api/kpis`

Devuelve la lista de KPIs para un mes y anio.

Incluye:

- area
- nombre
- formula
- valor
- semaforo
- estado de borrado

### `GET /api/kpi-config/:kpi_id`

Entrega la configuracion necesaria para renderizar el formulario de captura.

### `GET /api/kpi-historico/:kpi_id`

Entrega historico anual del KPI con comentarios y semaforo.

### `GET /api/areas`

Devuelve las areas activas para el selector del creador.

### `POST /api/capturas`

Guarda la captura mensual y calcula el resultado final.

### `POST /api/kpis/create`

Crea el KPI, su configuracion y su metadata operativa.

## Persistencia por tipo de captura

El sistema guarda la captura en tablas especializadas:

- `captura_binaria_documental`
- `captura_conteo`
- `captura_conteo_operativo`
- `captura_entregas`
- `captura_formula_personalizada`

Esto permite recalcular reglas sin perder el dato original.

## Formula personalizada

### Validacion

El backend usa `src/lib/customFormula.ts` para:

- normalizar claves
- validar la configuracion
- evaluar la expresion matematica

### Al crear un KPI

`POST /api/kpis/create`:

- valida `formula_personalizada`
- guarda `formula_tipo = formula_personalizada`
- guarda `tipo_captura = formula_personalizada`
- persiste la expresion y variables en `config_json.custom_formula`

### Al capturar

`POST /api/capturas`:

- guarda los valores en `captura_formula_personalizada`
- vuelve a cargar `config_json.custom_formula`
- evalua la expresion con los valores capturados
- genera `valor_resultado`
- aplica semaforo

## Migracion necesaria

Si la base ya existia antes de formula personalizada, debes ejecutar:

- `docs/custom-formula-migration.sql`

La migracion:

- actualiza `kpis_formula_tipo_check`
- actualiza `kpis_tipo_captura_check`
- crea `captura_formula_personalizada`
- crea indice y trigger asociados

## Semaforo

La evaluacion es:

- verde: `valor_resultado >= semaforo_verde_min`
- amarillo: `valor_resultado >= semaforo_amarillo_min`
- rojo: cualquier valor menor

## Archivos clave para mantenimiento

- `api/index.ts`
- `src/lib/customFormula.ts`
- `bd.sql`
- `docs/custom-formula-migration.sql`

## Verificacion recomendada

Cuando cambies reglas del backend:

1. prueba crear un KPI de cada tipo
2. prueba capturar datos de cada tipo
3. valida un KPI de formula personalizada
4. revisa que no fallen las constraints de Supabase
