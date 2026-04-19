# 🌊 Flujo de Usuario - Guía Paso a Paso

Este documento describe el "User Journey" o recorrido que realiza un colaborador para gestionar sus KPIs en el sistema.

---

## 1. Onboarding (Primer Encuentro)
- **Acción:** El usuario ingresa a la aplicación.
- **Evento:** Si es la primera vez, se activa el **Tutorial Interactivo (Driver.js)**.
- **Objetivo:** Que el usuario entienda qué es el Dashboard, cómo leer las tarjetas y dónde están los filtros.

## 2. Selección de Contexto (Filtros)
- **Acción:** El usuario utiliza los selectores de **Año** y **Mes** en la cabecera.
- **Evento:** El sistema actualiza todas las tarjetas para mostrar los resultados de ese periodo específico.
- **Objetivo:** Consultar el desempeño histórico o prepararse para capturar el mes actual.

## 3. Identificación de Pendientes
- **Acción:** El usuario busca tarjetas con el texto **"Pendiente"** o que tengan una animación de **pulso (Pulse Animation)** en el botón.
- **Objetivo:** Priorizar la captura de datos de los KPIs que aún no tienen resultados en el mes.

## 4. Captura de Datos (El Formulario)
- **Acción:** Clic en el botón **"Capturar"**.
- **Evento:** Se abre el `CaptureModal`. 
- **Sub-pasos:**
  1. Leer la **Caja Azul de Ayuda** para entender la regla de ese KPI.
  2. Ingresar fechas, marcar checkboxes o introducir números (según el tipo de KPI).
  3. Clic en **"Guardar Registro"**.
- **Resultado:** Se muestra una notificación (`toast`) de éxito y la tarjeta se actualiza automáticamente con su nuevo color de semáforo.

## 5. Análisis de Tendencias (Detalle)
- **Acción:** Clic sobre el nombre de cualquier KPI o en el icono **(?)**.
- **Evento:** Se despliega el `KpiDetailModal`.
- **Análisis:**
  - Ver la gráfica **Isométrica 3D** para comparar vs meses anteriores.
  - Ver el cuadro de **Variación (Delta)** (ej: +5% vs mes anterior).
  - Consultar la **Bitácora de Observaciones** para entender por qué se dio ese resultado.

## 6. Auditoría y Seguimiento
- **Acción:** Explorar áreas mediante el filtro de "Todas las Áreas".
- **Objetivo:** Tener una visión global del cumplimiento operativo de la empresa.

---
*Flujo optimizado para velocidad y reducción de errores humanos.*
