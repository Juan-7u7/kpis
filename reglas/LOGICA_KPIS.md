# 🧠 Lógica de Backend, Fórmulas y Semáforos

Este documento técnico explica la "Caja Negra" del sistema: cómo se transforman los datos de entrada en resultados porcentuales y colores.

---

## 1. Módulo de Cálculo (Engine)

El motor reside en `api/index.ts`. No permite cálculos manuales en el frontend para evitar manipulaciones; toda la matemática sucede en el servidor.

---

## 2. Tipos de KPIs y sus Fórmulas

### 🟢 A. Tipo: `si_no`
- **Uso:** KPIs Documentales simples (ej. Envío de reportes).
- **Lógica:** Recibe un valor booleano.
- **Fórmula:** 
  - `TRUE = 100%`
  - `FALSE = 0%`
- **Semáforo:** 100% (Verde), 0% (Rojo).

### 🔵 B. Tipo: `documental_doble` (KPI 1 y 2)
- **Uso:** Auditorías donde se piden dos documentos (Presupuesto y Plan).
- **Fórmula:**
  - `(Documentos_entregados / 2) * 100`
  - 2 piezas → 100%
  - 1 pieza → 50%
  - 0 piezas → 0%

### 🟡 C. Tipo: `cumplidos_programados` (KPI 3 y 6)
- **Uso:** Eficacia en juntas, cursos y simulacros.
- **Fórmula:** `(Eventos_Cumplidos / Eventos_Programados) * 100`
- **Edge Case:** Si `Programados = 0`, el sistema lo marca como "N/A" para no arrojar errores de división por cero.

### 🟠 D. Tipo: `correctos_total` (KPI 4)
- **Uso:** Calidad operativa (Checklists).
- **Fórmula:** `(Operaciones_Correctas / Total_Operaciones) * 100`

### 🟣 E. Tipo: `entregas_a_tiempo` (KPI 5 - Crítico)
- **Uso:** Puntualidad en entrega de información.
- **Entrada:** Un listado de eventos con `fecha_solicitud` y `fecha_entrega`.
- **Lógica Individual:** `Días = Fecha_Entrega - Fecha_Solicitud`. Si `Días <= 2` → **ÉXITO**.
- **Fórmula Mensual:** `(Eventos_ÉXITO / Total_Eventos_Mes) * 100`

---

## 3. Configuración de Semáforos

Los límites no están fijos en el código; se leen de la vista `v_kpis_detalle` (columnas `semaforo_verde_min` y `semaforo_amarillo_min`).

### Regla por Defecto:
1. **Resultado >= Verde_Min (100%):** 🟢 Verde.
2. **Resultado >= Amarillo_Min (80%):** 🟡 Amarillo.
3. **Resultado < Amarillo_Min:** 🔴 Rojo.

---

## 4. Estructura de Persistencia
Cada vez que se guarda una captura:
1. Se limpia el resultado anterior para ese KPI/Mes/Año.
2. Se inserta el nuevo registro en la tabla de resultados. 
3. **Propagación:** El frontend detecta el cambio y refresca el tablero en tiempo real.

---
*Documentación técnica para asegurar la transparencia matemática del sistema.*
