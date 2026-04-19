# Formulas y reglas de negocio

Este documento resume como calcula el sistema cada tipo de KPI y como se asigna el semaforo.

## 1. Cumplimiento si / no

### Uso

Para actividades que solo pueden estar cumplidas o no cumplidas.

### Calculo

- evidencia marcada = 100
- evidencia no marcada = 0

### Ejemplos

- envio de reporte
- confirmacion documental
- entrega de acuse

## 2. Documental doble

### Uso

Para procesos que necesitan dos documentos o dos evidencias.

### Calculo

- 2 documentos entregados = 100
- 1 documento entregado = 50
- 0 documentos entregados = 0

### Ejemplos

- presupuesto + plan de trabajo
- factura + xml

## 3. Cumplidos / programados

### Uso

Para comparar lo realizado contra lo planeado.

### Calculo

```text
(cumplidos / programados) * 100
```

### Ejemplos

- simulacros
- capacitaciones
- auditorias

## 4. Correctos / total operaciones

### Uso

Para medir calidad operativa o ejecucion correcta.

### Calculo

```text
(operaciones_correctas / total_operaciones) * 100
```

### Ejemplos

- checklist operativo
- inspecciones correctas
- procesos sin error

## 5. Entregas a tiempo

### Uso

Para medir cumplimiento contra un limite de dias.

### Logica

- cada entrega se evalua contra un limite de dias configurado
- el porcentaje se calcula con base en cuantas entregas cumplen ese limite

### Calculo

```text
(entregas_en_tiempo / total_entregas) * 100
```

Ademas, el sistema guarda un valor auxiliar con el promedio de dias de entrega.

## 6. Formula personalizada

### Uso

Para KPIs que no entran en ninguna formula predeterminada.

### Como funciona

- el usuario define variables propias
- el usuario elige una plantilla o escribe una expresion libre
- el sistema valida que todas las variables usadas existan
- el sistema calcula el resultado evaluando la expresion con los valores capturados

### Ejemplo

```text
Variables:
- tickets_resueltos
- tickets_recibidos

Formula:
(tickets_resueltos / tickets_recibidos) * 100
```

### Reglas de validacion

- la formula no puede estar vacia
- debe existir al menos una variable
- cada variable debe tener clave unica
- la formula no puede usar variables inexistentes
- no puede dividir entre cero

### Operaciones soportadas

- suma: `+`
- resta: `-`
- multiplicacion: `*`
- division: `/`
- parentesis: `(` y `)`
- numeros constantes

## 7. Semaforo

Cada KPI usa tres estados:

- verde: resultado mayor o igual al umbral verde
- amarillo: resultado mayor o igual al umbral amarillo y menor al verde
- rojo: resultado menor al umbral amarillo

## 8. Redondeo

- el sistema calcula y guarda con precision decimal
- la visualizacion se redondea para mostrar porcentajes legibles

## 9. Mantenimiento

Si agregas o cambias tipos de formula, debes revisar:

- `src/components/CreateKpiModal.tsx`
- `src/components/CaptureModal.tsx`
- `src/lib/customFormula.ts`
- `api/index.ts`
- `bd.sql`
- `docs/custom-formula-migration.sql` si la base ya existe
