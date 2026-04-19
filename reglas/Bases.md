# fase0_kpis.md

## Objetivo
Definir la base funcional del software de KPIs para que el agente pueda construir el proyecto sin ambigüedades.

---

## Reglas base confirmadas
- Todos los KPIs son mensuales.
- Ningún KPI depende de otro KPI.
- El usuario solo captura datos.
- El sistema debe traer la fórmula ya definida.
- El semáforo se diseña dentro del sistema.
- La salida final debe verse como dashboard con gráficas similares al Excel.
- El sistema debe ser responsivo para móvil, tablet y desktop.

---

## Áreas detectadas

### 1. Mantenimiento
KPIs:
- Análisis de mantenimiento programado
- Control y restock de inventario en fechas que no interfieran en la operación

### 2. Seguridad Operacional
KPIs:
- Cumplimiento en simulacros, capacitación, juntas, etc.
- Cumplimiento de procedimientos de checklist operacional
- Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días

### 3. Cumplimiento normativo y de capacitación
KPIs:
- Cumplir con programación de cursos del PSA
- Envío de reportes mensuales del helipuerto de corona (HGE)

---

## Matriz funcional de KPIs

### KPI 1
**Área:** Mantenimiento  
**Nombre:** Análisis de mantenimiento programado  
**Meta:** Presentar presupuesto y plan de trabajo  
**Frecuencia:** Mensual  
**Tipo de resultado:** Cumplimiento porcentual  

**Datos de entrada mensuales:**
- Presupuesto
- Plan de trabajo

**Regla de cálculo confirmada:**
- Si presupuesto y plan de trabajo están completos → 100%
- Si solo uno está completo → 50%
- Si faltan ambos → 0%

**Tipo de captura:**
- Binaria documental

**Visualización sugerida:**
- Barras comparativas por mes
- Tabla de detalle mensual
- Justificación opcional

---

### KPI 2
**Área:** Mantenimiento  
**Nombre:** Control y restock de inventario en fechas que no interfieran en la operación  
**Meta:** Presentar presupuesto y plan de trabajo  
**Frecuencia:** Mensual  
**Tipo de resultado:** Cumplimiento porcentual  

**Datos de entrada mensuales:**
- Presupuesto
- Plan de trabajo

**Regla de cálculo confirmada:**
- Si presupuesto y plan de trabajo están completos → 100%
- Si solo uno está completo → 50%
- Si faltan ambos → 0%

**Tipo de captura:**
- Binaria documental

**Visualización sugerida:**
- Barras comparativas por mes
- Tabla de detalle mensual
- Justificación opcional

---

### KPI 3
**Área:** Seguridad Operacional  
**Nombre:** Cumplimiento en simulacros, capacitación, juntas, etc.  
**Meta:** Revisión de lista de asistencia  
**Frecuencia:** Mensual  
**Tipo de resultado:** Cumplimiento porcentual  

**Datos de entrada mensuales:**
- Número de eventos programados
- Número de eventos cumplidos

**Fórmula:**
- `(cumplidos / programados) * 100`

**Reglas:**
- Si programados = 0, marcar como "sin actividad" o "no aplica"
- No dividir entre cero

**Tipo de captura:**
- Conteo

**Visualización sugerida:**
- Indicador circular
- % por mes
- Detalle de cumplidos vs programados

---

### KPI 4
**Área:** Seguridad Operacional  
**Nombre:** Cumplimiento de procedimientos de checklist operacional  
**Meta:** Documento operativo conforme a la operación realizada  
**Frecuencia:** Mensual  
**Tipo de resultado:** Cumplimiento porcentual  

**Datos de entrada mensuales:**
- Total de operaciones
- Operaciones con procedimiento correcto

**Fórmula:**
- `(operaciones con procedimiento correcto / total de operaciones) * 100`

**Reglas:**
- Si total de operaciones = 0, marcar como "no aplica" o "sin operaciones"
- El sistema debe guardar trazabilidad del total y del correcto

**Tipo de captura:**
- Conteo operativo

**Visualización sugerida:**
- Barras verticales por mes
- % de cumplimiento
- Comparativo mensual

---

### KPI 5
**Área:** Seguridad Operacional  
**Nombre:** Entrega de información operacional en tiempo y forma para presupuestos y cierres de vuelos, no mayor a 2 días  
**Meta:** Entrega en no más de 2 días hábiles  
**Frecuencia:** Mensual  
**Tipo de resultado:** Días de entrega y cumplimiento porcentual  

**Datos de entrada mensuales:**
- Fecha de solicitud
- Fecha de entrega
- Puede haber varias entregas en un mismo mes

**Fórmula base:**
- `dias_entrega = fecha_entrega - fecha_solicitud`

**Regla de cumplimiento por evento:**
- Si días <= 2 → evento cumplido
- Si días > 2 → evento incumplido

**Regla de cálculo mensual confirmada:**
- `(entregas en tiempo / total de entregas del mes) * 100`

**Tipo de captura:**
- Fechas

**Visualización sugerida:**
- Barras por número de días
- Línea de límite objetivo en 2 días
- Resumen mensual de entregas en tiempo vs fuera de tiempo

---

### KPI 6
**Área:** Cumplimiento normativo y de capacitación  
**Nombre:** Cumplir con programación de cursos del PSA  
**Meta:** Correo de confirmación del proveedor  
**Frecuencia:** Mensual  
**Tipo de resultado:** Sí/No convertido a porcentaje  

**Datos de entrada mensuales:**
- Confirmación del proveedor: Sí / No

**Fórmula:**
- Sí = 100%
- No = 0%

**Tipo de captura:**
- Binaria documental

**Visualización sugerida:**
- Barras simples por mes
- Promedio acumulado
- Estado textual

---

### KPI 7
**Área:** Cumplimiento normativo y de capacitación  
**Nombre:** Envío de reportes mensuales del helipuerto de corona (HGE)  
**Meta:** Acuse del reporte mensual de HGE  
**Frecuencia:** Mensual  
**Tipo de resultado:** Sí/No convertido a porcentaje  

**Datos de entrada mensuales:**
- Acuse recibido: Sí / No

**Fórmula:**
- Sí = 100%
- No = 0%

**Tipo de captura:**
- Binaria documental

**Visualización sugerida:**
- Barras por mes
- Resumen promedio
- Estado textual

---

## Tipos de captura detectados

### Tipo A — Binario documental
Para KPIs donde se valida existencia de evidencia.

Ejemplos:
- presupuesto
- plan de trabajo
- correo de confirmación
- acuse de reporte

**Valor capturable:**
- Sí / No
- opcional: comentario
- opcional futuro: archivo o evidencia

---

### Tipo B — Conteo
Para KPIs que comparan ejecutado vs programado.

Ejemplo:
- simulacros / juntas / capacitación

**Valor capturable:**
- programados
- cumplidos

---

### Tipo C — Conteo operativo
Para procedimientos correctos sobre total de operaciones.

Ejemplo:
- checklist operacional

**Valor capturable:**
- total de operaciones
- operaciones correctas

---

### Tipo D — Fechas
Para KPIs medidos por tiempo de respuesta.

Ejemplo:
- entrega de información operacional

**Valor capturable:**
- fecha de solicitud
- fecha de entrega

**Valor calculado por el sistema:**
- días transcurridos
- cumplimiento por evento
- cumplimiento mensual

---

## Reglas del semáforo confirmadas

### Regla general
- Verde: 100%
- Amarillo: 80% a 99%
- Rojo: menor a 80%

### Regla para KPI binario
- Sí = verde
- No = rojo

### Regla para KPI de días de entrega
- <= 2 días = verde
- 3 días = amarillo
- > 3 días = rojo

---

## Flujo funcional del sistema
1. El usuario selecciona mes.
2. El usuario selecciona área o KPI.
3. El usuario captura datos.
4. El sistema valida los datos.
5. El sistema calcula automáticamente.
6. El sistema guarda resultado.
7. El sistema asigna color de semáforo.
8. El sistema muestra dashboard y gráfica.

---

## Reglas obligatorias para el agente
- No inventar fórmulas no definidas aquí.
- No cambiar metas sin validación funcional.
- No mezclar captura con cálculo.
- No mezclar cálculo con visualización.
- Todo KPI debe ser trazable desde la captura hasta el dashboard.
- Toda visualización debe poder representarse en móvil, tablet y desktop.
- Las gráficas deben inspirarse en el Excel, pero priorizando claridad y rendimiento.
- Si una gráfica 3D afecta legibilidad o rendimiento, degradar a 2D.

---

## Resultado esperado de esta fase
Con este documento el agente ya puede construir:
- catálogo de áreas
- catálogo de KPIs
- tipos de captura
- reglas de cálculo
- semáforo base
- estructura del dashboard
- históricos mensuales
- base para backend, frontend y Supabase
