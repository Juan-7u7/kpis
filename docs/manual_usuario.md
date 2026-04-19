# Manual de usuario

## 1. Que hace el sistema

Este sistema permite:

- consultar KPIs por mes y anio
- filtrar por area y por texto
- capturar resultados mensuales
- crear KPIs nuevos desde la interfaz
- revisar el historico de cada KPI

## 2. Como leer el semaforo

Cada KPI usa tres rangos configurables:

- Verde: cumplimiento optimo
- Amarillo: alerta o cumplimiento parcial
- Rojo: riesgo o incumplimiento
- Gris: sin captura para ese periodo

Los umbrales se configuran al crear o editar la regla del KPI.

## 3. Navegacion principal

En la vista principal puedes:

- cambiar el mes y el anio del tablero
- buscar por nombre del KPI o por area
- abrir el detalle historico de un KPI
- abrir el modal de captura
- crear nuevos KPIs

Nota: el sistema abre por defecto en el mes y anio actuales.

## 4. Como capturar un KPI

Haz clic en el KPI y completa el formulario segun el tipo de captura.

### KPI tipo si/no

- marca la evidencia si se cumplio
- resultado:
  - marcado = 100%
  - no marcado = 0%

### KPI documental doble

- marca los 2 documentos requeridos
- resultado:
  - 2 de 2 = 100%
  - 1 de 2 = 50%
  - 0 de 2 = 0%

La pantalla de captura ya muestra el progreso y explica cuanto falta para llegar a 100%.

### KPI cumplidos / programados

- captura actividades programadas
- captura actividades cumplidas
- el sistema calcula `(cumplidos / programados) * 100`

### KPI correctos / total

- captura total de operaciones
- captura operaciones correctas
- el sistema calcula `(operaciones_correctas / total_operaciones) * 100`

### KPI entregas a tiempo

- agrega cada evento del mes
- registra fecha de solicitud y fecha de entrega
- el sistema calcula cuantos eventos estuvieron dentro del limite de dias configurado

### KPI de formula personalizada

El flujo tiene una guia integrada dentro del creador. En resumen:

1. defines los datos que se van a capturar
2. eliges una plantilla de calculo o escribes una formula libre
3. confirmas semaforo y guardas

Ejemplo:

- dato 1: tickets resueltos
- dato 2: tickets recibidos
- formula: `(tickets_resueltos / tickets_recibidos) * 100`

## 5. Como crear un KPI nuevo

El flujo de alta tiene 4 pasos:

1. Informacion
2. Formula
3. Semaforo
4. Confirmar

### Paso 1. Informacion

Captura:

- nombre del indicador
- area responsable
- evidencia requerida
- guia opcional para quien captura

### Paso 2. Formula

Elige una de estas opciones:

- Cumplimiento si / no
- Documental doble
- Cumplidos / programados
- Correctos / total operaciones
- Entregas en tiempo
- Formula personalizada

### Paso 3. Semaforo

Define:

- umbral verde
- umbral amarillo
- rojo se calcula automaticamente

### Paso 4. Confirmar

Revisa toda la configuracion antes de crear el KPI.

## 6. Tutorial de formula personalizada

Cuando eliges `Formula personalizada`, el sistema muestra una guia visual completa.

### Que debes hacer

- pensar que quieres medir
- definir los datos a capturar cada mes
- elegir una plantilla de calculo
- revisar la expresion final

### Plantillas disponibles

- porcentaje de cumplimiento
- diferencia
- suma total
- promedio
- formula libre

### Recomendaciones

- usa nombres claros para cada dato
- evita nombres ambiguos
- revisa que la formula represente el KPI real
- si quieres un porcentaje, normalmente debes multiplicar por 100

## 7. Problemas comunes

### El KPI personalizado no se puede crear

Si aparece un error relacionado con `kpis_formula_tipo_check`, la base de datos no tiene aplicada la migracion de formula personalizada.

Debes ejecutar:

- `docs/custom-formula-migration.sql`

### No puedo borrar un 0 de un input

Ese comportamiento ya fue corregido en los inputs numericos del sistema. Si aun lo ves, recarga la aplicacion.

### Veo letras raras o texto roto

Haz una recarga dura del navegador o reinicia el servidor de desarrollo si acabas de actualizar el proyecto.
