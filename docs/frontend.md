# Arquitectura frontend

## Stack

- React
- TypeScript
- CSS plano en `src/index.css`
- componentes modales para creacion, captura y detalle

## Pantallas y componentes principales

### `src/App.tsx`

Responsable de:

- cargar KPIs segun mes y anio
- aplicar filtros por area y busqueda
- abrir modales de captura, detalle y creacion
- mantener el periodo actual por defecto de forma automatica

### `src/components/CreateKpiModal.tsx`

Responsable de:

- alta guiada de KPIs en 4 pasos
- seleccion del tipo de formula
- configuracion del semaforo
- soporte para formula personalizada
- tutorial visual para explicar formula personalizada

Cambios recientes relevantes:

- inputs numericos editables sin forzar `0`
- textos corregidos por problemas de encoding
- flujo mas intuitivo para formula personalizada
- plantillas de calculo para formula personalizada
- tutorial completo dentro del paso de formula

### `src/components/CaptureModal.tsx`

Responsable de:

- renderizar el formulario correcto segun `tipo_captura`
- mostrar guias y ayudas de captura
- capturar:
  - binario documental
  - conteo
  - conteo operativo
  - fechas
  - formula personalizada

Cambios recientes relevantes:

- `documental_doble` ahora muestra mejor el progreso 0 / 50 / 100
- soporte dinamico para variables de formula personalizada

### `src/components/KpiDetailModal.tsx`

Responsable de:

- mostrar historico
- mostrar comparativos por mes
- apoyar el analisis del resultado de cada KPI

## Flujo de creacion de KPI

1. Informacion basica
2. Formula
3. Semaforo
4. Confirmacion

### Formula personalizada en frontend

Cuando el usuario elige esta opcion:

- se muestra una guia visual explicando para que sirve
- se muestran pasos recomendados
- se permite definir datos a capturar
- se ofrece una plantilla de calculo
- se muestra una vista previa de la expresion
- se valida la expresion antes de permitir continuar

## Periodo actual por defecto

El frontend ya no depende de un anio fijo hardcodeado.

- toma el mes actual del sistema
- toma el anio actual del sistema
- si cambia el calendario, el periodo por defecto se ajusta automaticamente

## Estilos

Los estilos viven principalmente en `src/index.css`.

Se agregaron bloques visuales especificos para:

- tutorial de formula personalizada
- tarjetas de seleccion de formula
- resumen de confirmacion
- bloques de semaforo

## Verificacion recomendada

Despues de cambios en el frontend:

```bash
npx tsc -b
```

Y despues validar manualmente:

- creacion de un KPI normal
- creacion de un KPI con formula personalizada
- captura de cada tipo de KPI
- visualizacion del historico
