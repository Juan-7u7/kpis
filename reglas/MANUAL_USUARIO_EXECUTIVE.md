# 📗 MANUAL OFICIAL DE USUARIO: SISTEMA KPI'S

---

## 📌 1. PRESENTACIÓN DEL SISTEMA
El sistema **KPI's** es una plataforma de inteligencia operativa diseñada para centralizar, calcular y analizar los Indicadores Clave de Desempeño de la organización. Su objetivo principal es eliminar la ambigüedad en la captura de datos y proporcionar una visualización clara del cumplimiento frente a las metas establecidas.

---

## 🚥 2. ENTENDIMIENTO DEL SEMÁFORO (KPI SCORING)
El sistema evalúa cada resultado automáticamente y asigna un color basado en rangos técnicos:

| Estado | Rango | Interpretación |
| :--- | :--- | :--- |
| **Verde (Óptimo)** | **100%** | Se ha cumplido con la meta total definida. |
| **Amarillo (Alerta)** | **80% a 99%** | El desempeño es aceptable pero muestra áreas de oportunidad. |
| **Rojo (Riesgo)** | **< 80%** | Incumplimiento crítico. Requiere revisión de procesos. |
| **Gris (Pendiente)** | **N/A** | No se han capturado datos para este periodo aún. |

---

## 🎛️ 3. NAVEGACIÓN Y FILTROS
Al ingresar al Dashboard, usted encontrará las siguientes herramientas de control:
1.  **Selector de Año y Mes:** Ubicados en la barra superior. Cambie estos valores para consultar meses anteriores o prepararse para capturar el mes actual.
2.  **Barra de Búsqueda:** Escriba el nombre de un KPI o área para filtrar rápidamente los resultados visibles.
3.  **Filtro por Área:** Un menú desplegable que le permite enfocarse solo en "Mantenimiento", "Seguridad" o "Cumplimiento".

---

## 📝 4. GUÍA DE CAPTURA POR TIPO DE KPI
El sistema adapta sus formularios según la naturaleza de lo que se mide. Aquí se explica cómo llenar cada uno:

### A. KPIs de Verificación Documental (Ej: Análisis de Mantto.)
- **Qué hacer:** Marque las casillas "Presupuesto" y/o "Plan de Trabajo" si ya cuenta con ellos.
- **Resultado:** Si marca ambos obtiene 100%. Si marca uno obtiene 50%.
- **Consejo:** Deje un comentario en el campo de "Observaciones" si falta algún documento para justificar el 50%.

### B. KPIs de Conteo Simple (Ej: Simulacros y Capacitación)
- **Campos:** 
  - **Programados:** Cuántas actividades se planearon en el mes.
  - **Cumplidos:** Cuántas se realizaron realmente.
- **Regla:** Nunca ingrese un número de "Cumplidos" mayor al de "Programados".

### C. KPIs de Operaciones (Ej: Checklist Operacional)
- **Campos:** 
  - **Total Operaciones:** La suma total de vuelos o movimientos del mes.
  - **Correctas:** Cuántas de esas operaciones cumplieron con el procedimiento al 100%.
- **Nota:** Si no hubo operaciones en el mes, deje ambos campos en 0. El sistema marcará un estado de "Sin Actividad" en lugar de un error.

### D. KPIs de Tiempos y Fechas (Ej: Entrega de Info.)
- **Acción:** Haga clic en "Agregar Evento" por cada entrega realizada en el mes.
- **Dato:** Ingrese la Fecha de Solicitud y la Fecha de Entrega.
- **Lógica:** El sistema calcula los días transcurridos. Para ganar el "Verde", la diferencia debe ser de 2 días o menos.

---

## 📈 5. ANÁLISIS DE DATOS E HISTÓRICO
Para profundizar en el análisis de un indicador:
1.  **Gráfica Isométrica (Efecto 3D):** Al hacer clic en el KPI, verá barras que representan los 12 meses del año. La altura de la barra es proporcional al porcentaje obtenido.
2.  **Comparativa Mensual:** Debajo del título verá una flecha (verde o roja). Esta indica si su desempeño mejoró o empeoró respecto al mes inmediatamente anterior.
3.  **Bitácora de Historial:** Use la tabla inferior para leer los comentarios de otros colaboradores en meses pasados. Esto ayuda a identificar patrones de falla.

---

## ❓ 6. PREGUNTAS FRECUENTES (FAQ)
- **¿Puedo corregir una captura?** 
  Sí. Al hacer clic en "Actualizar" puede modificar los datos y el sistema recalculará el semáforo al instante.
- **¿Por qué mi KPI sale en 0% si capturé datos?**
  Revise que los datos ingresados sean correctos (ej: que no haya puesto 0 en cumplidos). Si es un KPI documental, verifique que las casillas estén marcadas.
- **¿El Dashboard se actualiza solo?**
  Sí. En cuanto usted guarda un cambio, el servidor procesa los datos y refresca el tablero global.

---
*Fin del documento oficial.*
*(Este archivo está diseñado para ser copiado y pegado en Microsoft Word)*
